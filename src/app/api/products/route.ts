import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const search = req.nextUrl.searchParams.get('search') || ''
    const category = req.nextUrl.searchParams.get('category') || ''
    const filter = req.nextUrl.searchParams.get('filter') || 'all'
    const includeInactive = req.nextUrl.searchParams.get('includeInactive') === 'true'

    let query = supabase.from('products').select('*').order('name')
    if (!includeInactive) query = query.eq('is_active', true)
    if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (error) throw error

    let products = data || []
    if (filter === 'low') products = products.filter((p: any) => p.stock > 0 && p.stock <= p.min_stock_alert)
    if (filter === 'out') products = products.filter((p: any) => p.stock === 0)

    return NextResponse.json({ products, total: products.length })
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

    if (!name?.trim()) return NextResponse.json({ error: 'Nama produk wajib diisi' }, { status: 400 })
    if (!sku?.trim()) return NextResponse.json({ error: 'SKU wajib diisi' }, { status: 400 })
    if (!base_price_modal || base_price_modal <= 0) return NextResponse.json({ error: 'Harga modal tidak valid' }, { status: 400 })
    if (!selling_price || selling_price <= 0) return NextResponse.json({ error: 'Harga jual tidak valid' }, { status: 400 })

    const { data, error } = await supabase
      .from('products')
      .insert({
        sku: sku.trim(), name: name.trim(), description: description || null,
        stock: stock || 0, min_stock_alert: min_stock_alert || 5,
        base_price_modal, selling_price, category: category || null,
        image_emoji: image_emoji || '📦', is_active: true,
      })
      .select().single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'SKU sudah digunakan produk lain' }, { status: 400 })
      throw error
    }

    if ((stock || 0) > 0) {
      await supabase.from('stock_logs').insert({
        product_id: data.id, change_amount: stock, reason: 'Initial Stock', created_by: user.id,
      })
    }

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID produk diperlukan' }, { status: 400 })

    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) throw error
    return NextResponse.json({ product: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const { error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
