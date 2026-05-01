import { useState, useEffect, useCallback } from 'react'
import { Customer } from '@/types'
import toast from 'react-hot-toast'

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCustomers = useCallback(async (tier?: 'VIP' | 'Regular' | 'New') => {
    setLoading(true)
    try {
      const url = tier ? `/api/customers?tier=${tier}` : '/api/customers'
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCustomers(data)
    } catch (error: any) {
      toast.error('Gagal memuat customer: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'created_at' | 'customer_tier'>) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCustomers(prev => [...prev, data])
      toast.success('Customer berhasil ditambahkan!')
      return data
    } catch (error: any) {
      toast.error('Gagal menambahkan customer: ' + error.message)
      return null
    }
  }, [])

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCustomers(prev => prev.map(c => c.id === id ? data : c))
      toast.success('Customer berhasil diupdate!')
      return data
    } catch (error: any) {
      toast.error('Gagal mengupdate customer: ' + error.message)
      return null
    }
  }, [])

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCustomers(prev => prev.filter(c => c.id !== id))
      toast.success('Customer berhasil dihapus!')
      return true
    } catch (error: any) {
      toast.error('Gagal menghapus customer: ' + error.message)
      return false
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return {
    customers,
    loading,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  }
}
