'use client'

import Topbar from '@/components/layout/Topbar'
import { useState } from 'react'
import { formatRupiah, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

const CATEGORIES = ['Pembelian Stok', 'Biaya Iklan', 'Packing & Packaging', 'Listrik', 'Sewa', 'Gaji Karyawan', 'Transportasi', 'Lainnya']

interface Expense {
  id: string; category: string | null; amount: number; note: string | null; expense_date: string; created_at: string
}

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ category: CATEGORIES[0], amount: '', note: '', expense_date: new Date().toISOString().split('T')[0] })
  const [loaded, setLoaded] = useState(false)

  async function loadExpenses() {
    if (loaded) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(50)
    setExpenses(data || [])
    setLoaded(true)
    setLoading(false)
  }

  // Load on mount
  if (!loaded) { loadExpenses() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Masukkan jumlah pengeluaran'); return }
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('expenses')
      .insert({ category: form.category, amount: Number(form.amount), note: form.note || null, expense_date: form.expense_date })
      .select().single()
    if (error) { toast.error('Gagal menyimpan'); setSaving(false); return }
    setExpenses(prev => [data, ...prev])
    setForm({ category: CATEGORIES[0], amount: '', note: '', expense_date: new Date().toISOString().split('T')[0] })
    toast.success('Pengeluaran berhasil dicatat!')
    setSaving(false)
  }

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <>
      <Topbar title="Pengeluaran" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-4 fade-in">
          {/* Form */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="text-[14px] font-semibold text-gray-800 mb-4">➕ Catat Pengeluaran</div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Kategori</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#685AFF] focus:outline-none bg-white">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Jumlah (Rp)</label>
                <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="500000" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#685AFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Tanggal</label>
                <input type="date" value={form.expense_date} onChange={e => setForm(p => ({ ...p, expense_date: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#685AFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Catatan (opsional)</label>
                <input type="text" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Keterangan tambahan..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#685AFF] focus:outline-none" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-[#685AFF] text-white rounded-lg text-[13px] font-semibold hover:bg-[#4A3FCC] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</> : 'Simpan Pengeluaran'}
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="text-[11px] font-semibold text-red-500 uppercase mb-1">Total Pengeluaran Tercatat</div>
              <div className="text-[22px] font-bold text-gray-800">{formatRupiah(totalExpenses)}</div>
              <div className="text-[11px] text-red-400">{expenses.length} entri</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex-1">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-[13px] font-semibold text-gray-800">Riwayat Pengeluaran</div>
              </div>
              {loading ? (
                <div className="p-8 text-center"><Loader2 size={20} className="animate-spin mx-auto text-[#685AFF]" /></div>
              ) : (
                <div className="overflow-y-auto max-h-[400px]">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        {['Tanggal', 'Kategori', 'Jumlah', 'Catatan'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">Belum ada pengeluaran</td></tr>
                      ) : expenses.map(exp => (
                        <tr key={exp.id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-[11px] text-gray-400 whitespace-nowrap">{formatDate(exp.expense_date || exp.created_at, 'dd MMM yyyy')}</td>
                          <td className="px-4 py-2.5"><span className="badge badge-danger">{exp.category}</span></td>
                          <td className="px-4 py-2.5 text-[12px] font-semibold text-red-600">{formatRupiah(exp.amount)}</td>
                          <td className="px-4 py-2.5 text-[11px] text-gray-500">{exp.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
