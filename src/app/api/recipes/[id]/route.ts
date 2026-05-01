import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('recipes')
      .select('*, ingredients:recipe_ingredients(*, material:raw_materials(*))')
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
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

    // Update recipe
    const { error: recipeError } = await supabase
      .from('recipes')
      .update({
        name: body.name,
        description: body.description,
        total_hpp: body.total_hpp,
        selling_price: body.selling_price,
        recommended_price: body.recommended_price,
        margin_pct: body.margin_pct,
        profit_per_portion: body.profit_per_portion,
        opex_per_portion: body.opex_per_portion,
        net_profit_per_portion: body.net_profit_per_portion,
      })
      .eq('id', params.id)

    if (recipeError) throw recipeError

    // Update ingredients if provided
    if (body.ingredients) {
      // Delete existing ingredients
      const { error: deleteError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', params.id)

      if (deleteError) throw deleteError

      // Insert new ingredients
      if (body.ingredients.length > 0) {
        const ingredients = body.ingredients.map((ing: any) => ({
          recipe_id: params.id,
          material_id: ing.material_id,
          quantity: ing.quantity,
          unit: ing.unit || 'gram',
          calculated_cost: ing.calculated_cost,
          notes: ing.notes,
        }))

        const { error: ingError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredients)

        if (ingError) throw ingError
      }
    }

    // Fetch complete recipe with ingredients
    const { data, error } = await supabase
      .from('recipes')
      .select('*, ingredients:recipe_ingredients(*, material:raw_materials(*))')
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
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
      .from('recipes')
      .update({ is_active: false })
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
