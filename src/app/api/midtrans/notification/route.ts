import { NextRequest, NextResponse } from 'next/server'
import { verifyMidtransNotification, validateMidtransSignature, mapMidtransStatus } from '@/lib/midtrans'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Midtrans Notification Handler (Webhook)
 *
 * Setup di Midtrans Dashboard:
 * Settings > Configuration > Payment Notification URL:
 * https://yourdomain.com/api/midtrans/notification
 *
 * PENTING: Endpoint ini TIDAK pakai auth - dipanggil langsung oleh server Midtrans
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Midtrans notification received:', JSON.stringify(body, null, 2))

    // Validasi signature key untuk keamanan
    const isValid = validateMidtransSignature(
      body.order_id,
      body.status_code,
      body.gross_amount,
      process.env.MIDTRANS_SERVER_KEY!,
      body.signature_key
    )

    if (!isValid) {
      console.error('Invalid Midtrans signature!')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Verifikasi status ke Midtrans (double-check)
    const statusResponse = await verifyMidtransNotification(body)

    const orderId = statusResponse.order_id
    const transactionStatus = statusResponse.transaction_status
    const fraudStatus = statusResponse.fraud_status
    const paymentType = statusResponse.payment_type

    // Map ke status internal
    const internalStatus = mapMidtransStatus(transactionStatus, fraudStatus)

    // Update database (pakai admin client - bypass RLS)
    const supabase = createAdminClient()

    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('midtrans_order_id', orderId)
      .single()

    if (findError || !transaction) {
      console.error('Transaction not found:', orderId)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Hindari update berulang jika sudah sukses
    if (transaction.status === 'success' && internalStatus !== 'success') {
      return NextResponse.json({ message: 'Already processed' })
    }

    // Update transaksi
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: internalStatus,
        midtrans_transaction_id: statusResponse.transaction_id,
        midtrans_payment_type: paymentType,
        midtrans_raw_response: body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)

    if (updateError) throw updateError

    // Jika sukses: kurangi stok
    if (internalStatus === 'success') {
      const { data: txItems } = await supabase
        .from('transaction_items')
        .select('product_id, quantity, product_name')
        .eq('transaction_id', transaction.id)

      if (txItems) {
        for (const item of txItems) {
          // Kurangi stok
          await supabase.rpc('decrement_stock', {
            p_product_id: item.product_id,
            p_qty: item.quantity,
          })

          // Catat stock log
          await supabase.from('stock_logs').insert({
            product_id: item.product_id,
            change_amount: -item.quantity,
            reason: 'Sales',
            reference_id: transaction.id,
          })
        }
      }
    }

    console.log(`Transaction ${orderId} updated to ${internalStatus}`)
    return NextResponse.json({ message: 'OK', status: internalStatus })
  } catch (error: any) {
    console.error('Midtrans notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
