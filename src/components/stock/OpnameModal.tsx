'use client'

import { useState } from 'react'
import { X, Loader2, ClipboardList, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { Product } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const OPNAME_REASONS = ['Kerusakan Barang', 'Kehilangan', 'Koreksi Input', 'Penyesuaian Fisik', 'Kadaluarsa', 'Lainnya']

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: (productId: string, newStock: number) => void
  product: Product | null
}

export default function OpnameModal({ open, onClose, onSuccess, product }: Props) {
  const [physicalStock, setPhysicalStock] = useState('')
  const [reason, setReason] = useState(OPNAME_REASONS[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const physNum = physicalStock !== '' ? parseInt(physicalStock) : null
  const diff = physNum !== null && product ? physNum - product.stock : null
  const isDiff = diff !== null && diff !== 0

  async function handleSubmit() {
    if (!product || physNum === null) return
    if (physNum < 0) { toast.error('Stok fisik tidak bisa negatif'); return }
    if (!isDiff) { toast('Stok fisik sama dengan sistem, tidak ada perubahan', { icon: 'ℹ️' }); return }

    setLoading(true)
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, newStock: physNum, reason, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Stock opname berhasil! Stok dikoreksi ${diff! > 0 ? '+' : ''}${diff} unit`)
      onSuccess(product.id, physNum)
      setPhysicalStock(''); setNotes(''); setReason(OPNAME_REASONS[0])
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <ClipboardList size={16} className="text-blue-500" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-gray-800">Stock Opname</div>
              <div className="text-[11px] text-gray-400 truncate max-w-[180px]">{product.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Sistem vs fisik */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-[10px] text-gray-400 mb-1">Stok Sistem</div>
              <div className="text-[24px] font-bold text-gray-800">{product.stock}</div>
            </div>
            <div className="text-center">
              {diff === null ? <Minus size={20} className="text-gray-300 mx-auto" />
                : diff > 0 ? <ArrowUp size={20} className="text-green-500 mx-auto" />
                : diff < 0 ? <ArrowDown size={20} className="text-red-500 mx-auto" />
                : <Minus size={20} className="text-gray-400 mx-auto" />}
              {diff !== null && diff !== 0 && (
                <div className={cn('text-[12px] font-bold mt-1', diff > 0 ? 'text-green-600' : 'text-red-500')}>
                  {diff > 0 ? '+' : ''}{diff}
                </div>
              )}
            </div>
            <div className="text-center p-3 rounded-xl border-2 border-dashed border-[rgba(104,90,255,0.3)]">
              <div className="text-[10px] text-gray-400 mb-1">Stok Fisik</div>
              <div className={cn('text-[24px] font-bold', physNum !== null ? 'text-[#685AFF]' : 'text-gray-300')}>
                {physNum ?? '?'}
              </div>
            </div>
          </div>

          {isDiff && (
            <div className={cn('p-3 rounded-xl text-[12px] font-medium', diff! > 0 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100')}>
              {diff! > 0
                ? `✅ Stok fisik lebih banyak ${diff} unit dari sistem`
                : `⚠️ Stok fisik kurang ${Math.abs(diff!)} unit dari sistem`}
            </div>
          )}

          <div>
            <label className="label">Stok Fisik (hasil hitung) *</label>
            <input
              type="number" min="0" value={physicalStock} onChange={e => setPhysicalStock(e.target.value)}
              placeholder="Masukkan hasil hitung fisik..." className="input-field" autoFocus
            />
          </div>

          <div>
            <label className="label">Alasan Penyesuaian</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="input-field">
              {OPNAME_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Catatan</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detail keterangan..." className="input-field" />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-600 hover:bg-gray-50">Batal</button>
          <button
            onClick={handleSubmit} disabled={loading || physNum === null || physNum < 0}
            className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</> : 'Simpan Opname'}
          </button>
        </div>
      </div>
    </div>
  )
}
