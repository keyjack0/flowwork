'use client'

import { useState } from 'react'
import { formatRupiah, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'pl' | 'transactions' | 'monthly'

interface Props {
  transactions: any[]
  expenses: any[]
  summary: { totalSales: number; totalHPP: number; totalProfit: number; totalExpenses: number }
}

export default function KeuanganClient({ transactions, expenses, summary }: Props) {
  const [tab, setTab] = useState<Tab>('pl')
  const netProfit = summary.totalProfit - summary.totalExpenses
  const margin = summary.totalSales > 0 ? Math.round((netProfit / summary.totalSales) * 100) : 0

  return (
    <div className="fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-green-600" />
            <span className="text-[11px] font-semibold text-green-600 uppercase">Total Pemasukan</span>
          </div>
          <div className="text-[22px] font-bold text-gray-800">{formatRupiah(summary.totalSales, true)}</div>
          <div className="text-[11px] text-green-600 mt-1">Dari {transactions.filter(t => t.status === 'success').length} transaksi sukses</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-red-500" />
            <span className="text-[11px] font-semibold text-red-500 uppercase">Total Pengeluaran</span>
          </div>
          <div className="text-[22px] font-bold text-gray-800">{formatRupiah(summary.totalHPP + summary.totalExpenses, true)}</div>
          <div className="text-[11px] text-red-400 mt-1">HPP + Operasional</div>
        </div>
        <div className="p-4 bg-[rgba(104,90,255,0.06)] border border-[rgba(104,90,255,0.15)] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-[#685AFF]" />
            <span className="text-[11px] font-semibold text-[#685AFF] uppercase">Laba Bersih</span>
          </div>
          <div className="text-[22px] font-bold text-gray-800">{formatRupiah(netProfit, true)}</div>
          <div className="text-[11px] text-[#685AFF] mt-1">Margin {margin}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4 w-fit">
        {([['pl', 'P&L Statement'], ['transactions', 'Semua Transaksi'], ['monthly', 'Bulanan']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2 rounded-lg text-[13px] font-medium transition-all', tab === t ? 'bg-white text-[#685AFF] shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {label}
          </button>
        ))}
      </div>

      {/* P&L */}
      {tab === 'pl' && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-[13px] font-semibold text-gray-800">Laporan Laba Rugi (P&L) — Bulan Ini</div>
            <button className="text-[12px] text-[#685AFF] border border-[rgba(104,90,255,0.3)] px-3 py-1.5 rounded-lg hover:bg-[rgba(104,90,255,0.06)] transition-colors">
              📥 Export PDF/Excel
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Kategori', 'Keterangan', 'Jumlah', '% dari Omzet'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { cat: 'Pendapatan', desc: 'Total penjualan', val: summary.totalSales, pct: 100, type: 'income' },
                { cat: 'HPP', desc: 'Harga pokok penjualan', val: -summary.totalHPP, pct: summary.totalSales > 0 ? -Math.round((summary.totalHPP / summary.totalSales) * 100) : 0, type: 'expense' },
                { cat: 'Biaya Operasional', desc: 'Pengeluaran tercatat', val: -summary.totalExpenses, pct: summary.totalSales > 0 ? -Math.round((summary.totalExpenses / summary.totalSales) * 100) : 0, type: 'expense' },
                { cat: 'Laba Bersih', desc: 'Net profit setelah semua biaya', val: netProfit, pct: margin, type: 'profit' },
              ].map((row, i) => (
                <tr key={i} className={cn('border-t border-gray-50', row.type === 'profit' && 'bg-green-50 font-semibold')}>
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-800">{row.cat}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-500">{row.desc}</td>
                  <td className={cn('px-4 py-3 text-[13px] font-semibold', row.val < 0 ? 'text-red-600' : row.type === 'profit' ? 'text-green-700' : 'text-gray-800')}>
                    {formatRupiah(Math.abs(row.val))}
                  </td>
                  <td className={cn('px-4 py-3 text-[12px] font-medium', row.pct < 0 ? 'text-red-500' : 'text-gray-500')}>
                    {row.pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* All Transactions */}
      {tab === 'transactions' && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {['Order ID', 'Total', 'HPP', 'Profit', 'Metode', 'Tipe Midtrans', 'Status', 'Waktu'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">Belum ada transaksi</td></tr>
                ) : transactions.map(tx => {
                  const sc = getStatusColor(tx.status)
                  return (
                    <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[#685AFF]">{tx.midtrans_order_id || tx.id.slice(0, 12)}</td>
                      <td className="px-4 py-2.5 text-[12px] font-semibold">{formatRupiah(tx.total_amount)}</td>
                      <td className="px-4 py-2.5 text-[12px] text-red-500">{formatRupiah(tx.total_hpp)}</td>
                      <td className="px-4 py-2.5 text-[12px] font-semibold text-green-600">{formatRupiah(tx.total_profit)}</td>
                      <td className="px-4 py-2.5"><span className="badge badge-primary capitalize">{tx.payment_method}</span></td>
                      <td className="px-4 py-2.5 text-[11px] text-gray-400">{tx.midtrans_payment_type || '-'}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn('badge', sc.bg, sc.text)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
                          {getStatusLabel(tx.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-gray-400 whitespace-nowrap">{formatDate(tx.created_at, 'dd MMM, HH:mm')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly */}
      {tab === 'monthly' && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Bulan', 'Pemasukan', 'Pengeluaran', 'Laba Bersih', 'Margin', 'Transaksi'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { month: 'Apr 2024', income: summary.totalSales, expense: summary.totalHPP + summary.totalExpenses, txCount: transactions.filter(t => t.status === 'success').length },
              ].map((row, i) => {
                const laba = row.income - row.expense
                const m = row.income > 0 ? Math.round((laba / row.income) * 100) : 0
                return (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-4 py-3 text-[13px] font-medium text-gray-800">{row.month}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-green-600">{formatRupiah(row.income)}</td>
                    <td className="px-4 py-3 text-[13px] text-red-500">{formatRupiah(row.expense)}</td>
                    <td className="px-4 py-3 text-[13px] font-bold">{formatRupiah(laba)}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: m >= 30 ? '#22C55E' : '#F59E0B' }}>{m}%</td>
                    <td className="px-4 py-3 text-[13px] text-gray-600">{row.txCount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
