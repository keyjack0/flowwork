import Topbar from '@/components/layout/Topbar'
import StokClient from './StokClient'
import { createClient } from '@/lib/supabase/server'

export default async function StokPage() {
  const supabase = createClient()
  const { data: products } = await supabase
    .from('products').select('*').eq('is_active', true).order('name')

  return (
    <>
      <Topbar title="Stok & Inventaris" />
      <div className="flex-1 overflow-hidden flex flex-col">
        <StokClient initialProducts={products || []} />
      </div>
    </>
  )
}
