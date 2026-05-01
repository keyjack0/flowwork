'use client'

import { useRef } from 'react'
import { X, Printer } from 'lucide-react'
import { CartItem } from '@/types'
import { formatRupiah, formatDate } from '@/lib/utils'

interface ReceiptProps {
    open: boolean
    onClose: () => void
    orderId: string
    items: CartItem[]
    subtotal: number
    tax: number
    discount: number
    total: number
    cashReceived?: number
    change?: number
    paymentMethod: string
    cashierName?: string
}

export default function Receipt({
    open, onClose, orderId, items,
    subtotal, tax, discount, total,
    cashReceived, change, paymentMethod, cashierName = 'Kasir',
}: ReceiptProps) {
    const printRef = useRef<HTMLDivElement>(null)

    function handlePrint() {
        const content = printRef.current?.innerHTML
        if (!content) return
        const win = window.open('', '_blank', 'width=400,height=600')
        if (!win) return
        win.document.write(`
      <html><head><title>Struk - ${orderId}</title>
      <style>
        @page { size: 80mm auto; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; padding: 10px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin: 4px 0; }
        .change-row { display: flex; justify-content: space-between; font-size: 15px;  }
      </style></head>
      <body>${content}</body></html>
    `)
        win.document.close()
        win.print()
        win.close()
    }

    if (!open) return null

    const now = new Date()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden fade-in">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="text-[14px] font-bold text-gray-800">Struk Pembayaran</div>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#685AFF] text-white text-[12px] font-medium rounded-lg hover:bg-[#4A3FCC] transition-colors">
                            <Printer size={13} /> Cetak
                        </button>
                        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Receipt content */}
                <div className="p-5 overflow-y-auto max-h-[70vh]">
                    <div ref={printRef}>
                        {/* Store header */}
                        <div className="center" style={{ textAlign: 'center', marginBottom: 12 }}>
                            <div className="bold" style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>FLOWWORK</div>
                            <div style={{ fontSize: 11, color: '#888' }}>Manajemen Bisnis Terintegrasi</div>
                            <div style={{ fontSize: 11, color: '#888' }}>Jl. Contoh No. 123, Jakarta</div>
                        </div>

                        <div className="line" style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

                        {/* Transaction info */}
                        <div style={{ fontSize: 11, marginBottom: 8, color: '#666' }}>
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ color: '#666' }}>No. Transaksi</span>
                                <span style={{  color: '#666' }}>{orderId}</span>
                            </div>
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ color: '#666' }}>Tanggal</span>
                                <span >{formatDate(now, 'dd/MM/yyyy HH:mm')}</span>
                            </div>
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span >Kasir</span>
                                <span >{cashierName}</span>
                            </div>
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span >Pembayaran</span>
                                <span style={{ fontWeight: 500, color: '#000'}}>{paymentMethod}</span>
                            </div>
                        </div>

                        <div className="line" style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

                        {/* Items */}
                        <div style={{ marginBottom: 8, color: '#666' }}>
                            {items.map(item => (
                                <div key={item.id} style={{ marginBottom: 6 }}>
                                    <div style={{ fontSize: 11 }}>{item.name}</div>
                                    <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                        <span>{item.qty} x {formatRupiah(item.selling_price)}</span>
                                        <span >{formatRupiah(item.selling_price * item.qty)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="line" style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

                        {/* Totals */}
                        <div style={{ fontSize: 11, marginBottom: 4, color: '#666' }}>
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ color: '#666' }}>Subtotal</span>
                                <span>{formatRupiah(subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                    <span>Diskon</span>
                                    <span>- {formatRupiah(discount)}</span>
                                </div>
                            )}
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ color: '#666' }}>PPN 11%</span>
                                <span>{formatRupiah(tax)}</span>
                            </div>
                        </div>

                        <div className="line" style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

                        <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                            <span>Total</span>
                            <span>{formatRupiah(total)}</span>
                        </div>

                        {paymentMethod === 'Cash' && cashReceived !== undefined && (
                            <>
                                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                                    <span style={{ color: '#666' }}>Tunai Diterima</span>
                                    <span style={{ color: '#666' }}>{formatRupiah(cashReceived)}</span>
                                </div>
                                <div className="change-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666' }}>
                                    <span >Kembalian</span>
                                    <span>{formatRupiah(change || 0)}</span>
                                </div>
                            </>
                        )}

                        <div className="line" style={{ borderTop: '1px dashed #ccc', margin: '12px 0 8px' }} />

                        {/* Footer */}
                        <div className="center" style={{ textAlign: 'center', fontSize: 11, color: '#999' }}>
                            <div style={{ marginBottom: 2 }}>Terima kasih telah berbelanja!</div>
                            <div>Barang yang sudah dibeli tidak dapat dikembalikan</div>
                            <div style={{ marginTop: 6, fontSize: 10 }}>Powered by Flowwork</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
