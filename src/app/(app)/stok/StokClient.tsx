'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Search, Plus, Edit2, Trash2, RefreshCw, ClipboardList,
  History, AlertTriangle, Package, TrendingDown, CheckCircle2,
  Filter, Bell, ArrowUpDown
} from 'lucide-react'
import { Product } from '@/types'
import { formatRupiah, calculateMargin, formatDate, cn } from '@/lib/utils'
import ProductFormModal from '@/components/stock/ProductFormModal'
import RestockModal from '@/components/stock/RestockModal'
import OpnameModal from '@/components/stock/OpnameModal'
import StockLogPanel from '@/components/stock/StockLogPanel'
import toast from 'react-hot-toast'

interface Props { initialProducts: Product[] }

type Filter = 'all' | 'low' | 'out'
type SortKey = 'name' | 'stock' | 'selling_price' | 'margin'

export default function StokClient({ initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Filter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Semua')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)
  const [opnameProduct, setOpnameProduct] = useState<Product | null>(null)
  const [showLogPanel, setShowLogPanel] = useState(false)
  const [logProduct, setLogProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)

  // Derived stats
  const stats = useMemo(() => {
    const total = products.length
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.min_stock_alert).length
    const outOfStock = products.filter(p => p.stock === 0).length
    const totalValue = products.reduce((s, p) => s + p.base_price_modal * p.stock, 0)
    return { total, lowStock, outOfStock, totalValue }
  }, [products])

  const categories = useMemo(() =>
    ['Semua', ...Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]]
  , [products])

  // Filtered + sorted products
  const filtered = useMemo(() => {
    let result = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
      const matchCat = activeCategory === 'Semua' || p.category === activeCategory
      const matchFilter = filterStatus === 'all' ? true
        : filterStatus === 'low' ? (p.stock > 0 && p.stock <= p.min_stock_alert)
        : p.stock === 0
      return matchSearch && matchCat && matchFilter
    })

    result = result.sort((a, b) => {
      let va: any, vb: any
      if (sortKey === 'name') { va = a.name; vb = b.name }
      else if (sortKey === 'stock') { va = a.stock; vb = b.stock }
      else if (sortKey === 'selling_price') { va = a.selling_price; vb = b.selling_price }
      else if (sortKey === 'margin') { va = calculateMargin(a.selling_price, a.base_price_modal); vb = calculateMargin(b.selling_price, b.base_price_modal) }
      if (va < vb) return sortAsc ? -1 : 1
      if (va > vb) return sortAsc ? 1 : -1
      return 0
    })

    return result
  }, [products, search, activeCategory, filterStatus, sortKey, sortAsc])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  // Handlers
  function handleProductAdded(product: Product) {
    setProducts(prev => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)))
  }

  function handleProductUpdated(product: Product) {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p))
  }

  function handleStockUpdated(productId: string, newStock: number) {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p))
  }

  async function handleDelete(product: Product) {
    try {
      const res = await fetch(`/api/products?id=${product.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProducts(prev => prev.filter(p => p.id !== product.id))
      toast.success(`${product.name} berhasil dihapus`)
      setDeleteConfirm(null)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const SortBtn = ({ col, label }: { col: SortKey; label: string }) => (
    <button onClick={() => toggleSort(col)} className="flex items-center gap-1 hover:text-[#685AFF] transition-colors group">
      {label}
      <ArrowUpDown size={10} className={cn('transition-colors', sortKey === col ? 'text-[#685AFF]' : 'text-gray-300 group-hover:text-gray-400')} />
    </button>
  )

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Alert Banner */}
      {stats.lowStock > 0 || stats.outOfStock > 0 ? (
        <div className="mx-6 mt-4 flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <Bell size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-[12px]">
            <span className="font-semibold text-amber-700">Perhatian Stok: </span>
            {stats.outOfStock > 0 && <span className="text-red-600"><strong>{stats.outOfStock} produk habis</strong> (stok 0). </span>}
            {stats.lowStock > 0 && <span className="text-amber-600"><strong>{stats.lowStock} produk</strong> mendekati batas minimum. </span>}
            <span className="text-amber-600">Segera lakukan restock.</span>
          </div>
          <button onClick={() => setFilterStatus('low')} className="text-[11px] text-amber-700 border border-amber-300 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap flex-shrink-0">
            Lihat Semua
          </button>
        </div>
      ) : null}

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3 px-6 pt-4 flex-shrink-0">
        {[
          { label: 'Total Produk', value: stats.total, icon: Package, color: '#685AFF', bg: 'rgba(104,90,255,0.08)', filter: 'all' as Filter },
          { label: 'Stok Menipis', value: stats.lowStock, icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', filter: 'low' as Filter },
          { label: 'Stok Habis', value: stats.outOfStock, icon: TrendingDown, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', filter: 'out' as Filter },
          { label: 'Nilai Inventaris', value: formatRupiah(stats.totalValue, true), icon: CheckCircle2, color: '#22C55E', bg: 'rgba(34,197,94,0.08)', filter: null },
        ].map(card => (
          <button
            key={card.label}
            onClick={() => card.filter && setFilterStatus(card.filter)}
            className={cn('text-left p-4 rounded-xl border transition-all', filterStatus === card.filter && card.filter ? 'border-[#685AFF] shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200')}
            style={{ background: filterStatus === card.filter && card.filter ? card.bg : 'white' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{card.label}</span>
              <card.icon size={14} style={{ color: card.color }} />
            </div>
            <div className="text-[20px] font-bold text-gray-800">{card.value}</div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 flex-shrink-0">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari produk atau SKU..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:border-[#685AFF] focus:outline-none"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={cn('px-3 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap border transition-all',
                activeCategory === cat ? 'bg-[#685AFF] text-white border-[#685AFF]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#685AFF] hover:text-[#685AFF]'
              )}>
              {cat}
            </button>
          ))}
        </div>

        <button onClick={() => setShowLogPanel(true)}
          className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 bg-white rounded-lg text-[12px] text-gray-600 hover:border-[#685AFF] hover:text-[#685AFF] transition-colors whitespace-nowrap">
          <History size={13} /> Riwayat
        </button>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#685AFF] text-white rounded-lg text-[13px] font-semibold hover:bg-[#4A3FCC] transition-colors whitespace-nowrap">
          <Plus size={14} /> Produk Baru
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Produk</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">SKU</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Kategori</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide cursor-pointer"><SortBtn col="stock" label="Stok" /></th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Min Alert</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">H. Modal</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide cursor-pointer"><SortBtn col="selling_price" label="H. Jual" /></th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide cursor-pointer"><SortBtn col="margin" label="Margin" /></th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Package size={32} className="mx-auto mb-2 text-gray-300" />
                    <div className="text-[13px] text-gray-400">
                      {search ? 'Produk tidak ditemukan' : filterStatus !== 'all' ? 'Tidak ada produk dengan filter ini' : 'Belum ada produk'}
                    </div>
                    {filterStatus !== 'all' && (
                      <button onClick={() => setFilterStatus('all')} className="mt-2 text-[12px] text-[#685AFF] hover:underline">Tampilkan semua</button>
                    )}
                  </td>
                </tr>
              ) : filtered.map(product => {
                const isOut = product.stock === 0
                const isLow = !isOut && product.stock <= product.min_stock_alert
                const margin = calculateMargin(product.selling_price, product.base_price_modal)

                return (
                  <tr key={product.id} className={cn('border-t border-gray-50 hover:bg-gray-50 transition-colors', isOut && 'bg-red-50/30', isLow && 'bg-yellow-50/30')}>
                    {/* Produk */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{product.image_emoji}</span>
                        <div>
                          <div className="text-[13px] font-semibold text-gray-800">{product.name}</div>
                          {product.description && <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{product.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-400">{product.sku}</td>
                    <td className="px-4 py-3"><span className="badge badge-primary text-[10px]">{product.category || '-'}</span></td>

                    {/* Stok */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-[15px] font-bold',
                          isOut ? 'text-red-500' : isLow ? 'text-yellow-600' : 'text-gray-800'
                        )}>
                          {product.stock}
                        </span>
                        {isOut && <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 rounded font-semibold">Habis</span>}
                        {isLow && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-50 text-yellow-600 rounded font-semibold">Menipis</span>}
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-1 h-1 w-16 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-1 rounded-full transition-all', isOut ? 'bg-red-400' : isLow ? 'bg-yellow-400' : 'bg-green-400')}
                          style={{ width: `${Math.min(100, (product.stock / Math.max(product.min_stock_alert * 3, 1)) * 100)}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3 text-[12px] text-gray-500">{product.min_stock_alert}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-600">{formatRupiah(product.base_price_modal)}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-gray-800">{formatRupiah(product.selling_price)}</td>

                    {/* Margin */}
                    <td className="px-4 py-3">
                      <span className={cn('text-[12px] font-bold', margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-500')}>
                        {margin}%
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setRestockProduct(product)}
                          title="Restock"
                          className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <RefreshCw size={13} />
                        </button>
                        <button
                          onClick={() => setOpnameProduct(product)}
                          title="Stock Opname"
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <ClipboardList size={13} />
                        </button>
                        <button
                          onClick={() => { setLogProduct(product); setShowLogPanel(true) }}
                          title="Riwayat Stok"
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <History size={13} />
                        </button>
                        <button
                          onClick={() => setEditProduct(product)}
                          title="Edit Produk"
                          className="p-1.5 text-[#685AFF] hover:bg-[rgba(104,90,255,0.08)] rounded-lg transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product)}
                          title="Hapus Produk"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-[11px] text-gray-400">
              Menampilkan {filtered.length} dari {products.length} produk
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 fade-in">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{deleteConfirm.image_emoji}</div>
              <div className="text-[15px] font-bold text-gray-800 mb-1">Hapus Produk?</div>
              <div className="text-[13px] text-gray-500">
                <strong>{deleteConfirm.name}</strong> akan dinonaktifkan. Data transaksi lama tidak akan terpengaruh.
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[13px] font-bold hover:bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleProductAdded}
      />
      <ProductFormModal
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        onSuccess={handleProductUpdated}
        editProduct={editProduct}
      />
      <RestockModal
        open={!!restockProduct}
        onClose={() => setRestockProduct(null)}
        onSuccess={handleStockUpdated}
        product={restockProduct}
      />
      <OpnameModal
        open={!!opnameProduct}
        onClose={() => setOpnameProduct(null)}
        onSuccess={handleStockUpdated}
        product={opnameProduct}
      />
      <StockLogPanel
        open={showLogPanel}
        onClose={() => { setShowLogPanel(false); setLogProduct(null) }}
        productId={logProduct?.id}
        productName={logProduct?.name}
      />
    </div>
  )
}
