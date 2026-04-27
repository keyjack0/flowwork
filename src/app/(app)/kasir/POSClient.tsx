'use client'

import { useState } from 'react'
import { Search, Trash2, Plus, Minus, ShoppingCart, X, CreditCard, Receipt as ReceiptIcon } from 'lucide-react'
import { Product, CartItem } from '@/types'
import { formatRupiah, cn } from '@/lib/utils'
import PaymentModal from '@/components/pos/paymentModal'
import Receipt from '@/components/pos/receipt'
import toast from 'react-hot-toast'

interface POSClientProps {
  products: Product[]
}

interface LastTransaction {
  orderId: string
  method: string
  cashReceived?: number
  change?: number
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
}

export default function POSClient({ products }: POSClientProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastTx, setLastTx] = useState<LastTransaction | null>(null)
  const [discount, setDiscount] = useState(0)
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const [discountInput, setDiscountInput] = useState('')

  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]]

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'Semua' || p.category === activeCategory
    return matchSearch && matchCat
  })

  const subtotal = cart.reduce((s, item) => s + item.selling_price * item.qty, 0)
  const tax = Math.round(subtotal * 0.11)
  const total = subtotal + tax - discount
  const itemCount = cart.reduce((s, i) => s + i.qty, 0)

  function addToCart(product: Product) {
    if (product.stock <= 0) { toast.error('Stok habis!'); return }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        if (existing.qty >= product.stock) { toast.error('Stok tidak mencukupi'); return prev }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  function changeQty(id: string, delta: number) {
    setCart(prev =>
      prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
    )
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  function clearCart() {
    setCart([])
    setDiscount(0)
    setDiscountInput('')
    setShowDiscountInput(false)
  }

  function applyDiscount() {
    const val = parseInt(discountInput.replace(/\D/g, '')) || 0
    if (val > subtotal) { toast.error('Diskon melebihi subtotal'); return }
    setDiscount(val)
    setShowDiscountInput(false)
    toast.success('Diskon diterapkan')
  }

  function handlePaymentSuccess(orderId: string, method: string, change?: number) {
    const cashReceived = change !== undefined ? total + change : undefined
    setLastTx({ orderId, method, cashReceived, change, items: [...cart], subtotal, tax, discount, total })
    clearCart()
    setShowPayment(false)
    setShowReceipt(true)
    toast.success('Transaksi berhasil!')
  }

  return (
    <>
      <script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} async />

      <div className="flex gap-4 h-full">

        {/* Product Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari produk atau scan barcode..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#685AFF] focus:outline-none"
            />
          </div>

          <div className="flex gap-2 mb-3 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all',
                  activeCategory === cat ? 'bg-[#685AFF] text-white border-[#685AFF]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#685AFF] hover:text-[#685AFF]'
                )}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 overflow-y-auto pb-2">
            {filtered.map(product => {
              const isLow = product.stock <= product.min_stock_alert
              const inCart = cart.find(i => i.id === product.id)
              return (
                <div key={product.id} onClick={() => addToCart(product)}
                  className={cn(
                    'bg-white border rounded-xl p-3 cursor-pointer transition-all hover:shadow-sm active:scale-[0.98]',
                    inCart ? 'border-[#685AFF] shadow-sm ring-1 ring-[rgba(104,90,255,0.2)]' : isLow ? 'border-yellow-200' : 'border-gray-100',
                    product.stock === 0 && 'opacity-50 cursor-not-allowed'
                  )}>
                  <div className="w-full aspect-square bg-[rgba(104,90,255,0.06)] rounded-lg flex items-center justify-center text-3xl mb-2">
                    {product.image_emoji}
                  </div>
                  <div className="text-[12px] font-semibold text-gray-800 mb-0.5 truncate">{product.name}</div>
                  <div className="text-[10px] text-gray-400 mb-2">{product.sku}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-bold text-[#685AFF]">{formatRupiah(product.selling_price)}</div>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium',
                      product.stock === 0 ? 'bg-red-50 text-red-500' : isLow ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
                    )}>
                      {product.stock === 0 ? 'Habis' : product.stock + ' pcs'}
                    </span>
                  </div>
                  {inCart && (
                    <div className="mt-1.5 text-center text-[10px] font-semibold text-[#685AFF] bg-[rgba(104,90,255,0.08)] rounded py-0.5">
                      {inCart.qty} di keranjang
                    </div>
                  )}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-3 py-16 text-center text-gray-400 text-sm">Produk tidak ditemukan</div>
            )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="w-[320px] bg-white border border-gray-100 rounded-xl flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={15} className="text-[#685AFF]" />
              <span className="text-[13px] font-semibold text-gray-800">Keranjang</span>
              {itemCount > 0 && <span className="bg-[#685AFF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{itemCount}</span>}
            </div>
            <div className="flex items-center gap-2">
              {lastTx && (
                <button onClick={() => setShowReceipt(true)} className="flex items-center gap-1 text-[11px] text-[#685AFF] hover:underline">
                  <ReceiptIcon size={11} /> Struk
                </button>
              )}
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                <ShoppingCart size={32} className="mb-2 opacity-30" />
                <div className="text-[13px]">Pilih produk untuk ditambah</div>
                <div className="text-[11px] text-gray-300 mt-1">Klik produk di sebelah kiri</div>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group">
                    <span className="text-lg flex-shrink-0">{item.image_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-gray-800 truncate">{item.name}</div>
                      <div className="text-[10px] text-gray-400">{formatRupiah(item.selling_price)} / pcs</div>
                      <div className="text-[11px] text-[#685AFF] font-bold">{formatRupiah(item.selling_price * item.qty)}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => changeQty(item.id, -1)} className="w-5 h-5 rounded border border-gray-200 bg-white flex items-center justify-center hover:border-[#685AFF] hover:text-[#685AFF] transition-colors">
                        <Minus size={10} />
                      </button>
                      <span className="text-[12px] font-bold min-w-[20px] text-center">{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} className="w-5 h-5 rounded border border-gray-200 bg-white flex items-center justify-center hover:border-[#685AFF] hover:text-[#685AFF] transition-colors">
                        <Plus size={10} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-[12px] text-gray-500">
                  <span>Subtotal ({itemCount} item)</span><span>{formatRupiah(subtotal)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between text-[12px] text-green-600">
                    <span className="flex items-center gap-1">
                      Diskon
                      <button onClick={() => { setDiscount(0); setDiscountInput('') }} className="text-red-400 hover:text-red-600"><X size={10} /></button>
                    </span>
                    <span>- {formatRupiah(discount)}</span>
                  </div>
                ) : (
                  <button onClick={() => setShowDiscountInput(!showDiscountInput)} className="text-[11px] text-[#685AFF] hover:underline">
                    + Tambah Diskon
                  </button>
                )}
                {showDiscountInput && discount === 0 && (
                  <div className="flex gap-1.5">
                    <input type="text" value={discountInput} onChange={e => setDiscountInput(e.target.value)}
                      placeholder="Nominal diskon (Rp)"
                      className="flex-1 px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:border-[#685AFF] focus:outline-none" />
                    <button onClick={applyDiscount} className="px-2.5 py-1.5 bg-green-500 text-white text-[11px] font-semibold rounded-lg hover:bg-green-600 transition-colors">
                      OK
                    </button>
                  </div>
                )}
                <div className="flex justify-between text-[12px] text-gray-500">
                  <span>PPN 11%</span><span>{formatRupiah(tax)}</span>
                </div>
                <div className="flex justify-between text-[15px] font-bold text-gray-800 pt-2 border-t border-gray-100">
                  <span>Total Bayar</span>
                  <span className="text-[#685AFF]">{formatRupiah(total)}</span>
                </div>
              </div>

              <button
                onClick={() => setShowPayment(true)}
                className="w-full py-3 bg-[#685AFF] text-white rounded-xl text-[14px] font-bold hover:bg-[#4A3FCC] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <CreditCard size={16} /> Proses Pembayaran
              </button>
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
        cart={cart}
        subtotal={subtotal}
        tax={tax}
        discount={discount}
        total={total}
      />

      {lastTx && (
        <Receipt
          open={showReceipt}
          onClose={() => setShowReceipt(false)}
          orderId={lastTx.orderId}
          items={lastTx.items}
          subtotal={lastTx.subtotal}
          tax={lastTx.tax}
          discount={lastTx.discount}
          total={lastTx.total}
          cashReceived={lastTx.cashReceived}
          change={lastTx.change}
          paymentMethod={lastTx.method}
        />
      )}
    </>
  )
}
