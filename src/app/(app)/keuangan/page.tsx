import Topbar from '@/components/layout/Topbar'
import KeuanganClient from './KeuanganClient'

export default function KeuanganPage() {
  return (
    <>
      <Topbar title="Laporan Keuangan" />
      <div className="flex-1 overflow-hidden flex flex-col">
        <KeuanganClient />
      </div>
    </>
  )
}
