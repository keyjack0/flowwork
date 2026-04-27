'use client'

import { useState } from 'react'
import { Plus, Trash2, Building2 } from 'lucide-react'
import { OpexConfig } from '@/types/hpp'
import { formatRupiah } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Props {
  opex: OpexConfig
  onAddItem: (item: { name: string; category: 'fixed' | 'variable'; monthlyAmount: number }) => void
  onUpdateItem: (id: string, updates: { name?: string; monthlyAmount?: number }) => void
  onDeleteItem: (id: string) => void
  onUpdateTarget: (target: number) => void
}

const OPEX_SUGGESTIONS = [
  'Sewa Tempat', 'Gaji Karyawan', 'Listrik & Air', 'Gas LPG',
  'Internet', 'Transportasi', 'Kebersihan', 'Lainnya',
]

export default function OpexModule({ opex, onAddItem, onUpdateItem, onDeleteItem, onUpdateTarget }: Props) {
  const [form, setForm] = useState({ name: '', category: 'fixed' as const, monthlyAmount: '' })
  const [showForm, setShowForm] = useState(false)

  function handleAdd() {
    if (!form.name.trim()) { toast.error('Nama biaya harus diisi'); return }
    if (!form.monthlyAmount) { toast.error('Jumlah biaya harus diisi'); return }
    onAddItem({ name: form.name.trim(), category: form.category, monthlyAmount: parseFloat(form.monthlyAmount) || 0 })
    setForm({ name: '', category: 'fixed', monthlyAmount: '' })
    setShowForm(false)
    toast.success('Biaya operasional ditambahkan')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[14px] font-bold text-gray-800">Manajemen OPEX Bulanan</div>
          <div className="text-[12px] text-gray-400">Biaya operasional tetap per bulan</div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#685AFF] text-white text-[12px] font-semibold rounded-lg hover:bg-[#4A3FCC] transition-colors"
        >
          <Plus size={14} /> Tambah Biaya
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          <div className="text-[10px] font-semibold text-red-500 uppercase mb-1">Total OPEX/Bulan</div>
          <div className="text-[18px] font-bold text-gray-800">{formatRupiah(opex.totalMonthlyOpex)}</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <div className="text-[10px] font-semibold text-blue-500 uppercase mb-1">Target Porsi/Bulan</div>
          <input
            type="number"
            value={opex.targetPortionsPerMonth}
            onChange={e => onUpdateTarget(parseInt(e.target.value) || 1)}
            className="text-[18px] font-bold text-gray-800 bg-transparent w-full focus:outline-none"
          />
        </div>
        <div className="bg-[rgba(104,90,255,0.06)] border border-[rgba(104,90,255,0.2)] rounded-xl p-3">
          <div className="text-[10px] font-semibold text-[#685AFF] uppercase mb-1">OPEX per Porsi</div>
          <div className="text-[18px] font-bold text-[#685AFF]">{formatRupiah(opex.opexPerPortion)}</div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-[rgba(104,90,255,0.04)] border border-[rgba(104,90,255,0.2)] rounded-xl p-4 mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="label">Nama Biaya</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                list="opex-suggestions"
                placeholder="Sewa, Gaji, Listrik..."
                className="input-field"
              />
              <datalist id="opex-suggestions">
                {OPEX_SUGGESTIONS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Tipe</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as 'fixed' | 'variable' }))} className="input-field">
                <option value="fixed">Fixed (Tetap)</option>
                <option value="variable">Variable (Tidak Tetap)</option>
              </select>
            </div>
            <div>
              <label className="label">Jumlah/Bulan (Rp)</label>
              <input type="number" value={form.monthlyAmount} onChange={e => setForm(p => ({ ...p, monthlyAmount: e.target.value }))} placeholder="2000000" className="input-field" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-500 hover:bg-gray-50 transition-colors">Batal</button>
            <button onClick={handleAdd} className="px-6 py-2 bg-[#685AFF] text-white rounded-lg text-[12px] font-semibold hover:bg-[#4A3FCC] transition-colors">Simpan</button>
          </div>
        </div>
      )}

      {/* OPEX Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {['Nama Biaya', 'Tipe', 'Jumlah/Bulan', '% dari Total', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {opex.items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-[13px]">
                <Building2 size={24} className="mx-auto mb-2 opacity-30" />
                Belum ada biaya operasional
              </td></tr>
            ) : opex.items.map(item => {
              const pct = opex.totalMonthlyOpex > 0 ? Math.round((item.monthlyAmount / opex.totalMonthlyOpex) * 100) : 0
              return (
                <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      value={item.name}
                      onChange={e => onUpdateItem(item.id, { name: e.target.value })}
                      className="text-[13px] font-medium text-gray-800 bg-transparent w-full focus:outline-none border-b border-transparent focus:border-[#685AFF]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-[10px] ${item.category === 'fixed' ? 'badge-primary' : 'badge-warning'}`}>
                      {item.category === 'fixed' ? 'Fixed' : 'Variable'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[12px] text-gray-400">Rp</span>
                      <input
                        type="number"
                        value={item.monthlyAmount}
                        onChange={e => onUpdateItem(item.id, { monthlyAmount: parseFloat(e.target.value) || 0 })}
                        className="text-[13px] font-semibold text-gray-800 bg-transparent w-28 focus:outline-none border-b border-transparent focus:border-[#685AFF]"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full w-20">
                        <div className="h-1.5 bg-[#685AFF] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] text-gray-500">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { if (confirm('Hapus biaya ini?')) onDeleteItem(item.id) }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {opex.items.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td className="px-4 py-3 text-[13px] font-bold text-gray-800" colSpan={2}>Total</td>
                <td className="px-4 py-3 text-[13px] font-bold text-gray-800">{formatRupiah(opex.totalMonthlyOpex)}</td>
                <td colSpan={2} className="px-4 py-3 text-[12px] text-gray-500">
                  = {formatRupiah(opex.opexPerPortion)}/porsi dari {opex.targetPortionsPerMonth} target
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
