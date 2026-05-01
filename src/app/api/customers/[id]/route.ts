import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    const customer = {
      ...data,
      customer_tier: data.total_spent >= 1000000 ? 'VIP' : data.total_spent >= 500000 ? 'Regular' : 'New',
    }

    return NextResponse.json(customer)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('customers')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        total_orders: body.total_orders,
        total_spent: body.total_spent,
        last_order_date: body.last_order_date,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      ...data,
      customer_tier: data.total_spent >= 1000000 ? 'VIP' : data.total_spent >= 500000 ? 'Regular' : 'New',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
