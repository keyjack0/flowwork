'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'

export function useProducts(filters?: { category?: string; search?: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchProducts() {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase.from('products').select('*').eq('is_active', true)

      if (filters?.category) query = query.eq('category', filters.category)
      if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)

      const { data, error } = await query.order('name')
      if (error) throw error
      setProducts(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [filters?.category, filters?.search])

  return { products, loading, error, refetch: fetchProducts }
}

export function useLowStockProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('products')
      .select('*')
      .filter('stock', 'lte', 'min_stock_alert')
      .eq('is_active', true)
      .order('stock')
      .then(({ data }) => {
        // Filter client-side karena Supabase tidak bisa compare dua kolom langsung
        const lowStock = (data || []).filter(p => p.stock <= p.min_stock_alert)
        setProducts(lowStock)
        setLoading(false)
      })
  }, [])

  return { products, loading }
}
