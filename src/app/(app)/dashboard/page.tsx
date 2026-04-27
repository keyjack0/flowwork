import Topbar from '@/components/layout/Topbar'
import DashboardClient from './DashboardClient'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()

  // Ambil transaksi bulan ini
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, transaction_items(*)')
    .eq('status', 'success')
    .gte('created_at', startOfMonth.toISOString())
    .order('created_at', { ascending: false })

  // Ambil transaksi 7 hari untuk grafik
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: weeklyTx } = await supabase
    .from('transactions')
    .select('created_at, total_amount, total_profit')
    .eq('status', 'success')
    .gte('created_at', sevenDaysAgo.toISOString())

  // Ambil top products
  const { data: topItems } = await supabase
    .from('transaction_items')
    .select('product_id, product_name, quantity, subtotal')
    .order('quantity', { ascending: false })
    .limit(50)

  // Ambil pengeluaran bulan ini
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, category')
    .gte('created_at', startOfMonth.toISOString())

  // Hitung metrics
  const totalSales = transactions?.reduce((s, t) => s + Number(t.total_amount), 0) || 0
  const totalProfit = transactions?.reduce((s, t) => s + Number(t.total_profit), 0) || 0
  const totalTransactions = transactions?.length || 0
  const totalProductsSold = transactions?.reduce((s, t) => s + (t.transaction_items?.length || 0), 0) || 0

  // Grouping top products
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  topItems?.forEach(item => {
    if (!productMap[item.product_id]) {
      productMap[item.product_id] = { name: item.product_name, qty: 0, revenue: 0 }
    }
    productMap[item.product_id].qty += item.quantity
    productMap[item.product_id].revenue += Number(item.subtotal)
  })
  const topProducts = Object.entries(productMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  // Daily sales for chart
  const dailyMap: Record<string, { sales: number; profit: number }> = {}
  weeklyTx?.forEach(tx => {
    const day = new Date(tx.created_at).toLocaleDateString('id-ID', { weekday: 'short' })
    if (!dailyMap[day]) dailyMap[day] = { sales: 0, profit: 0 }
    dailyMap[day].sales += Number(tx.total_amount)
    dailyMap[day].profit += Number(tx.total_profit)
  })

  // Last 7 days labels
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toLocaleDateString('id-ID', { weekday: 'short' }))
  }
  const dailySales = days.map(day => ({
    label: day,
    sales: dailyMap[day]?.sales || 0,
    profit: dailyMap[day]?.profit || 0,
  }))

  // Payment method breakdown
  const paymentBreakdown: Record<string, number> = {}
  transactions?.forEach(t => {
    const method = t.payment_method || 'Lainnya'
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + 1
  })

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-6">
        <DashboardClient
          metrics={{ totalSales, totalProfit, totalTransactions, totalProductsSold }}
          dailySales={dailySales}
          topProducts={topProducts}
          recentTransactions={transactions?.slice(0, 8) || []}
          paymentBreakdown={paymentBreakdown}
          expenses={expenses || []}
        />
      </div>
    </>
  )
}
