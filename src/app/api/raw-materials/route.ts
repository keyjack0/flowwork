import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const active = searchParams.get('active')

    let query = supabase.from('raw_materials').select('*')

    if (active !== null) {
      query = query.eq('is_active', active === 'true')
    }

    const { data, error } = await query.order('name')

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('raw_materials')
      .insert({
        name: body.name,
        category: body.category,
        buy_price: body.buy_price,
        buy_unit: body.buy_unit || 'gram',
        conversion_rate: body.conversion_rate || 1,
        yield_pct: body.yield_pct || 100,
        price_per_use: body.price_per_use,
        supplier: body.supplier,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
