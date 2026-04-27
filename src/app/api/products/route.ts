import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const search = req.nextUrl.searchParams.get('search') || ''
    const category = req.nextUrl.searchParams.get('category') || ''
    const lowStock = req.nextUrl.searchParams.get('lowStock') === 'true'

    let query = supabase.from('products').select('*').eq('is_active', true)

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (lowStock) {
      query = query.lte('stock', supabase.from('products').select('min_stock_alert'))
    }

    const { data, error } = await query.order('name')
    if (error) throw error

    return NextResponse.json({ products: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { sku, name, description, stock, min_stock_alert, base_price_modal, selling_price, category, image_emoji } = body

    if (!sku || !name || !base_price_modal || !selling_price) {
      return NextResponse.json({ error: 'Field wajib tidak lengkap' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('products')
      .insert({ sku, name, description, stock: stock || 0, min_stock_alert: min_stock_alert || 5, base_price_modal, selling_price, category, image_emoji: image_emoji || '📦' })
      .select()
      .single()

    if (error) throw error

    // Log stok awal
    if (stock > 0) {
      await supabase.from('stock_logs').insert({
        product_id: data.id,
        change_amount: stock,
        reason: 'Initial Stock',
        created_by: user.id,
      })
    }

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 })

    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ product: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
