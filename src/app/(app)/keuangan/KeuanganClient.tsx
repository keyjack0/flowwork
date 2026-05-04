'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Calendar, ChevronDown, Download, RefreshCw, Loader2,
  BarChart2, FileText, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, XCircle
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatRupiah, formatDate, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import toast from 'react-hot-toast'

// ─── Types ───────────────────────────────────────────────
type Period = 'today' | 'yesterday' | 'week' | 'lastweek' | 'month' | 'lastmonth' | 'all' | 'custom'
type Tab = 'overview' | 'transactions' | 'pl' | 'expenses'

interface ReportData {
  transactions: any[]
  expenses: any[]
  summary: {
    totalSales: number
    totalHPP: number
    totalProfit: number
    totalTax: number
    totalExpenses: number
    netProfit: number
    margin: number
    txCount: number
  }
  dailyBreakdown: { date: string; sales: number; profit: number; count: number }[]
  paymentBreakdown: Record<string, { count: number; total: number }>
  period: { from: string; to: string; label: string }
}

// ─── Period options ───────────────────────────────────────
const PERIODS: { id: Period; label: string; short: string }[] = [
  { id: 'today', label: 'Hari Ini', short: 'Hari Ini' },
  { id: 'yesterday', label: 'Kemarin', short: 'Kemarin' },
  { id: 'week', label: 'Minggu Ini', short: 'Minggu Ini' },
  { id: 'lastweek', label: 'Minggu Lalu', short: 'Minggu Lalu' },
  { id: 'month', label: 'Bulan Ini', short: 'Bulan Ini' },
  { id: 'lastmonth', label: 'Bulan Lalu', short: 'Bulan Lalu' },
  { id: 'all', label: 'Riwayat', short: 'Riwayat' },
  { id: 'custom', label: 'Pilih Tanggal', short: 'Custom' },
]

const STATUS_CONFIG: Record<string, { label: string; icon: any; bg: string; text: string; dot: string }> = {
  success: { label: 'Berhasil', icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  pending: { label: 'Menunggu', icon: Clock, bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  failed: { label: 'Gagal', icon: XCircle, bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  expired: { label: 'Expired', icon: XCircle, bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
}

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#685AFF', Cash: '#685AFF',
  qris: '#22C55E', QRIS: '#22C55E',
  midtrans: '#F59E0B', Midtrans: '#F59E0B',
  transfer: '#3B82F6', Transfer: '#3B82F6',
}

// ─── Component ───────────────────────────────────────────
export default function KeuanganClient() {
  const [period, setPeriod] = useState<Period>('month')
  const [customFrom, setCustomFrom] = useState(format(new Date(), 'yyyy-MM-01'))
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = useCallback(async (p: Period = period) => {
    setLoading(true)
    try {
      let url = `/api/transactions/report?period=${p}`
      if (p === 'custom') url += `&from=${customFrom}&to=${customTo}`
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json)
    } catch (err: any) {
      toast.error('Gagal memuat laporan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [period, customFrom, customTo])

  useEffect(() => { fetchReport() }, [])

  function handlePeriodChange(p: Period) {
    setPeriod(p)
    setShowPeriodDropdown(false)
    if (p === 'custom') { setShowCustom(true); return }
    setShowCustom(false)
    fetchReport(p)
  }

  function handleCustomApply() {
    if (!customFrom || !customTo) { toast.error('Pilih tanggal mulai dan akhir'); return }
    if (customFrom > customTo) { toast.error('Tanggal mulai tidak boleh melebihi tanggal akhir'); return }
    setShowCustom(false)
    fetchReport('custom')
  }

  const s = data?.summary
  const periodLabel = PERIODS.find(p => p.id === period)?.label || 'Bulan Ini'

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* ── Period Selector Bar ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 flex-shrink-0">
        {/* Quick period chips */}
        <div className="flex gap-1.5 flex-1 flex-wrap">
          {PERIODS.filter(p => p.id !== 'custom').map(p => (
            <button key={p.id} onClick={() => handlePeriodChange(p.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all',
                period === p.id
                  ? 'bg-[#685AFF] text-white border-[#685AFF]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#685AFF] hover:text-[#685AFF]'
              )}>
              {p.short}
            </button>
          ))}
          {/* Custom date */}
          <button onClick={() => { setPeriod('custom'); setShowCustom(true) }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all',
              period === 'custom'
                ? 'bg-[#685AFF] text-white border-[#685AFF]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#685AFF] hover:text-[#685AFF]'
            )}>
            <Calendar size={12} /> Pilih Tanggal
          </button>
        </div>

        {/* Period info */}
        {data?.period && (
          <div className="text-[11px] text-gray-400 whitespace-nowrap">
            {format(new Date(data.period.from), 'dd MMM', { locale: localeId })} –{' '}
            {format(new Date(data.period.to), 'dd MMM yyyy', { locale: localeId })}
          </div>
        )}

        <button onClick={() => fetchReport()} disabled={loading}
          className="p-2 text-gray-400 hover:text-[#685AFF] hover:bg-[rgba(104,90,255,0.08)] rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => toast('Fitur export segera hadir', { icon: '📥' })}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-gray-600 hover:border-[#685AFF] hover:text-[#685AFF] transition-colors whitespace-nowrap">
          <Download size={13} /> Export
        </button>
      </div>

      {/* Custom date picker */}
      {showCustom && (
        <div className="bg-[rgba(104,90,255,0.04)] border-b border-[rgba(104,90,255,0.15)] px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <Calendar size={14} className="text-[#685AFF] flex-shrink-0" />
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-gray-500">Dari</label>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] focus:border-[#685AFF] focus:outline-none" />
            <label className="text-[12px] text-gray-500">Sampai</label>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] focus:border-[#685AFF] focus:outline-none" />
          </div>
          <button onClick={handleCustomApply}
            className="px-4 py-1.5 bg-[#685AFF] text-white rounded-lg text-[12px] font-semibold hover:bg-[#4A3FCC] transition-colors">
            Terapkan
          </button>
          <button onClick={() => setShowCustom(false)} className="text-[12px] text-gray-400 hover:text-gray-600">Batal</button>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="flex items-center justify-center py-8 flex-shrink-0">
          <Loader2 size={20} className="animate-spin text-[#685AFF]" />
          <span className="ml-2 text-[13px] text-gray-400">Memuat laporan...</span>
        </div>
      )}

      {/* Main content */}
      {!loading && data && (
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              {
                label: 'Total Penjualan', value: formatRupiah(s!.totalSales, true),
                sub: `${s!.txCount} transaksi berhasil`, icon: TrendingUp,
                color: '#685AFF', bg: 'rgba(104,90,255,0.08)',
                trend: s!.totalSales > 0 ? 'up' : null,
              },
              {
                label: 'Total HPP + Pengeluaran', value: formatRupiah(s!.totalHPP + s!.totalExpenses, true),
                sub: `HPP ${formatRupiah(s!.totalHPP, true)} + Ops ${formatRupiah(s!.totalExpenses, true)}`,
                icon: TrendingDown, color: '#EF4444', bg: 'rgba(239,68,68,0.08)',
                trend: null,
              },
              {
                label: 'Laba Bersih', value: formatRupiah(s!.netProfit, true),
                sub: `Margin ${s!.margin}%`, icon: DollarSign,
                color: s!.netProfit >= 0 ? '#22C55E' : '#EF4444',
                bg: s!.netProfit >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                trend: s!.netProfit >= 0 ? 'up' : 'down',
              },
              {
                label: 'Total Transaksi', value: s!.txCount.toString(),
                sub: `Rata-rata ${s!.txCount > 0 ? formatRupiah(s!.totalSales / s!.txCount, true) : 'Rp 0'}/tx`,
                icon: ShoppingCart, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',
                trend: null,
              },
            ].map(card => (
              <div key={card.label} className="bg-white border border-gray-100 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 rounded-bl-full opacity-10" style={{ background: card.color }} />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{card.label}</span>
                  <card.icon size={14} style={{ color: card.color }} />
                </div>
                <div className="text-[22px] font-bold text-gray-800 mb-1 tracking-tight">{card.value}</div>
                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                  {card.trend === 'up' && <ArrowUpRight size={11} className="text-green-500" />}
                  {card.trend === 'down' && <ArrowDownRight size={11} className="text-red-500" />}
                  {card.sub}
                </div>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4 w-fit">
            {([
              { id: 'overview', label: 'Ringkasan', icon: BarChart2 },
              { id: 'transactions', label: 'Transaksi', icon: ShoppingCart },
              { id: 'pl', label: 'P&L Statement', icon: FileText },
              { id: 'expenses', label: 'Pengeluaran', icon: TrendingDown },
            ] as { id: Tab; label: string; icon: any }[]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all',
                  tab === t.id ? 'bg-white text-[#685AFF] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}>
                <t.icon size={13} />
                {t.label}
                {t.id === 'transactions' && s!.txCount > 0 && (
                  <span className="bg-[#685AFF] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{s!.txCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab: Overview ── */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Sales chart */}
                <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[13px] font-bold text-gray-800">Tren Penjualan</div>
                      <div className="text-[11px] text-gray-400">{periodLabel} — hanya transaksi berhasil</div>
                    </div>
                  </div>
                  {data.dailyBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={data.dailyBreakdown} barSize={20}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#9CA3AF' }}
                          axisLine={false} tickLine={false}
                          tickFormatter={d => format(new Date(d), 'dd/MM')}
                        />
                        <YAxis hide />
                        <Tooltip
                          formatter={(v: number, name: string) => [formatRupiah(v), name === 'sales' ? 'Penjualan' : 'Profit']}
                          labelFormatter={l => format(new Date(l), 'EEEE, dd MMM yyyy', { locale: localeId })}
                          contentStyle={{ fontFamily: 'Poppins', fontSize: 11, borderRadius: 10, border: '1px solid #E5E7EB' }}
                        />
                        <Bar dataKey="sales" radius={[5, 5, 0, 0]}>
                          {data.dailyBreakdown.map((_, i) => (
                            <Cell key={i} fill={i === data.dailyBreakdown.length - 1 ? '#685AFF' : '#C5BFFF'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[160px] flex items-center justify-center text-gray-400 text-sm">
                      Tidak ada data penjualan pada periode ini
                    </div>
                  )}
                </div>

                {/* Payment method */}
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="text-[13px] font-bold text-gray-800 mb-1">Metode Pembayaran</div>
                  <div className="text-[11px] text-gray-400 mb-4">{periodLabel}</div>
                  {Object.keys(data.paymentBreakdown).length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Belum ada transaksi</div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(data.paymentBreakdown)
                        .sort((a, b) => b[1].total - a[1].total)
                        .map(([method, stat]) => {
                          const pct = s!.totalSales > 0 ? Math.round((stat.total / s!.totalSales) * 100) : 0
                          const color = PAYMENT_COLORS[method] || '#9CA3AF'
                          return (
                            <div key={method}>
                              <div className="flex justify-between mb-1">
                                <span className="text-[12px] text-gray-600 capitalize font-medium">{method}</span>
                                <div className="text-right">
                                  <span className="text-[12px] font-bold text-gray-800">{pct}%</span>
                                  <span className="text-[10px] text-gray-400 ml-1">({stat.count}x)</span>
                                </div>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{formatRupiah(stat.total)}</div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Daily table */}
              {data.dailyBreakdown.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-[13px] font-bold text-gray-800">Breakdown Harian</div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        {['Tanggal', 'Hari', 'Penjualan', 'Profit', 'Transaksi'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.dailyBreakdown].reverse().map(row => (
                        <tr key={row.date} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 text-[13px] font-medium text-gray-800">
                            {format(new Date(row.date), 'dd MMM yyyy')}
                          </td>
                          <td className="px-4 py-2.5 text-[12px] text-gray-500">
                            {format(new Date(row.date), 'EEEE', { locale: localeId })}
                          </td>
                          <td className="px-4 py-2.5 text-[13px] font-semibold text-green-600">{formatRupiah(row.sales)}</td>
                          <td className="px-4 py-2.5 text-[13px] font-semibold text-[#685AFF]">{formatRupiah(row.profit)}</td>
                          <td className="px-4 py-2.5 text-[12px] text-gray-600">{row.count} transaksi</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={2} className="px-4 py-2.5 text-[12px] font-bold text-gray-700">Total</td>
                        <td className="px-4 py-2.5 text-[13px] font-bold text-green-600">{formatRupiah(s!.totalSales)}</td>
                        <td className="px-4 py-2.5 text-[13px] font-bold text-[#685AFF]">{formatRupiah(s!.totalProfit)}</td>
                        <td className="px-4 py-2.5 text-[12px] font-bold text-gray-700">{s!.txCount} transaksi</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Transactions ── */}
          {tab === 'transactions' && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-gray-800">Daftar Transaksi Berhasil</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Hanya menampilkan transaksi dengan status <span className="text-green-600 font-semibold">Berhasil</span> — {periodLabel}
                  </div>
                </div>
                <span className="badge badge-success">{s!.txCount} transaksi</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Order ID', 'Waktu', 'Item', 'Subtotal', 'Pajak', 'Total', 'Profit', 'Metode', 'Kasir'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center">
                          <CheckCircle2 size={28} className="mx-auto mb-2 text-gray-300" />
                          <div className="text-[13px] text-gray-400">Tidak ada transaksi berhasil pada periode ini</div>
                        </td>
                      </tr>
                    ) : data.transactions.map((tx: any) => (
                      <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-[11px] text-[#685AFF]">
                          {tx.midtrans_order_id || tx.id.substring(0, 12) + '…'}
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-gray-500 whitespace-nowrap">
                          {formatDate(tx.created_at, 'dd/MM/yy HH:mm')}
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-gray-500">
                          {tx.transaction_items?.length || 0} item
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-gray-700">{formatRupiah(tx.total_amount - (tx.tax_amount || 0))}</td>
                        <td className="px-4 py-2.5 text-[12px] text-gray-500">{formatRupiah(tx.tax_amount || 0)}</td>
                        <td className="px-4 py-2.5 text-[13px] font-bold text-gray-800">{formatRupiah(tx.total_amount)}</td>
                        <td className="px-4 py-2.5 text-[12px] font-semibold text-green-600">{formatRupiah(tx.total_profit)}</td>
                        <td className="px-4 py-2.5">
                          <span className="badge badge-primary text-[10px] capitalize">{tx.payment_method}</span>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-gray-500">
                          {tx.profiles?.full_name || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tab: P&L ── */}
          {tab === 'pl' && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-gray-800">Laporan Laba Rugi (P&L)</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{periodLabel}</div>
                </div>
                <button onClick={() => toast('Fitur export segera hadir', { icon: '📥' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-600 hover:border-[#685AFF] hover:text-[#685AFF] transition-colors">
                  <Download size={12} /> Export PDF/Excel
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
                    { cat: '(+) Pendapatan', desc: `Total penjualan dari ${s!.txCount} transaksi berhasil`, val: s!.totalSales, pct: 100, type: 'income' },
                    { cat: '(-) HPP', desc: 'Harga pokok penjualan (bahan/modal)', val: s!.totalHPP, pct: s!.totalSales > 0 ? -Math.round((s!.totalHPP / s!.totalSales) * 100) : 0, type: 'expense' },
                    { cat: '(-) PPN', desc: 'Pajak pertambahan nilai 11%', val: s!.totalTax, pct: s!.totalSales > 0 ? -Math.round((s!.totalTax / s!.totalSales) * 100) : 0, type: 'expense' },
                    { cat: '  = Laba Kotor', desc: 'Sebelum biaya operasional', val: s!.totalProfit, pct: s!.totalSales > 0 ? Math.round((s!.totalProfit / s!.totalSales) * 100) : 0, type: 'sub' },
                    { cat: '(-) Biaya Operasional', desc: 'Pengeluaran tercatat periode ini', val: s!.totalExpenses, pct: s!.totalSales > 0 ? -Math.round((s!.totalExpenses / s!.totalSales) * 100) : 0, type: 'expense' },
                    { cat: '  = Laba Bersih', desc: 'Net profit setelah semua biaya', val: s!.netProfit, pct: s!.margin, type: 'profit' },
                  ].map((row, i) => (
                    <tr key={i} className={cn(
                      'border-t border-gray-50',
                      row.type === 'profit' && 'bg-green-50 font-semibold',
                      row.type === 'sub' && 'bg-[rgba(104,90,255,0.04)]',
                      row.type === 'income' && 'font-medium',
                    )}>
                      <td className="px-4 py-3 text-[13px] text-gray-800">{row.cat}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{row.desc}</td>
                      <td className={cn('px-4 py-3 text-[13px] font-semibold',
                        row.type === 'expense' ? 'text-red-600' :
                        row.type === 'profit' ? (row.val >= 0 ? 'text-green-700' : 'text-red-600') :
                        row.type === 'income' ? 'text-green-700' : 'text-[#685AFF]'
                      )}>
                        {row.type === 'expense' ? '- ' : ''}{formatRupiah(Math.abs(row.val))}
                      </td>
                      <td className={cn('px-4 py-3 text-[12px] font-medium', row.pct < 0 ? 'text-red-500' : 'text-gray-500')}>
                        {row.pct > 0 ? '' : ''}{row.pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Kesimpulan */}
              <div className={cn(
                'mx-4 mb-4 mt-2 p-4 rounded-xl border',
                s!.netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={cn('text-[14px] font-bold', s!.netProfit >= 0 ? 'text-green-800' : 'text-red-700')}>
                      {s!.netProfit >= 0 ? '✅ Periode Ini Untung' : '❌ Periode Ini Rugi'}
                    </div>
                    <div className="text-[12px] text-gray-500 mt-0.5">
                      {s!.netProfit >= 0
                        ? `Bisnis berjalan baik dengan margin bersih ${s!.margin}%`
                        : 'Perlu evaluasi pengeluaran atau harga jual'}
                    </div>
                  </div>
                  <div className={cn('text-[22px] font-bold', s!.netProfit >= 0 ? 'text-green-700' : 'text-red-600')}>
                    {formatRupiah(s!.netProfit, true)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Expenses ── */}
          {tab === 'expenses' && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-gray-800">Pengeluaran Operasional</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{periodLabel} · Total {formatRupiah(s!.totalExpenses)}</div>
                </div>
                <a href="/pengeluaran" className="text-[12px] text-[#685AFF] hover:underline">+ Catat Pengeluaran</a>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {['Tanggal', 'Kategori', 'Jumlah', 'Catatan'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-sm">
                        Tidak ada pengeluaran pada periode ini
                      </td>
                    </tr>
                  ) : data.expenses.map((exp: any) => (
                    <tr key={exp.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-[12px] text-gray-600 whitespace-nowrap">
                        {format(new Date(exp.expense_date || exp.created_at), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-2.5"><span className="badge badge-danger text-[10px]">{exp.category}</span></td>
                      <td className="px-4 py-2.5 text-[13px] font-semibold text-red-600">{formatRupiah(exp.amount)}</td>
                      <td className="px-4 py-2.5 text-[11px] text-gray-500">{exp.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                {data.expenses.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan={2} className="px-4 py-2.5 text-[12px] font-bold text-gray-700">Total Pengeluaran</td>
                      <td className="px-4 py-2.5 text-[13px] font-bold text-red-600">{formatRupiah(s!.totalExpenses)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

        </div>
      )}

      {/* Empty state */}
      {!loading && !data && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <BarChart2 size={40} className="mx-auto mb-2 opacity-30" />
            <div className="text-[14px]">Gagal memuat laporan</div>
            <button onClick={() => fetchReport()} className="mt-2 text-[#685AFF] text-[13px] hover:underline">Coba lagi</button>
          </div>
        </div>
      )}
    </div>
  )
}
