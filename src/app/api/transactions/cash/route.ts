import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateOrderId } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { cartItems, taxAmount, discountAmount, notes } = await req.json()

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart kosong' }, { status: 400 })
    }

    const subtotal = cartItems.reduce((s: number, item: any) => s + item.selling_price * item.qty, 0)
    const tax = taxAmount || 0
    const discount = discountAmount || 0
    const totalAmount = subtotal + tax - discount
    const totalHPP = cartItems.reduce((s: number, item: any) => s + item.base_price_modal * item.qty, 0)
    const totalProfit = subtotal - totalHPP

    const orderId = generateOrderId()

    // Insert transaksi langsung success (cash = langsung diterima)
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        cashier_id: user.id,
        total_amount: totalAmount,
        total_hpp: totalHPP,
        total_profit: totalProfit,
        tax_amount: tax,
        discount_amount: discount,
        payment_method: 'cash',
        midtrans_order_id: orderId,
        status: 'success',
        notes,
      })
      .select()
      .single()

    if (error) throw error

    // Insert items
    await supabase.from('transaction_items').insert(
      cartItems.map((item: any) => ({
        transaction_id: transaction.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.qty,
        price_at_time: item.selling_price,
        hpp_at_time: item.base_price_modal,
        subtotal: item.selling_price * item.qty,
      }))
    )

    // Kurangi stok langsung
    for (const item of cartItems) {
      await supabase.rpc('decrement_stock', { p_product_id: item.id, p_qty: item.qty })
      await supabase.from('stock_logs').insert({
        product_id: item.id,
        change_amount: -item.qty,
        reason: 'Sales',
        reference_id: transaction.id,
        created_by: user.id,
      })
    }

    return NextResponse.json({ success: true, transactionId: transaction.id, orderId })
  } catch (error: any) {
    console.error('Cash transaction error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
