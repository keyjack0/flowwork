import Topbar from '@/components/layout/Topbar'
import KeuanganClient from './KeuanganClient'
import { createClient } from '@/lib/supabase/server'

export default async function KeuanganPage() {
  const supabase = createClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [{ data: transactions }, { data: expenses }] = await Promise.all([
    supabase.from('transactions').select('*, transaction_items(*)').gte('created_at', startOfMonth.toISOString()).order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').gte('created_at', startOfMonth.toISOString()),
  ])

  const totalSales = transactions?.filter(t => t.status === 'success').reduce((s, t) => s + Number(t.total_amount), 0) || 0
  const totalHPP = transactions?.filter(t => t.status === 'success').reduce((s, t) => s + Number(t.total_hpp), 0) || 0
  const totalProfit = transactions?.filter(t => t.status === 'success').reduce((s, t) => s + Number(t.total_profit), 0) || 0
  const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0

  return (
    <>
      <Topbar title="Laporan Keuangan" />
      <div className="flex-1 overflow-y-auto p-6">
        <KeuanganClient
          transactions={transactions || []}
          expenses={expenses || []}
          summary={{ totalSales, totalHPP, totalProfit, totalExpenses }}
        />
      </div>
    </>
  )
}
