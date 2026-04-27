import { NextRequest, NextResponse } from 'next/server'
import { checkTransactionStatus, mapMidtransStatus } from '@/lib/midtrans'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orderId = req.nextUrl.searchParams.get('orderId')
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

    // Cek status di Midtrans
    const status = await checkTransactionStatus(orderId)
    const internalStatus = mapMidtransStatus(status.transaction_status, status.fraud_status)

    // Update DB jika status berubah
    const { data: tx } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('midtrans_order_id', orderId)
      .single()

    if (tx && tx.status !== internalStatus) {
      await supabase
        .from('transactions')
        .update({ status: internalStatus, midtrans_payment_type: status.payment_type, updated_at: new Date().toISOString() })
        .eq('id', tx.id)
    }

    return NextResponse.json({
      orderId,
      status: internalStatus,
      midtransStatus: status.transaction_status,
      paymentType: status.payment_type,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
