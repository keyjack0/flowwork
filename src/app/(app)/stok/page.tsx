import Topbar from '@/components/layout/Topbar'
import StokClient from './StokClient'
import { createClient } from '@/lib/supabase/server'

export default async function StokPage() {
  const supabase = createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('name')

  const lowStockCount = products?.filter(p => p.stock <= p.min_stock_alert).length || 0

  return (
    <>
      <Topbar title="Stok & Inventaris" />
      <div className="flex-1 overflow-y-auto p-6">
        <StokClient products={products || []} lowStockCount={lowStockCount} />
      </div>
    </>
  )
}
