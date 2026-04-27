import Topbar from '@/components/layout/Topbar'
import POSClient from './POSClient'
import { createClient } from '@/lib/supabase/server'

export default async function KasirPage() {
  const supabase = createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <>
      <Topbar title="Kasir (POS)" />
      <div className="flex-1 overflow-hidden p-4">
        <POSClient products={products || []} />
      </div>
    </>
  )
}
