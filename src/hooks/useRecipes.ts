import { useState, useEffect, useCallback } from 'react'
import { RecipeDB } from '@/types/hpp'
import toast from 'react-hot-toast'

export function useRecipes() {
  const [recipes, setRecipes] = useState<RecipeDB[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRecipes = useCallback(async (activeOnly = true) => {
    setLoading(true)
    try {
      const url = activeOnly ? '/api/recipes?active=true' : '/api/recipes'
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRecipes(data)
    } catch (error: any) {
      toast.error('Gagal memuat resep: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const addRecipe = useCallback(async (recipe: {
    name: string
    description?: string
    total_hpp: number
    selling_price?: number
    ingredients: Array<{
      material_id: string
      quantity: number
      unit: string
      calculated_cost: number
    }>
  }) => {
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRecipes(prev => [...prev, data])
      toast.success('Resep berhasil dibuat!')
      return data
    } catch (error: any) {
      toast.error('Gagal membuat resep: ' + error.message)
      return null
    }
  }, [])

  const updateRecipe = useCallback(async (id: string, updates: Partial<RecipeDB> & { ingredients?: any[] }) => {
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRecipes(prev => prev.map(r => r.id === id ? data : r))
      toast.success('Resep berhasil diupdate!')
      return data
    } catch (error: any) {
      toast.error('Gagal mengupdate resep: ' + error.message)
      return null
    }
  }, [])

  const deleteRecipe = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRecipes(prev => prev.filter(r => r.id !== id))
      toast.success('Resep berhasil dihapus!')
      return true
    } catch (error: any) {
      toast.error('Gagal menghapus resep: ' + error.message)
      return false
    }
  }, [])

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  return {
    recipes,
    loading,
    fetchRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
  }
}
