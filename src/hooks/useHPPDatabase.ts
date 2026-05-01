/**
 * HPP Database Hook - Bridge between legacy localStorage and Supabase
 *
 * Hook ini mengadaptasi data dari Supabase (snake_case) ke format
 * yang digunakan komponen existing (camelCase)
 */

import { useState, useEffect, useCallback } from 'react'
import { RawMaterial, RawMaterialLegacy, Recipe, RecipeDB, OpexConfig } from '@/types/hpp'
import toast from 'react-hot-toast'

// Adapter: Database -> Legacy format
function adaptMaterial(db: RawMaterial): RawMaterialLegacy {
  return {
    id: db.id,
    name: db.name,
    category: db.category || '',
    buyUnit: db.buy_unit,
    useUnit: 'gram', // default, bisa di-customize
    buyPrice: db.buy_price,
    conversionRate: db.conversion_rate,
    yieldPct: db.yield_pct,
    pricePerUse: db.price_per_use || 0,
    createdAt: db.created_at,
  }
}

// Adapter: Legacy -> Database format
function adaptMaterialToDB(legacy: RawMaterialLegacy): Partial<RawMaterial> {
  return {
    name: legacy.name,
    category: legacy.category,
    buy_unit: legacy.buyUnit,
    buy_price: legacy.buyPrice,
    conversion_rate: legacy.conversionRate,
    yield_pct: legacy.yieldPct,
    price_per_use: legacy.pricePerUse,
  }
}

export function useHPPDatabase() {
  const [materials, setMaterials] = useState<RawMaterialLegacy[]>([])
  const [loading, setLoading] = useState(false)
  const [synced, setSynced] = useState(false)

  // Load from Supabase
  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/raw-materials?active=true')
      const data: RawMaterial[] = await res.json()
      if (!res.ok) throw new Error(data as any)
      setMaterials(data.map(adaptMaterial))
      setSynced(true)
    } catch (error: any) {
      toast.error('Gagal memuat bahan baku dari database')
      // Fallback: tetap gunakan localStorage jika DB gagal
      setSynced(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const addMaterial = useCallback(async (material: Omit<RawMaterialLegacy, 'id' | 'createdAt' | 'pricePerUse'>) => {
    if (synced) {
      // Save to Supabase
      try {
        const res = await fetch('/api/raw-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...material,
            price_per_use: material.buyPrice / material.conversionRate / (material.yieldPct / 100),
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setMaterials(prev => [...prev, adaptMaterial(data)])
        toast.success('Bahan baku berhasil disimpan ke database!')
        return adaptMaterial(data)
      } catch (error: any) {
        toast.error('Gagal menyimpan ke database: ' + error.message)
        return null
      }
    } else {
      // Fallback: localStorage
      const pricePerUse = material.buyPrice / material.conversionRate / (material.yieldPct / 100)
      const newMat: RawMaterialLegacy = {
        ...material,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        pricePerUse: Math.round(pricePerUse),
      }
      setMaterials(prev => [...prev, newMat])
      toast.success('Bahan baku ditambahkan (local storage)')
      return newMat
    }
  }, [synced])

  const updateMaterial = useCallback(async (id: string, updates: Partial<RawMaterialLegacy>) => {
    if (synced && id.length === 36) {
      // UUID format = from Supabase
      try {
        const dbUpdates: Partial<RawMaterial> = {}
        if (updates.name) dbUpdates.name = updates.name
        if (updates.category) dbUpdates.category = updates.category
        if (updates.buyUnit) dbUpdates.buy_unit = updates.buyUnit
        if (updates.buyPrice) {
          dbUpdates.buy_price = updates.buyPrice
          dbUpdates.price_per_use = updates.buyPrice / (updates.conversionRate || 1) / ((updates.yieldPct || 100) / 100)
        }
        if (updates.conversionRate) dbUpdates.conversion_rate = updates.conversionRate
        if (updates.yieldPct) {
          dbUpdates.yield_pct = updates.yieldPct
          dbUpdates.price_per_use = (updates.buyPrice || 0) / (updates.conversionRate || 1) / (updates.yieldPct / 100)
        }

        const res = await fetch(`/api/raw-materials/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbUpdates),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setMaterials(prev => prev.map(m => m.id === id ? adaptMaterial(data) : m))
        toast.success('Bahan baku berhasil diupdate di database!')
        return adaptMaterial(data)
      } catch (error: any) {
        toast.error('Gagal update database: ' + error.message)
        return null
      }
    } else {
      // LocalStorage update
      setMaterials(prev => prev.map(m => {
        if (m.id !== id) return m
        const updated = { ...m, ...updates }
        updated.pricePerUse = updated.buyPrice / updated.conversionRate / (updated.yieldPct / 100)
        return updated
      }))
      toast.success('Bahan baku diupdate (local storage)')
      return null
    }
  }, [synced])

  const deleteMaterial = useCallback(async (id: string) => {
    if (synced && id.length === 36) {
      // UUID = from Supabase
      try {
        const res = await fetch(`/api/raw-materials/${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setMaterials(prev => prev.filter(m => m.id !== id))
        toast.success('Bahan baku dihapus dari database!')
        return true
      } catch (error: any) {
        toast.error('Gagal hapus dari database: ' + error.message)
        return false
      }
    } else {
      // LocalStorage delete
      setMaterials(prev => prev.filter(m => m.id !== id))
      toast.success('Bahan baku dihapus (local storage)')
      return true
    }
  }, [synced])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  return {
    materials,
    loading,
    synced, // true jika connected ke Supabase
    fetchMaterials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
  }
}
