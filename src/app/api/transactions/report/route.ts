import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, format } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const period = req.nextUrl.searchParams.get('period') || 'month' // today|week|month|custom
    const dateFrom = req.nextUrl.searchParams.get('from')
    const dateTo = req.nextUrl.searchParams.get('to')

    const now = new Date()
    let from: Date, to: Date

    switch (period) {
      case 'today':
        from = startOfDay(now); to = endOfDay(now); break
      case 'yesterday':
        const yesterday = subDays(now, 1)
        from = startOfDay(yesterday); to = endOfDay(yesterday); break
      case 'week':
        from = startOfWeek(now, { weekStartsOn: 1 }); to = endOfWeek(now, { weekStartsOn: 1 }); break
      case 'lastweek':
        const lastWeek = subWeeks(now, 1)
        from = startOfWeek(lastWeek, { weekStartsOn: 1 }); to = endOfWeek(lastWeek, { weekStartsOn: 1 }); break
      case 'month':
        from = startOfMonth(now); to = endOfMonth(now); break
      case 'lastmonth':
        const lastMonth = subMonths(now, 1)
        from = startOfMonth(lastMonth); to = endOfMonth(lastMonth); break
      case 'custom':
        from = dateFrom ? new Date(dateFrom) : startOfMonth(now)
        to = dateTo ? endOfDay(new Date(dateTo)) : endOfDay(now)
        break
      case 'all':
        from = new Date(0); to = now; break
      default:
        from = startOfMonth(now); to = endOfMonth(now)
    }

    // ── Transaksi SUKSES saja ──
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*, transaction_items(product_name, quantity, price_at_time, hpp_at_time, subtotal), profiles(full_name)')
      .eq('status', 'success')                    // HANYA status success
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .order('created_at', { ascending: false })

    if (txError) throw txError

    // ── Pengeluaran periode sama ──
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', format(from, 'yyyy-MM-dd'))
      .lte('expense_date', format(to, 'yyyy-MM-dd'))
      .order('expense_date', { ascending: false })

    const txList = transactions || []
    const expList = expenses || []

    // ── Summary ──
    const totalSales = txList.reduce((s: number, t: any) => s + Number(t.total_amount), 0)
    const totalHPP = txList.reduce((s: number, t: any) => s + Number(t.total_hpp), 0)
    const totalProfit = txList.reduce((s: number, t: any) => s + Number(t.total_profit), 0)
    const totalTax = txList.reduce((s: number, t: any) => s + Number(t.tax_amount || 0), 0)
    const totalExpenses = expList.reduce((s: number, e: any) => s + Number(e.amount), 0)
    const netProfit = totalProfit - totalExpenses
    const margin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0

    // ── Daily breakdown untuk chart ──
    const dailyMap: Record<string, { date: string; sales: number; profit: number; count: number }> = {}
    txList.forEach((t: any) => {
      const day = format(new Date(t.created_at), 'yyyy-MM-dd')
      if (!dailyMap[day]) dailyMap[day] = { date: day, sales: 0, profit: 0, count: 0 }
      dailyMap[day].sales += Number(t.total_amount)
      dailyMap[day].profit += Number(t.total_profit)
      dailyMap[day].count += 1
    })

    // ── Payment method breakdown ──
    const paymentMap: Record<string, { count: number; total: number }> = {}
    txList.forEach((t: any) => {
      const m = t.payment_method || 'Lainnya'
      if (!paymentMap[m]) paymentMap[m] = { count: 0, total: 0 }
      paymentMap[m].count += 1
      paymentMap[m].total += Number(t.total_amount)
    })

    return NextResponse.json({
      transactions: txList,
      expenses: expList,
      summary: { totalSales, totalHPP, totalProfit, totalTax, totalExpenses, netProfit, margin, txCount: txList.length },
      dailyBreakdown: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
      paymentBreakdown: paymentMap,
      period: { from: from.toISOString(), to: to.toISOString(), label: period },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
