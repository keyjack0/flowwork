import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const productId = req.nextUrl.searchParams.get('productId')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')

    let query = supabase
      .from('stock_logs')
      .select('*, products(name, sku, image_emoji)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (productId) query = query.eq('product_id', productId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ logs: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
