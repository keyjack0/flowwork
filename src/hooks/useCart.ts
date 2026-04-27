'use client'

import { useState, useCallback } from 'react'
import { CartItem, Product } from '@/types'
import toast from 'react-hot-toast'

const TAX_RATE = 0.11

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) {
      toast.error('Stok habis!')
      return
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error(`Stok hanya tersisa ${product.stock}`)
          return prev
        }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      toast.success(`${product.name} ditambahkan`, { duration: 1500 })
      return [...prev, { ...product, qty: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.id !== productId))
  }, [])

  const changeQty = useCallback((productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => i.id === productId ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0)
    )
  }, [])

  const setQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.id !== productId))
      return
    }
    setCart(prev => prev.map(i => i.id === productId ? { ...i, qty } : i))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const itemCount = cart.reduce((s, i) => s + i.qty, 0)
  const subtotal = cart.reduce((s, i) => s + i.selling_price * i.qty, 0)
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax
  const totalHPP = cart.reduce((s, i) => s + i.base_price_modal * i.qty, 0)
  const profit = subtotal - totalHPP

  return {
    cart,
    itemCount,
    subtotal,
    tax,
    total,
    totalHPP,
    profit,
    addToCart,
    removeFromCart,
    changeQty,
    setQty,
    clearCart,
  }
}
