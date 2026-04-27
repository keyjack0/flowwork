import { NextRequest, NextResponse } from 'next/server'
import { createSnapTransaction, createQrisTransaction } from '@/lib/midtrans'
import { createClient } from '@/lib/supabase/server'
import { generateOrderId } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    // Verifikasi user terautentikasi
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { cartItems, paymentType, customerName, customerEmail, taxAmount, discountAmount } = body

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart kosong' }, { status: 400 })
    }

    // Hitung total
    const subtotal = cartItems.reduce((s: number, item: any) => s + (item.selling_price * item.qty), 0)
    const tax = taxAmount || 0
    const discount = discountAmount || 0
    const totalAmount = subtotal + tax - discount
    const totalHPP = cartItems.reduce((s: number, item: any) => s + (item.base_price_modal * item.qty), 0)
    const totalProfit = subtotal - totalHPP - tax + discount // simplified

    // Generate order ID
    const orderId = generateOrderId()

    // Buat transaksi di database dengan status 'pending'
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        cashier_id: user.id,
        total_amount: totalAmount,
        total_hpp: totalHPP,
        total_profit: totalProfit,
        tax_amount: tax,
        discount_amount: discount,
        payment_method: paymentType === 'qris_direct' ? 'qris' : 'midtrans',
        midtrans_order_id: orderId,
        status: 'pending',
      })
      .select()
      .single()

    if (txError) throw txError

    // Insert transaction items
    const items = cartItems.map((item: any) => ({
      transaction_id: transaction.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.qty,
      price_at_time: item.selling_price,
      hpp_at_time: item.base_price_modal,
      subtotal: item.selling_price * item.qty,
    }))

    await supabase.from('transaction_items').insert(items)

    // Buat token Midtrans
    const midtransItems = cartItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: Math.round(item.selling_price),
      quantity: item.qty,
    }))

    // Tambah pajak sebagai item jika ada
    if (tax > 0) {
      midtransItems.push({ id: 'TAX', name: 'PPN (11%)', price: Math.round(tax), quantity: 1 })
    }

    let midtransResponse

    if (paymentType === 'qris_direct') {
      // Langsung charge QRIS via Core API
      midtransResponse = await createQrisTransaction({
        orderId,
        amount: totalAmount,
        customerName: customerName || 'Customer',
        customerEmail: customerEmail || 'customer@flowwork.id',
        items: midtransItems,
      })

      // Update transaksi dengan data QRIS
      await supabase
        .from('transactions')
        .update({
          midtrans_raw_response: midtransResponse,
          midtrans_payment_type: 'qris',
        })
        .eq('id', transaction.id)

      return NextResponse.json({
        success: true,
        type: 'qris_direct',
        transactionId: transaction.id,
        orderId,
        qrCode: midtransResponse.actions?.find((a: any) => a.name === 'generate-qr-code')?.url,
        amount: totalAmount,
        expiry: midtransResponse.expiry_time,
      })
    } else {
      // Snap popup - semua metode pembayaran
      const snapResult = await createSnapTransaction({
        orderId,
        amount: totalAmount,
        customerName: customerName || 'Customer',
        customerEmail: customerEmail || 'customer@flowwork.id',
        items: midtransItems,
        paymentType: paymentType || 'all',
      })

      // Update transaksi dengan snap token
      await supabase
        .from('transactions')
        .update({
          midtrans_snap_token: snapResult.token,
          midtrans_redirect_url: snapResult.redirect_url,
        })
        .eq('id', transaction.id)

      return NextResponse.json({
        success: true,
        type: 'snap',
        transactionId: transaction.id,
        orderId,
        snapToken: snapResult.token,
        redirectUrl: snapResult.redirect_url,
        amount: totalAmount,
      })
    }
  } catch (error: any) {
    console.error('Midtrans create transaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal membuat transaksi' },
      { status: 500 }
    )
  }
}
