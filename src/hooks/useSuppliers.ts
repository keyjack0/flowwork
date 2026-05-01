import { useState, useEffect, useCallback } from 'react'
import { Supplier } from '@/types/hpp'
import toast from 'react-hot-toast'

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSuppliers = useCallback(async (activeOnly = true) => {
    setLoading(true)
    try {
      const url = activeOnly ? '/api/suppliers?active=true' : '/api/suppliers'
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuppliers(data)
    } catch (error: any) {
      toast.error('Gagal memuat supplier: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuppliers(prev => [...prev, data])
      toast.success('Supplier berhasil ditambahkan!')
      return data
    } catch (error: any) {
      toast.error('Gagal menambahkan supplier: ' + error.message)
      return null
    }
  }, [])

  const updateSupplier = useCallback(async (id: string, updates: Partial<Supplier>) => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuppliers(prev => prev.map(s => s.id === id ? data : s))
      toast.success('Supplier berhasil diupdate!')
      return data
    } catch (error: any) {
      toast.error('Gagal mengupdate supplier: ' + error.message)
      return null
    }
  }, [])

  const deleteSupplier = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuppliers(prev => prev.filter(s => s.id !== id))
      toast.success('Supplier berhasil dihapus!')
      return true
    } catch (error: any) {
      toast.error('Gagal menghapus supplier: ' + error.message)
      return false
    }
  }, [])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  return {
    suppliers,
    loading,
    fetchSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  }
}
