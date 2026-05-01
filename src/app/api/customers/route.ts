import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const tier = searchParams.get('tier')

    let query = supabase.from('customers').select('*')

    if (tier) {
      // Filter by tier based on total_spent
      if (tier === 'VIP') {
        query = query.gte('total_spent', 1000000)
      } else if (tier === 'Regular') {
        query = query.gte('total_spent', 500000).lt('total_spent', 1000000)
      } else if (tier === 'New') {
        query = query.lt('total_spent', 500000)
      }
    }

    const { data, error } = await query.order('total_spent', { ascending: false })

    if (error) throw error

    // Add computed tier field
    const customersWithTier = (data || []).map((c: any) => ({
      ...c,
      customer_tier: c.total_spent >= 1000000 ? 'VIP' : c.total_spent >= 500000 ? 'Regular' : 'New',
    }))

    return NextResponse.json(customersWithTier)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        total_orders: body.total_orders || 0,
        total_spent: body.total_spent || 0,
        last_order_date: body.last_order_date,
      })
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
