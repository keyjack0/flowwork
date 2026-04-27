'use client'

import { useState, useEffect, useCallback } from 'react'
import { RawMaterial, Recipe, OpexConfig, Addon } from '@/types/hpp'

const STORAGE_KEYS = {
  materials: 'flowwork_hpp_materials',
  recipes: 'flowwork_hpp_recipes',
  opex: 'flowwork_hpp_opex',
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function save<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

const DEFAULT_OPEX: OpexConfig = {
  items: [
    { id: 'o1', name: 'Sewa Tempat', category: 'fixed', monthlyAmount: 2000000 },
    { id: 'o2', name: 'Gaji Karyawan', category: 'fixed', monthlyAmount: 3000000 },
    { id: 'o3', name: 'Listrik & Air', category: 'fixed', monthlyAmount: 500000 },
  ],
  targetPortionsPerMonth: 300,
  opexPerPortion: 0,
  totalMonthlyOpex: 0,
}

export function useHPPStore() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [opex, setOpex] = useState<OpexConfig>(DEFAULT_OPEX)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setMaterials(load(STORAGE_KEYS.materials, []))
    setRecipes(load(STORAGE_KEYS.recipes, []))
    const savedOpex = load<OpexConfig>(STORAGE_KEYS.opex, DEFAULT_OPEX)
    setOpex(recalcOpex(savedOpex))
    setLoaded(true)
  }, [])

  function recalcOpex(o: OpexConfig): OpexConfig {
    const total = o.items.reduce((s, i) => s + i.monthlyAmount, 0)
    const perPortion = o.targetPortionsPerMonth > 0 ? Math.round(total / o.targetPortionsPerMonth) : 0
    return { ...o, totalMonthlyOpex: total, opexPerPortion: perPortion }
  }

  // Materials
  const addMaterial = useCallback((m: Omit<RawMaterial, 'id' | 'createdAt' | 'pricePerUse'>) => {
    const pricePerUse = m.conversionRate > 0 && m.yieldPct > 0
      ? m.buyPrice / m.conversionRate / (m.yieldPct / 100)
      : 0
    const newM: RawMaterial = {
      ...m, id: crypto.randomUUID(), createdAt: new Date().toISOString(),
      pricePerUse: Math.round(pricePerUse),
    }
    setMaterials(prev => {
      const next = [...prev, newM]
      save(STORAGE_KEYS.materials, next)
      return next
    })
    return newM
  }, [])

  const updateMaterial = useCallback((id: string, updates: Partial<RawMaterial>) => {
    setMaterials(prev => {
      const next = prev.map(m => {
        if (m.id !== id) return m
        const merged = { ...m, ...updates }
        merged.pricePerUse = merged.conversionRate > 0 && merged.yieldPct > 0
          ? Math.round(merged.buyPrice / merged.conversionRate / (merged.yieldPct / 100))
          : 0
        return merged
      })
      save(STORAGE_KEYS.materials, next)
      return next
    })
  }, [])

  const deleteMaterial = useCallback((id: string) => {
    setMaterials(prev => {
      const next = prev.filter(m => m.id !== id)
      save(STORAGE_KEYS.materials, next)
      return next
    })
  }, [])

  // Recipes
  const saveRecipe = useCallback((recipe: Recipe) => {
    setRecipes(prev => {
      const exists = prev.find(r => r.id === recipe.id)
      const next = exists ? prev.map(r => r.id === recipe.id ? recipe : r) : [...prev, recipe]
      save(STORAGE_KEYS.recipes, next)
      return next
    })
  }, [])

  const deleteRecipe = useCallback((id: string) => {
    setRecipes(prev => {
      const next = prev.filter(r => r.id !== id)
      save(STORAGE_KEYS.recipes, next)
      return next
    })
  }, [])

  const cloneRecipe = useCallback((id: string) => {
    const original = recipes.find(r => r.id === id)
    if (!original) return
    const clone: Recipe = {
      ...original,
      id: crypto.randomUUID(),
      name: original.name + ' (Copy)',
      createdAt: new Date().toISOString(),
    }
    setRecipes(prev => {
      const next = [...prev, clone]
      save(STORAGE_KEYS.recipes, next)
      return next
    })
    return clone
  }, [recipes])

  // Opex
  const updateOpex = useCallback((updates: Partial<OpexConfig>) => {
    setOpex(prev => {
      const merged = { ...prev, ...updates }
      const recalced = recalcOpex(merged)
      save(STORAGE_KEYS.opex, recalced)
      return recalced
    })
  }, [])

  const addOpexItem = useCallback((item: Omit<typeof opex.items[0], 'id'>) => {
    setOpex(prev => {
      const newItem = { ...item, id: crypto.randomUUID() }
      const updated = { ...prev, items: [...prev.items, newItem] }
      const recalced = recalcOpex(updated)
      save(STORAGE_KEYS.opex, recalced)
      return recalced
    })
  }, [])

  const updateOpexItem = useCallback((id: string, updates: Partial<typeof opex.items[0]>) => {
    setOpex(prev => {
      const items = prev.items.map(i => i.id === id ? { ...i, ...updates } : i)
      const recalced = recalcOpex({ ...prev, items })
      save(STORAGE_KEYS.opex, recalced)
      return recalced
    })
  }, [])

  const deleteOpexItem = useCallback((id: string) => {
    setOpex(prev => {
      const items = prev.items.filter(i => i.id !== id)
      const recalced = recalcOpex({ ...prev, items })
      save(STORAGE_KEYS.opex, recalced)
      return recalced
    })
  }, [])

  return {
    loaded, materials, recipes, opex,
    addMaterial, updateMaterial, deleteMaterial,
    saveRecipe, deleteRecipe, cloneRecipe,
    updateOpex, addOpexItem, updateOpexItem, deleteOpexItem,
  }
}
