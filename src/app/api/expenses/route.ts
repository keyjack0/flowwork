import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const from = req.nextUrl.searchParams.get('from')
    const to = req.nextUrl.searchParams.get('to')
    const category = req.nextUrl.searchParams.get('category')

    let query = supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })

    if (from) query = query.gte('expense_date', from)
    if (to) query = query.lte('expense_date', to)
    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (error) throw error

    const total = data?.reduce((s, e) => s + Number(e.amount), 0) || 0
    return NextResponse.json({ expenses: data, total })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { category, amount, note, expense_date } = await req.json()

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Jumlah tidak valid' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        category,
        amount: Number(amount),
        note,
        expense_date: expense_date || new Date().toISOString().split('T')[0],
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ expense: data }, { status: 201 })
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
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
