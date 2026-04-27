'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, ShoppingCart, Package, DollarSign } from 'lucide-react'
import { formatRupiah, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'

interface Props {
  metrics: {
    totalSales: number
    totalProfit: number
    totalTransactions: number
    totalProductsSold: number
  }
  dailySales: { label: string; sales: number; profit: number }[]
  topProducts: { id: string; name: string; qty: number; revenue: number }[]
  recentTransactions: any[]
  paymentBreakdown: Record<string, number>
  expenses: { amount: number; category: string | null }[]
}

function MetricCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub: string; icon: any; color: string
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-14 h-14 rounded-bl-full opacity-10"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between mb-3">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-800 tracking-tight mb-1">{value}</div>
      <div className="text-[11px] text-gray-400">{sub}</div>
    </div>
  )
}

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#685AFF', Cash: '#685AFF',
  qris: '#22C55E', QRIS: '#22C55E',
  midtrans: '#F59E0B', Midtrans: '#F59E0B',
  transfer: '#3B82F6', Transfer: '#3B82F6',
}

export default function DashboardClient({ metrics, dailySales, topProducts, recentTransactions, paymentBreakdown, expenses }: Props) {
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const maxSales = Math.max(...dailySales.map(d => d.sales), 1)

  const totalPayments = Object.values(paymentBreakdown).reduce((s, v) => s + v, 0)

  return (
    <div className="fade-in">
      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard label="Total Penjualan" value={formatRupiah(metrics.totalSales, true)} sub="Bulan ini" icon={TrendingUp} color="#685AFF" />
        <MetricCard label="Profit Bersih" value={formatRupiah(metrics.totalProfit, true)} sub="Setelah HPP" icon={DollarSign} color="#22C55E" />
        <MetricCard label="Transaksi" value={metrics.totalTransactions.toString()} sub="Sukses bulan ini" icon={ShoppingCart} color="#F59E0B" />
        <MetricCard label="Produk Terjual" value={metrics.totalProductsSold.toString()} sub="Item bulan ini" icon={Package} color="#EF4444" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {/* Sales Chart */}
        <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[13px] font-semibold text-gray-800">Penjualan 7 Hari</div>
              <div className="text-[11px] text-gray-400">Omzet harian</div>
            </div>
          </div>
          {dailySales.some(d => d.sales > 0) ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={dailySales} barSize={28}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(v: number) => [formatRupiah(v), 'Penjualan']}
                  contentStyle={{ fontFamily: 'Poppins', fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                />
                <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                  {dailySales.map((entry, index) => (
                    <Cell key={index} fill={index === dailySales.length - 1 ? '#685AFF' : '#C5BFFF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-gray-400 text-sm">
              Belum ada data penjualan minggu ini
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-[13px] font-semibold text-gray-800 mb-1">Metode Pembayaran</div>
          <div className="text-[11px] text-gray-400 mb-4">Bulan ini</div>
          {totalPayments > 0 ? (
            <div className="space-y-3">
              {Object.entries(paymentBreakdown).map(([method, count]) => {
                const pct = Math.round((count / totalPayments) * 100)
                const color = PAYMENT_COLORS[method] || '#9CA3AF'
                return (
                  <div key={method}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-gray-600 capitalize">{method}</span>
                      <span className="font-semibold text-gray-800">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm py-8">Belum ada transaksi</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {/* Top Products */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-[13px] font-semibold text-gray-800 mb-4">Top 5 Produk Terlaris</div>
          {topProducts.length > 0 ? (
            <div className="space-y-2.5">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 rounded-md bg-[rgba(104,90,255,0.1)] text-[#685AFF] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-gray-800 truncate">{p.name}</div>
                  </div>
                  <div className="text-[12px] font-semibold text-gray-700 whitespace-nowrap">{p.qty} unit</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm py-6">Belum ada data produk</div>
          )}
        </div>

        {/* Cash Flow Summary */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-[13px] font-semibold text-gray-800 mb-4">Ringkasan Keuangan</div>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="text-[10px] font-semibold text-green-600 uppercase mb-1">Pemasukan</div>
              <div className="text-[16px] font-bold text-gray-800">{formatRupiah(metrics.totalSales, true)}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="text-[10px] font-semibold text-red-500 uppercase mb-1">Pengeluaran</div>
              <div className="text-[16px] font-bold text-gray-800">{formatRupiah(totalExpenses, true)}</div>
            </div>
            <div className="p-3 bg-[rgba(104,90,255,0.06)] rounded-lg border border-[rgba(104,90,255,0.15)]">
              <div className="text-[10px] font-semibold text-[#685AFF] uppercase mb-1">Laba Bersih</div>
              <div className="text-[16px] font-bold text-gray-800">{formatRupiah(metrics.totalProfit, true)}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Margin {metrics.totalSales > 0 ? Math.round((metrics.totalProfit / metrics.totalSales) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Retention */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-[13px] font-semibold text-gray-800 mb-4">Retensi Pelanggan</div>
          <div className="space-y-3">
            {[
              { label: 'Pelanggan Baru', pct: 68, color: '#685AFF' },
              { label: 'Repeat Order', pct: 32, color: '#22C55E' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[12px] text-gray-600">{item.label}</span>
                  <span className="text-[12px] font-semibold">{item.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-2 rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                </div>
              </div>
            ))}
            <div className="mt-4 p-2.5 bg-gray-50 rounded-lg">
              <div className="text-[11px] text-gray-400 mb-1">Total Pelanggan Bulan Ini</div>
              <div className="text-[18px] font-bold text-gray-800">
                {metrics.totalTransactions}
                <span className="text-[12px] font-normal text-green-500 ml-2">transaksi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-[13px] font-semibold text-gray-800">Transaksi Terbaru</div>
          <a href="/keuangan" className="text-[12px] text-[#685AFF] hover:underline">Lihat Semua</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Order ID', 'Total', 'Profit', 'Metode', 'Status', 'Waktu'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? recentTransactions.map(tx => {
                const sc = getStatusColor(tx.status)
                return (
                  <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[#685AFF]">
                      {tx.midtrans_order_id || tx.id.substring(0, 12) + '...'}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] font-semibold text-gray-800">{formatRupiah(tx.total_amount)}</td>
                    <td className="px-4 py-2.5 text-[12px] font-semibold text-green-600">{formatRupiah(tx.total_profit)}</td>
                    <td className="px-4 py-2.5">
                      <span className="badge badge-primary text-[11px] capitalize">{tx.payment_method}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`badge ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {getStatusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-400">{formatDate(tx.created_at, 'dd MMM, HH:mm')}</td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Belum ada transaksi bulan ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
