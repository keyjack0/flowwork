import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - ambil stock logs
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const productId = req.nextUrl.searchParams.get('productId')
    let query = supabase
      .from('stock_logs')
      .select('*, products(name, sku)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (productId) query = query.eq('product_id', productId)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ logs: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - stock opname / adjustment
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { productId, newStock, reason, notes } = await req.json()

    if (!productId || newStock === undefined) {
      return NextResponse.json({ error: 'productId dan newStock wajib diisi' }, { status: 400 })
    }

    // Ambil stok saat ini
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    const changeAmount = newStock - product.stock

    // Update stok
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', productId)

    if (updateError) throw updateError

    // Catat log
    await supabase.from('stock_logs').insert({
      product_id: productId,
      change_amount: changeAmount,
      reason: reason || 'Stock Opname',
      created_by: user.id,
    })

    return NextResponse.json({
      success: true,
      previousStock: product.stock,
      newStock,
      changeAmount,
      productName: product.name,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
