'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, X, Check, Package } from 'lucide-react'
import { RawMaterialLegacy as RawMaterial } from '@/types/hpp'
import { formatRupiah, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORIES = ['Bahan Utama', 'Bumbu', 'Minuman', 'Packaging', 'Lainnya']
const BUY_UNITS = ['kg', 'liter', 'pack', 'pcs', 'dus', 'botol', 'sachet']
const USE_UNITS = ['gram', 'ml', 'pcs', 'sdm', 'sdt', 'lembar', 'buah']

interface Props {
  materials: RawMaterial[]
  onAdd: (m: Omit<RawMaterial, 'id' | 'createdAt' | 'pricePerUse'>) => void
  onUpdate: (id: string, updates: Partial<RawMaterial>) => void
  onDelete: (id: string) => void
}

const EMPTY_FORM = {
  name: '', category: 'Bahan Utama', buyUnit: 'kg', useUnit: 'gram',
  buyPrice: '', conversionRate: '1000', yieldPct: '100',
}

export default function MaterialModule({ materials, onAdd, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const pricePerUsePreview = (() => {
    const bp = parseFloat(form.buyPrice) || 0
    const cr = parseFloat(form.conversionRate) || 0
    const yp = parseFloat(form.yieldPct) || 0
    if (!bp || !cr || !yp) return 0
    return Math.round(bp / cr / (yp / 100))
  })()

  function handleSubmit() {
    if (!form.name.trim()) { toast.error('Nama bahan harus diisi'); return }
    if (!form.buyPrice) { toast.error('Harga beli harus diisi'); return }
    const payload = {
      name: form.name.trim(),
      category: form.category,
      buyUnit: form.buyUnit,
      useUnit: form.useUnit,
      buyPrice: parseFloat(form.buyPrice) || 0,
      conversionRate: parseFloat(form.conversionRate) || 1,
      yieldPct: parseFloat(form.yieldPct) || 100,
    }
    if (editId) {
      onUpdate(editId, payload)
      toast.success('Bahan berhasil diupdate')
      setEditId(null)
    } else {
      onAdd(payload)
      toast.success('Bahan berhasil ditambahkan')
    }
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  function startEdit(m: RawMaterial) {
    setForm({
      name: m.name, category: m.category, buyUnit: m.buyUnit, useUnit: m.useUnit,
      buyPrice: m.buyPrice.toString(), conversionRate: m.conversionRate.toString(),
      yieldPct: m.yieldPct.toString(),
    })
    setEditId(m.id)
    setShowForm(true)
  }

  const filtered = materials.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[14px] font-bold text-gray-800">Master Data Bahan Baku</div>
          <div className="text-[12px] text-gray-400">{materials.length} bahan tercatat</div>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM) }}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#685AFF] text-white text-[12px] font-semibold rounded-lg hover:bg-[#4A3FCC] transition-colors"
        >
          <Plus size={14} /> Tambah Bahan
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[rgba(104,90,255,0.04)] border border-[rgba(104,90,255,0.2)] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-semibold text-gray-800">{editId ? 'Edit Bahan' : 'Tambah Bahan Baru'}</div>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nama Bahan *</label>
              <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Daging ayam, tepung terigu, dll" className="input-field" />
            </div>
            <div>
              <label className="label">Kategori</label>
              <select value={form.category} onChange={e => f('category', e.target.value)} className="input-field">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Harga Beli (Rp) *</label>
              <input type="number" value={form.buyPrice} onChange={e => f('buyPrice', e.target.value)} placeholder="50000" className="input-field" />
            </div>
            <div>
              <label className="label">Satuan Beli</label>
              <select value={form.buyUnit} onChange={e => f('buyUnit', e.target.value)} className="input-field">
                {BUY_UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Satuan Pakai</label>
              <select value={form.useUnit} onChange={e => f('useUnit', e.target.value)} className="input-field">
                {USE_UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Konversi (1 {form.buyUnit} = ? {form.useUnit})</label>
              <input type="number" value={form.conversionRate} onChange={e => f('conversionRate', e.target.value)} placeholder="1000" className="input-field" />
            </div>
            <div>
              <label className="label">Yield / Utilisasi (%)</label>
              <input type="number" value={form.yieldPct} onChange={e => f('yieldPct', e.target.value)} placeholder="100" min="1" max="100" className="input-field" />
              <div className="text-[10px] text-gray-400 mt-1">Contoh: 80% artinya 20% terbuang/susut</div>
            </div>
          </div>

          {/* Preview */}
          {pricePerUsePreview > 0 && (
            <div className="mt-3 p-3 bg-white border border-[rgba(104,90,255,0.2)] rounded-lg flex items-center justify-between">
              <span className="text-[12px] text-gray-500">Harga per {form.useUnit} (setelah yield)</span>
              <span className="text-[14px] font-bold text-[#685AFF]">{formatRupiah(pricePerUsePreview)}</span>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-4 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-500 hover:bg-gray-50 transition-colors">Batal</button>
            <button onClick={handleSubmit} className="flex-1 py-2 bg-[#685AFF] text-white rounded-lg text-[12px] font-semibold hover:bg-[#4A3FCC] transition-colors flex items-center justify-center gap-1.5">
              <Check size={13} /> {editId ? 'Update' : 'Simpan'} Bahan
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {materials.length > 0 && (
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari bahan baku..."
          className="input-field mb-3"
        />
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package size={32} className="mx-auto mb-2 opacity-30" />
          <div className="text-[13px]">{materials.length === 0 ? 'Belum ada bahan baku. Klik "Tambah Bahan" untuk mulai.' : 'Bahan tidak ditemukan'}</div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Nama Bahan', 'Kategori', 'Harga Beli', 'Konversi', 'Yield', 'Harga/Satuan Pakai', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-[13px] font-medium text-gray-800">{m.name}</td>
                  <td className="px-3 py-2.5"><span className="badge badge-primary text-[10px]">{m.category}</span></td>
                  <td className="px-3 py-2.5 text-[12px] text-gray-600">{formatRupiah(m.buyPrice)}/{m.buyUnit}</td>
                  <td className="px-3 py-2.5 text-[12px] text-gray-500">1 {m.buyUnit} = {m.conversionRate.toLocaleString()} {m.useUnit}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn('text-[11px] font-semibold', m.yieldPct < 90 ? 'text-yellow-600' : 'text-green-600')}>{m.yieldPct}%</span>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-bold text-[#685AFF]">{formatRupiah(m.pricePerUse)}/{m.useUnit}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(m)} className="p-1.5 text-gray-400 hover:text-[#685AFF] hover:bg-[rgba(104,90,255,0.08)] rounded-lg transition-colors"><Edit2 size={12} /></button>
                      <button onClick={() => { if (confirm('Hapus bahan ini?')) onDelete(m.id) }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
