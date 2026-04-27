'use client'

import { useState } from 'react'
import { Search, AlertTriangle, Plus, Edit2, Package } from 'lucide-react'
import { Product } from '@/types'
import { formatRupiah, calculateMargin, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface StokClientProps {
  products: Product[]
  lowStockCount: number
}

export default function StokClient({ products, lowStockCount }: StokClientProps) {
  const [search, setSearch] = useState('')

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fade-in">
      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl mb-4">
          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-yellow-600" />
          </div>
          <div className="flex-1">
            <span className="text-[13px] font-semibold text-yellow-700">{lowStockCount} produk</span>
            <span className="text-[13px] text-yellow-600"> mendekati batas stok minimum. Segera lakukan restock.</span>
          </div>
          <button className="text-[12px] text-yellow-700 font-medium border border-yellow-300 px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition-colors flex-shrink-0">
            Lihat Semua
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari produk, SKU, kategori..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#685AFF] focus:outline-none"
          />
        </div>
        <button onClick={() => toast('Form tambah produk coming soon!')} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#685AFF] text-white rounded-lg text-[13px] font-medium hover:bg-[#4A3FCC] transition-colors">
          <Plus size={14} />
          Produk Baru
        </button>
        <button onClick={() => toast('Fitur Stock Opname coming soon!')} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-50 transition-colors">
          <Package size={14} />
          Stock Opname
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['SKU', 'Produk', 'Kategori', 'Stok', 'Min. Stok', 'H. Modal', 'H. Jual', 'Margin', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const isLow = product.stock <= product.min_stock_alert
                const margin = calculateMargin(product.selling_price, product.base_price_modal)
                return (
                  <tr key={product.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-400">{product.sku}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{product.image_emoji}</span>
                        <span className="text-[13px] font-medium text-gray-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-primary">{product.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[13px] font-bold', isLow ? 'text-yellow-600' : 'text-gray-800')}>
                        {product.stock}
                      </span>
                      {isLow && <span className="ml-1 text-yellow-500">⚠️</span>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-400">{product.min_stock_alert}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-600">{formatRupiah(product.base_price_modal)}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-gray-800">{formatRupiah(product.selling_price)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[12px] font-bold', margin >= 30 ? 'text-green-600' : 'text-yellow-600')}>
                        {margin}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toast(`Edit produk: ${product.name}`)}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 border border-gray-200 rounded-lg hover:border-[#685AFF] hover:text-[#685AFF] transition-colors"
                      >
                        <Edit2 size={11} />
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Tidak ada produk ditemukan
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
