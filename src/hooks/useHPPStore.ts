'use client'

import { useState, useEffect, useCallback } from 'react'
import { RawMaterialLegacy as RawMaterial, Recipe, OpexConfig } from '@/types/hpp'
import toast from 'react-hot-toast'

type DbRawMaterial = {
  id: string
  name: string
  category: string | null
  buy_price: number
  buy_unit: string
  conversion_rate: number
  yield_pct: number
  price_per_use: number | null
  created_at: string
}

type DbRecipe = {
  id: string
  name: string
  description: string | null
  total_hpp: number
  opex_per_portion: number | null
  ingredients?: Array<{
    material_id: string
    quantity: number
    unit: string
    calculated_cost: number
    material?: { id: string; name: string }
  }>
  created_at: string
}

type DbOpexConfig = {
  id: string
  name: string
  category: 'fixed' | 'variable'
  monthly_amount: number
}

type DbOpexSettings = {
  id: string
  target_portions_per_month: number
  total_monthly_opex: number
  opex_per_portion: number
}

const DEFAULT_OPEX: OpexConfig = {
  items: [],
  targetPortionsPerMonth: 300,
  opexPerPortion: 0,
  totalMonthlyOpex: 0,
}

function inferUseUnit(buyUnit: string) {
  if (buyUnit === 'kg') return 'gram'
  if (buyUnit === 'liter') return 'ml'
  return 'pcs'
}

function mapMaterialFromDb(row: DbRawMaterial): RawMaterial {
  const pricePerUse = row.price_per_use ?? (
    row.conversion_rate > 0 && row.yield_pct > 0
      ? Math.round(row.buy_price / row.conversion_rate / (row.yield_pct / 100))
      : 0
  )

  return {
    id: row.id,
    name: row.name,
    category: row.category || 'Lainnya',
    buyUnit: row.buy_unit,
    useUnit: inferUseUnit(row.buy_unit),
    buyPrice: Number(row.buy_price),
    conversionRate: Number(row.conversion_rate),
    yieldPct: Number(row.yield_pct),
    pricePerUse: Number(pricePerUse || 0),
    createdAt: row.created_at,
  }
}

function mapRecipeFromDb(row: DbRecipe, opexPerPortion: number): Recipe {
  const ingredients = (row.ingredients || []).map((ing) => ({
    materialId: ing.material_id,
    materialName: ing.material?.name || 'Bahan',
    useUnit: ing.unit || 'gram',
    qty: Number(ing.quantity),
    costPerPortion: Number(ing.calculated_cost),
  }))

  const totalIngredientCost = Math.round(ingredients.reduce((s, i) => s + i.costPerPortion, 0))
  const totalAddonCost = 0
  const opex = Number(row.opex_per_portion ?? opexPerPortion)
  const totalHPP = row.total_hpp ? Number(row.total_hpp) : totalIngredientCost + totalAddonCost + opex

  return {
    id: row.id,
    name: row.name,
    category: 'Lainnya',
    portionCount: 1,
    ingredients,
    addons: [],
    totalIngredientCost,
    totalAddonCost,
    totalHPP,
    createdAt: row.created_at,
    notes: row.description || undefined,
  }
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error || 'Request gagal')
  return json as T
}

export function useHPPStore() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [opex, setOpex] = useState<OpexConfig>(DEFAULT_OPEX)
  const [opexSettingsId, setOpexSettingsId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const reloadFromDb = useCallback(async () => {
    const [materialsRes, recipesRes, opexConfigsRes, opexSettingsRes] = await Promise.all([
      req<DbRawMaterial[]>('/api/raw-materials?active=true'),
      req<DbRecipe[]>('/api/recipes?active=true'),
      req<DbOpexConfig[]>('/api/opex'),
      req<DbOpexSettings | null>('/api/opex?type=settings'),
    ])

    const opexItems = (opexConfigsRes || []).map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      monthlyAmount: Number(c.monthly_amount),
    }))
    const totalMonthlyOpex = opexItems.reduce((s, i) => s + i.monthlyAmount, 0)
    const targetPortionsPerMonth = Number(opexSettingsRes?.target_portions_per_month || 300)
    const opexPerPortion = targetPortionsPerMonth > 0
      ? Math.round(totalMonthlyOpex / targetPortionsPerMonth)
      : 0

    setOpexSettingsId(opexSettingsRes?.id || null)
    setMaterials((materialsRes || []).map(mapMaterialFromDb))
    setOpex({
      items: opexItems,
      targetPortionsPerMonth,
      totalMonthlyOpex,
      opexPerPortion,
    })
    setRecipes((recipesRes || []).map((r) => mapRecipeFromDb(r, opexPerPortion)))
  }, [])

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        await reloadFromDb()
      } catch (error: any) {
        if (active) toast.error(`Gagal memuat data HPP: ${error.message}`)
      } finally {
        if (active) setLoaded(true)
      }
    })()

    return () => {
      active = false
    }
  }, [reloadFromDb])

  async function syncOpexSettings(next: OpexConfig) {
    try {
      const payload = {
        type: 'settings',
        id: opexSettingsId || undefined,
        target_portions_per_month: next.targetPortionsPerMonth,
        total_monthly_opex: next.totalMonthlyOpex,
        opex_per_portion: next.opexPerPortion,
      }

      const data = await req<DbOpexSettings>('/api/opex', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setOpexSettingsId(data.id)
    } catch (error: any) {
      toast.error(`Gagal sinkron OPEX settings: ${error.message}`)
    }
  }

  const addMaterial = useCallback(async (m: Omit<RawMaterial, 'id' | 'createdAt' | 'pricePerUse'>) => {
    const pricePerUse = m.conversionRate > 0 && m.yieldPct > 0
      ? Math.round(m.buyPrice / m.conversionRate / (m.yieldPct / 100))
      : 0

    await req('/api/raw-materials', {
      method: 'POST',
      body: JSON.stringify({
        name: m.name,
        category: m.category,
        buy_price: m.buyPrice,
        buy_unit: m.buyUnit,
        conversion_rate: m.conversionRate,
        yield_pct: m.yieldPct,
        price_per_use: pricePerUse,
      }),
    })

    await reloadFromDb()
  }, [reloadFromDb])

  const updateMaterial = useCallback(async (id: string, updates: Partial<RawMaterial>) => {
    const current = materials.find((m) => m.id === id)
    if (!current) return

    const merged = { ...current, ...updates }
    const pricePerUse = merged.conversionRate > 0 && merged.yieldPct > 0
      ? Math.round(merged.buyPrice / merged.conversionRate / (merged.yieldPct / 100))
      : 0

    await req(`/api/raw-materials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: merged.name,
        category: merged.category,
        buy_price: merged.buyPrice,
        buy_unit: merged.buyUnit,
        conversion_rate: merged.conversionRate,
        yield_pct: merged.yieldPct,
        price_per_use: pricePerUse,
      }),
    })

    await reloadFromDb()
  }, [materials, reloadFromDb])

  const deleteMaterial = useCallback(async (id: string) => {
    await req(`/api/raw-materials/${id}`, { method: 'DELETE' })
    await reloadFromDb()
  }, [reloadFromDb])

  const saveRecipe = useCallback(async (recipe: Recipe) => {
    const payload = {
      name: recipe.name,
      description: recipe.notes || null,
      total_hpp: recipe.totalHPP,
      opex_per_portion: opex.opexPerPortion,
      ingredients: recipe.ingredients.map((ing) => ({
        material_id: ing.materialId,
        quantity: ing.qty,
        unit: ing.useUnit,
        calculated_cost: ing.costPerPortion,
      })),
    }

    if (recipes.find((r) => r.id === recipe.id)) {
      await req(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await req('/api/recipes', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }

    await reloadFromDb()
  }, [opex.opexPerPortion, recipes, reloadFromDb])

  const deleteRecipe = useCallback(async (id: string) => {
    await req(`/api/recipes/${id}`, { method: 'DELETE' })
    await reloadFromDb()
  }, [reloadFromDb])

  const cloneRecipe = useCallback(async (id: string) => {
    const original = recipes.find((r) => r.id === id)
    if (!original) return

    await saveRecipe({
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
    })
  }, [recipes, saveRecipe])

  const updateOpex = useCallback(async (updates: Partial<OpexConfig>) => {
    setOpex((prev) => {
      const merged = { ...prev, ...updates }
      const total = merged.items.reduce((s, i) => s + i.monthlyAmount, 0)
      const perPortion = merged.targetPortionsPerMonth > 0 ? Math.round(total / merged.targetPortionsPerMonth) : 0
      const next = { ...merged, totalMonthlyOpex: total, opexPerPortion: perPortion }
      void syncOpexSettings(next)
      return next
    })
  }, [opexSettingsId])

  const addOpexItem = useCallback(async (item: Omit<typeof opex.items[0], 'id'>) => {
    await req('/api/opex', {
      method: 'POST',
      body: JSON.stringify({
        type: 'config',
        name: item.name,
        category: item.category,
        monthly_amount: item.monthlyAmount,
      }),
    })
    await reloadFromDb()
  }, [reloadFromDb])

  const updateOpexItem = useCallback(async (id: string, updates: Partial<typeof opex.items[0]>) => {
    const current = opex.items.find((i) => i.id === id)
    if (!current) return

    const merged = { ...current, ...updates }
    await req(`/api/opex/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: merged.name,
        category: merged.category,
        monthly_amount: merged.monthlyAmount,
      }),
    })
    await reloadFromDb()
  }, [opex.items, reloadFromDb])

  const deleteOpexItem = useCallback(async (id: string) => {
    await req(`/api/opex/${id}`, { method: 'DELETE' })
    await reloadFromDb()
  }, [reloadFromDb])

  return {
    loaded, materials, recipes, opex,
    addMaterial, updateMaterial, deleteMaterial,
    saveRecipe, deleteRecipe, cloneRecipe,
    updateOpex, addOpexItem, updateOpexItem, deleteOpexItem,
  }
}
