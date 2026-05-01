import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // 'configs' or 'settings'

    if (type === 'settings') {
      const { data, error } = await supabase
        .from('opex_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return NextResponse.json(data || null)
    }

    // Default: return configs
    const { data, error } = await supabase
      .from('opex_configs')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name')

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(_request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await _request.json()
    const type = body.type || 'config'

    if (type === 'settings') {
      // opex_settings menggunakan UUID, jadi jangan asumsi id = 1.
      // Jika id tidak dikirim, ambil row terbaru sebagai target update.
      let targetId = body.id as string | undefined

      if (!targetId) {
        const { data: latest, error: latestError } = await supabase
          .from('opex_settings')
          .select('id')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestError) throw latestError
        targetId = latest?.id
      }

      if (!targetId) {
        const { data: inserted, error: insertError } = await supabase
          .from('opex_settings')
          .insert({
            target_portions_per_month: body.target_portions_per_month,
            total_monthly_opex: body.total_monthly_opex,
            opex_per_portion: body.opex_per_portion,
          })
          .select()
          .single()

        if (insertError) throw insertError
        return NextResponse.json(inserted)
      }

      const { data, error } = await supabase
        .from('opex_settings')
        .update({
          target_portions_per_month: body.target_portions_per_month,
          total_monthly_opex: body.total_monthly_opex,
          opex_per_portion: body.opex_per_portion,
        })
        .eq('id', targetId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    // Default: create config
    const { data, error } = await supabase
      .from('opex_configs')
      .insert({
        name: body.name,
        category: body.category,
        monthly_amount: body.monthly_amount,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
