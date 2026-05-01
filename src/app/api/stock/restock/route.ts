import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - restock produk
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { productId, qty, reason, notes } = await req.json()
    if (!productId) return NextResponse.json({ error: 'productId wajib diisi' }, { status: 400 })
    if (!qty || qty <= 0) return NextResponse.json({ error: 'Qty harus lebih dari 0' }, { status: 400 })

    const { data: product } = await supabase.from('products').select('stock, name').eq('id', productId).single()
    if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })

    const newStock = product.stock + qty
    await supabase.from('products').update({ stock: newStock, updated_at: new Date().toISOString() }).eq('id', productId)
    await supabase.from('stock_logs').insert({
      product_id: productId, change_amount: qty, reason: reason || 'Restock',
      created_by: user.id,
    })

    return NextResponse.json({ success: true, previousStock: product.stock, newStock, productName: product.name })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
