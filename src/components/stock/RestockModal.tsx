'use client'

import { useState } from 'react'
import { X, Loader2, Plus, ArrowUpCircle } from 'lucide-react'
import { Product } from '@/types'
import { formatRupiah } from '@/lib/utils'
import toast from 'react-hot-toast'

const RESTOCK_REASONS = ['Pembelian dari Supplier', 'Retur dari Customer', 'Penyesuaian Opname', 'Produksi Baru', 'Hibah / Hadiah', 'Lainnya']

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: (productId: string, newStock: number) => void
  product: Product | null
}

export default function RestockModal({ open, onClose, onSuccess, product }: Props) {
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState(RESTOCK_REASONS[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const qtyNum = parseInt(qty) || 0
  const newStock = (product?.stock || 0) + qtyNum

  async function handleSubmit() {
    if (!product) return
    if (qtyNum <= 0) { toast.error('Jumlah harus lebih dari 0'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/stock/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, qty: qtyNum, reason, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Stok ${product.name} berhasil ditambah ${qtyNum} unit!`)
      onSuccess(product.id, data.newStock)
      setQty(''); setNotes(''); setReason(RESTOCK_REASONS[0])
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open || !product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center text-xl">
              {product.image_emoji}
            </div>
            <div>
              <div className="text-[14px] font-bold text-gray-800">Tambah Stok</div>
              <div className="text-[11px] text-gray-400 truncate max-w-[160px]">{product.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Stock status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="text-center">
              <div className="text-[11px] text-gray-400 mb-1">Stok Saat Ini</div>
              <div className="text-[22px] font-bold text-gray-800">{product.stock}</div>
            </div>
            <ArrowUpCircle size={24} className="text-green-500" />
            <div className="text-center">
              <div className="text-[11px] text-gray-400 mb-1">Stok Setelah</div>
              <div className={`text-[22px] font-bold ${qtyNum > 0 ? 'text-green-600' : 'text-gray-300'}`}>{newStock}</div>
            </div>
          </div>

          {/* Quick qty buttons */}
          <div>
            <label className="label">Jumlah Tambahan *</label>
            <input
              type="number" min="1" value={qty} onChange={e => setQty(e.target.value)}
              placeholder="Masukkan jumlah..." className="input-field mb-2" autoFocus
            />
            <div className="flex gap-1.5">
              {[5, 10, 25, 50, 100].map(n => (
                <button key={n} type="button" onClick={() => setQty(n.toString())}
                  className="flex-1 py-1.5 text-[11px] font-semibold text-[#685AFF] bg-[rgba(104,90,255,0.08)] rounded-lg hover:bg-[rgba(104,90,255,0.15)] transition-colors">
                  +{n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Alasan Restock</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="input-field">
              {RESTOCK_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Catatan (opsional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tambahan keterangan..." className="input-field" />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">Batal</button>
          <button
            onClick={handleSubmit} disabled={loading || qtyNum <= 0}
            className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-[13px] font-bold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</> : <><Plus size={14} />Tambah {qtyNum > 0 ? qtyNum + ' unit' : 'Stok'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
