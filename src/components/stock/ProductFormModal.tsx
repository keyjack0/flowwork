'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Package } from 'lucide-react'
import { Product } from '@/types'
import { formatRupiah, calculateMargin, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORIES = ['Pakaian', 'Sepatu', 'Aksesoris', 'Tas', 'Elektronik', 'Makanan', 'Minuman', 'Lainnya']
const EMOJIS = ['📦', '👕', '👖', '👟', '🧢', '🧥', '👔', '🩴', '🎒', '🕶️', '💼', '⌚', '📱', '🍕', '☕', '🛍️']

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: (product: Product) => void
  editProduct?: Product | null
}

const EMPTY = {
  sku: '', name: '', description: '', category: 'Pakaian',
  stock: '', min_stock_alert: '5',
  base_price_modal: '', selling_price: '',
  image_emoji: '📦',
}

export default function ProductFormModal({ open, onClose, onSuccess, editProduct }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const isEdit = !!editProduct

  useEffect(() => {
    if (open) {
      if (editProduct) {
        setForm({
          sku: editProduct.sku,
          name: editProduct.name,
          description: editProduct.description || '',
          category: editProduct.category || 'Pakaian',
          stock: editProduct.stock.toString(),
          min_stock_alert: editProduct.min_stock_alert.toString(),
          base_price_modal: editProduct.base_price_modal.toString(),
          selling_price: editProduct.selling_price.toString(),
          image_emoji: editProduct.image_emoji || '📦',
        })
      } else {
        setForm(EMPTY)
      }
    }
  }, [open, editProduct])

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const margin = form.selling_price && form.base_price_modal
    ? calculateMargin(parseFloat(form.selling_price), parseFloat(form.base_price_modal))
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description || null,
        category: form.category,
        stock: parseInt(form.stock) || 0,
        min_stock_alert: parseInt(form.min_stock_alert) || 5,
        base_price_modal: parseFloat(form.base_price_modal),
        selling_price: parseFloat(form.selling_price),
        image_emoji: form.image_emoji,
      }

      const url = '/api/products'
      const method = isEdit ? 'PUT' : 'POST'
      const body = isEdit ? { id: editProduct!.id, ...payload } : payload

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(isEdit ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!')
      onSuccess(data.product)
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="text-[15px] font-bold text-gray-800">{isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}</div>
            <div className="text-[12px] text-gray-400 mt-0.5">{isEdit ? `SKU: ${editProduct?.sku}` : 'Isi detail produk baru'}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Emoji & Name */}
          <div className="flex gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-14 h-14 text-2xl bg-[rgba(104,90,255,0.06)] border-2 border-[rgba(104,90,255,0.2)] rounded-xl hover:border-[#685AFF] transition-colors flex items-center justify-center"
              >
                {form.image_emoji}
              </button>
              {showEmojiPicker && (
                <div className="absolute top-16 left-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-3 grid grid-cols-4 gap-1.5 w-40">
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => { f('image_emoji', e); setShowEmojiPicker(false) }}
                      className={cn('text-xl p-1.5 rounded-lg hover:bg-gray-100 transition-colors', form.image_emoji === e && 'bg-[rgba(104,90,255,0.1)]')}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="label">Nama Produk *</label>
              <input required value={form.name} onChange={e => f('name', e.target.value)} placeholder="Kaos Premium Oversize" className="input-field" />
            </div>
          </div>

          {/* SKU & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">SKU *</label>
              <input required value={form.sku} onChange={e => f('sku', e.target.value)} placeholder="SKU-001" className="input-field" disabled={isEdit} />
            </div>
            <div>
              <label className="label">Kategori</label>
              <select value={form.category} onChange={e => f('category', e.target.value)} className="input-field">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Deskripsi</label>
            <input value={form.description} onChange={e => f('description', e.target.value)} placeholder="Deskripsi singkat produk..." className="input-field" />
          </div>

          {/* Harga */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Harga</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Harga Modal (Rp) *</label>
                <input required type="number" min="0" value={form.base_price_modal} onChange={e => f('base_price_modal', e.target.value)} placeholder="85000" className="input-field" />
              </div>
              <div>
                <label className="label">Harga Jual (Rp) *</label>
                <input required type="number" min="0" value={form.selling_price} onChange={e => f('selling_price', e.target.value)} placeholder="185000" className="input-field" />
              </div>
            </div>
            {margin !== null && (
              <div className={cn('flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-semibold', margin >= 30 ? 'bg-green-50 text-green-700' : margin >= 15 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600')}>
                <span>Margin Profit</span>
                <span>{margin}% {margin >= 30 ? '✅' : margin >= 15 ? '⚠️' : '❌'}</span>
              </div>
            )}
          </div>

          {/* Stok */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Stok</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{isEdit ? 'Stok Saat Ini' : 'Stok Awal'}</label>
                <input type="number" min="0" value={form.stock} onChange={e => f('stock', e.target.value)} placeholder="0" className="input-field" disabled={isEdit} />
                {isEdit && <div className="text-[10px] text-gray-400 mt-1">Gunakan Restock untuk menambah stok</div>}
              </div>
              <div>
                <label className="label">Minimum Alert Stok</label>
                <input type="number" min="1" value={form.min_stock_alert} onChange={e => f('min_stock_alert', e.target.value)} placeholder="5" className="input-field" />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">
            Batal
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#685AFF] text-white rounded-xl text-[13px] font-bold hover:bg-[#4A3FCC] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</> : <>{isEdit ? 'Update Produk' : 'Tambah Produk'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
