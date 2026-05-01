/**
 * Recipe Database Hook - Bridge between legacy localStorage and Supabase
 */

import { useState, useEffect, useCallback } from 'react'
import { Recipe, RecipeDB, RecipeIngredient } from '@/types/hpp'
import toast from 'react-hot-toast'

// Adapter: Database -> Legacy format
function adaptRecipe(db: RecipeDB): Recipe {
  const ingredients: RecipeIngredient[] = (db.ingredients || []).map(ing => ({
    materialId: ing.material_id,
    materialName: ing.material?.name || 'Unknown',
    useUnit: ing.unit,
    qty: ing.quantity,
    costPerPortion: ing.calculated_cost,
  }))

  return {
    id: db.id,
    name: db.name,
    category: 'Recipe', // default, bisa di-customize
    portionCount: 1, // default
    ingredients,
    addons: [],
    totalIngredientCost: db.total_hpp,
    totalAddonCost: 0,
    totalHPP: db.total_hpp,
    createdAt: db.created_at,
    notes: db.description || undefined,
  }
}

export function useRecipeDatabase() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [synced, setSynced] = useState(false)

  const fetchRecipes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/recipes?active=true')
      const data: RecipeDB[] = await res.json()
      if (!res.ok) throw new Error(data as any)
      setRecipes(data.map(adaptRecipe))
      setSynced(true)
    } catch (error: any) {
      toast.error('Gagal memuat resep dari database')
      setSynced(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const addRecipe = useCallback(async (recipe: Omit<Recipe, 'id' | 'createdAt'>) => {
    if (synced) {
      try {
        const payload = {
          name: recipe.name,
          description: recipe.notes,
          total_hpp: recipe.totalHPP,
          ingredients: recipe.ingredients.map(ing => ({
            material_id: ing.materialId,
            quantity: ing.qty,
            unit: ing.useUnit,
            calculated_cost: ing.costPerPortion,
          })),
        }

        const res = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setRecipes(prev => [...prev, adaptRecipe(data)])
        toast.success('Resep berhasil disimpan ke database!')
        return adaptRecipe(data)
      } catch (error: any) {
        toast.error('Gagal menyimpan ke database: ' + error.message)
        return null
      }
    } else {
      // Fallback: localStorage (existing behavior)
      const newRecipe: Recipe = {
        ...recipe,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }
      setRecipes(prev => [...prev, newRecipe])
      toast.success('Resep ditambahkan (local storage)')
      return newRecipe
    }
  }, [synced])

  const updateRecipe = useCallback(async (id: string, updates: Partial<Recipe>) => {
    if (synced && id.length === 36) {
      try {
        const payload: any = {}
        if (updates.name) payload.name = updates.name
        if (updates.notes) payload.description = updates.notes
        if (updates.totalHPP) payload.total_hpp = updates.totalHPP
        if (updates.ingredients) {
          payload.ingredients = updates.ingredients.map(ing => ({
            material_id: ing.materialId,
            quantity: ing.qty,
            unit: ing.useUnit,
            calculated_cost: ing.costPerPortion,
          }))
        }

        const res = await fetch(`/api/recipes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setRecipes(prev => prev.map(r => r.id === id ? adaptRecipe(data) : r))
        toast.success('Resep berhasil diupdate di database!')
        return adaptRecipe(data)
      } catch (error: any) {
        toast.error('Gagal update database: ' + error.message)
        return null
      }
    } else {
      // LocalStorage update
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
      return null
    }
  }, [synced])

  const deleteRecipe = useCallback(async (id: string) => {
    if (synced && id.length === 36) {
      try {
        const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setRecipes(prev => prev.filter(r => r.id !== id))
        toast.success('Resep dihapus dari database!')
        return true
      } catch (error: any) {
        toast.error('Gagal hapus dari database: ' + error.message)
        return false
      }
    } else {
      setRecipes(prev => prev.filter(r => r.id !== id))
      return true
    }
  }, [synced])

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  return {
    recipes,
    loading,
    synced,
    fetchRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
  }
}
