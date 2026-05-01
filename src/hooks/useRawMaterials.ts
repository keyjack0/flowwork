import { useState, useEffect, useCallback } from 'react'
import { RawMaterial } from '@/types/hpp'
import toast from 'react-hot-toast'

export function useRawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMaterials = useCallback(async (activeOnly = true) => {
    setLoading(true)
    try {
      const url = activeOnly ? '/api/raw-materials?active=true' : '/api/raw-materials'
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMaterials(data)
    } catch (error: any) {
      toast.error('Gagal memuat bahan baku: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const addMaterial = useCallback(async (material: Omit<RawMaterial, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    try {
      const res = await fetch('/api/raw-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMaterials(prev => [...prev, data])
      toast.success('Bahan baku berhasil ditambahkan!')
      return data
    } catch (error: any) {
      toast.error('Gagal menambahkan bahan baku: ' + error.message)
      return null
    }
  }, [])

  const updateMaterial = useCallback(async (id: string, updates: Partial<RawMaterial>) => {
    try {
      const res = await fetch(`/api/raw-materials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMaterials(prev => prev.map(m => m.id === id ? data : m))
      toast.success('Bahan baku berhasil diupdate!')
      return data
    } catch (error: any) {
      toast.error('Gagal mengupdate bahan baku: ' + error.message)
      return null
    }
  }, [])

  const deleteMaterial = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/raw-materials/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMaterials(prev => prev.filter(m => m.id !== id))
      toast.success('Bahan baku berhasil dihapus!')
      return true
    } catch (error: any) {
      toast.error('Gagal menghapus bahan baku: ' + error.message)
      return false
    }
  }, [])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  return {
    materials,
    loading,
    fetchMaterials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
  }
}
