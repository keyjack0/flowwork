import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const active = searchParams.get('active')

    let query = supabase
      .from('recipes')
      .select('*, ingredients:recipe_ingredients(*, material:raw_materials(*))')

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

    // Start a transaction-like operation
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        name: body.name,
        description: body.description,
        total_hpp: body.total_hpp || 0,
        selling_price: body.selling_price,
        recommended_price: body.recommended_price,
        margin_pct: body.margin_pct,
        profit_per_portion: body.profit_per_portion,
        opex_per_portion: body.opex_per_portion || 0,
        net_profit_per_portion: body.net_profit_per_portion,
      })
      .select()
      .single()

    if (recipeError) throw recipeError

    // Insert ingredients if provided
    if (body.ingredients && body.ingredients.length > 0) {
      const ingredients = body.ingredients.map((ing: any) => ({
        recipe_id: recipe.id,
        material_id: ing.material_id,
        quantity: ing.quantity,
        unit: ing.unit || 'gram',
        calculated_cost: ing.calculated_cost,
        notes: ing.notes,
      }))

      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredients)

      if (ingError) {
        // Rollback: delete the recipe
        await supabase.from('recipes').delete().eq('id', recipe.id)
        throw ingError
      }
    }

    // Fetch complete recipe with ingredients
    const { data: completeRecipe, error: fetchError } = await supabase
      .from('recipes')
      .select('*, ingredients:recipe_ingredients(*, material:raw_materials(*))')
      .eq('id', recipe.id)
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json(completeRecipe)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
