'use client'

import { useEffect, useState } from 'react'
import { History, ArrowUp, ArrowDown, Loader2, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Log {
  id: string
  product_id: string
  change_amount: number
  reason: string | null
  created_at: string
  products?: { name: string; sku: string; image_emoji: string }
}

interface Props {
  open: boolean
  onClose: () => void
  productId?: string
  productName?: string
}

export default function StockLogPanel({ open, onClose, productId, productName }: Props) {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const url = productId ? `/api/stock/logs?productId=${productId}&limit=50` : '/api/stock/logs?limit=100'
    fetch(url)
      .then(r => r.json())
      .then(d => { setLogs(d.logs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open, productId])

  const REASON_COLORS: Record<string, string> = {
    'Sales': 'text-red-500 bg-red-50',
    'Restock': 'text-green-600 bg-green-50',
    'Pembelian dari Supplier': 'text-green-600 bg-green-50',
    'Initial Stock': 'text-blue-600 bg-blue-50',
    'Stock Opname': 'text-orange-500 bg-orange-50',
    'Kerusakan Barang': 'text-red-500 bg-red-50',
    'Kehilangan': 'text-red-500 bg-red-50',
    'Koreksi Input': 'text-purple-600 bg-purple-50',
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden fade-in max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <History size={16} className="text-[#685AFF]" />
            <div>
              <div className="text-[14px] font-bold text-gray-800">Riwayat Stok</div>
              <div className="text-[11px] text-gray-400">{productName || 'Semua produk'}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#685AFF]" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <History size={28} className="mx-auto mb-2 opacity-30" />
              <div className="text-[13px]">Belum ada riwayat stok</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.map(log => {
                const isIn = log.change_amount > 0
                const reasonColor = REASON_COLORS[log.reason || ''] || 'text-gray-500 bg-gray-100'
                return (
                  <div key={log.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', isIn ? 'bg-green-50' : 'bg-red-50')}>
                      {isIn ? <ArrowUp size={14} className="text-green-600" /> : <ArrowDown size={14} className="text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {!productId && log.products && (
                        <div className="text-[11px] text-gray-400 truncate mb-0.5">
                          {log.products.image_emoji} {log.products.name}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-semibold', reasonColor)}>
                          {log.reason || 'Tidak ada alasan'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{formatDate(log.created_at, 'dd MMM yyyy, HH:mm')}</div>
                    </div>
                    <div className={cn('text-[15px] font-bold flex-shrink-0', isIn ? 'text-green-600' : 'text-red-500')}>
                      {isIn ? '+' : ''}{log.change_amount}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
