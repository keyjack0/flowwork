'use client'

import { useRef, useEffect, useState } from 'react'
import { X, Printer, Download, Share2, Loader2, MessageCircle } from 'lucide-react'
import { CartItem } from '@/types'
import { formatRupiah, formatDate } from '@/lib/utils'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

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

const RECEIPT_WIDTH_MM = 80
const RECEIPT_WIDTH_PX = 302

export default function Receipt({
    open, onClose, orderId, items,
    subtotal, tax, discount, total,
    cashReceived, change, paymentMethod, cashierName = 'Kasir',
}: ReceiptProps) {
    const printRef = useRef<HTMLDivElement>(null)
    const [isDownloading, setIsDownloading] = useState(false)
    const [isAutoDownloading, setIsAutoDownloading] = useState(true)

    function handlePrint() {
        const content = printRef.current?.innerHTML
        if (!content) return
        const win = window.open('', '_blank', 'width=400,height=600')
        if (!win) return
        win.document.write(`
      <html><head><title>Struk - ${orderId}</title>
      <style>
        @page { size: 80mm auto; margin: 2mm; }
        @media print {
          body { width: 76mm; margin: 0; padding: 5mm; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; padding: 10px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin: 4px 0; }
        .change-row { display: flex; justify-content: space-between; font-size: 15px; }
      </style></head>
      <body>${content}</body></html>
    `)
        win.document.close()
        win.print()
        win.close()
    }

    async function handleDownloadPDF() {
        if (!printRef.current) return
        setIsDownloading(true)
        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: RECEIPT_WIDTH_PX,
            })

            const imgWidth = RECEIPT_WIDTH_MM
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [imgWidth, imgHeight],
            })

            const imgData = canvas.toDataURL('image/png')
            pdf.addImage(imgData, 'PNG', 0, -1, imgWidth, imgHeight)
            pdf.save(`struk-${orderId}.pdf`)
        } catch (err) {
            console.error('Failed to generate PDF:', err)
        } finally {
            setIsDownloading(false)
        }
    }

    function getReceiptText(): string {
        const dateStr = formatDate(new Date(), 'dd/MM/yyyy HH:mm')
        let text = `FLOWWORK\nManajemen Bisnis Terintegrasi\nJl. Contoh No. 123, Jakarta\n`
        text += `--------------------------------\n`
        text += `No. Transaksi  ${orderId}\n`
        text += `Tanggal        ${dateStr}\n`
        text += `Kasir          ${cashierName}\n`
        text += `Pembayaran     ${paymentMethod}\n`
        text += `--------------------------------\n`
        items.forEach(item => {
            text += `${item.name}\n`
            text += `${item.qty} x ${formatRupiah(item.selling_price)}    ${formatRupiah(item.selling_price * item.qty)}\n`
        })
        text += `--------------------------------\n`
        text += `Subtotal       ${formatRupiah(subtotal)}\n`
        if (discount > 0) text += `Diskon       - ${formatRupiah(discount)}\n`
        text += `PPN 11%      ${formatRupiah(tax)}\n`
        text += `--------------------------------\n`
        text += `TOTAL          ${formatRupiah(total)}\n`
        if (paymentMethod === 'Cash' && cashReceived !== undefined) {
            text += `Tunai        ${formatRupiah(cashReceived)}\n`
            text += `Kembalian    ${formatRupiah(change || 0)}\n`
        }
        text += `--------------------------------\n`
        text += `Terima kasih telah berbelanja!\n`
        text += `Powered by Flowwork`
        return text
    }

    function handleShareWA() {
        const text = getReceiptText()
        const encoded = encodeURIComponent(text)
        window.open(`https://wa.me/?text=${encoded}`, '_blank')
    }

    function handleCopyText() {
        const text = getReceiptText()
        navigator.clipboard.writeText(text).then(() => {
            // Could add toast notification here
        })
    }


    // hapus isAutoDownloading karena kalau auto download pas struk muncul itu agak mengganggu, jadi sekarang user harus klik tombol download dulu untuk generate pdf nya, dan kalau misalnya user langsung klik tombol print itu juga bakal langsung generate pdf tapi dalam format kertas 80mm yang isinya sama kaya struk yang di print, jadi nanti pas di klik cetak itu langsung muncul print dialog dengan ukuran kertas 80mm, dan untuk "icon unduh / handlePrint" itu akan lansung download format pdf 80mm yang isinya sama kaya struk yang di print
    useEffect(() => {
        if (open && isAutoDownloading) {
            const timer = setTimeout(() => {
                handleDownloadPDF()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [open])

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
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-[12px] font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                            {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                            {/* PDF */}
                        </button>
                        {/* untuk yang tombol "cetak" ini bakal di ubah ke dalam format thermal printer, jadi nanti pas di klik cetak itu langsung muncul print dialog dengan ukuran kertas 80mm, dan untuk "icon unduh / handlePrint" itu akan lansung download format pdf 80mm yang isinya sama kaya struk yang di print */}
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#685AFF] text-white text-[12px] font-medium rounded-lg hover:bg-[#4A3FCC] transition-colors"
                        >
                            <Printer size={13} />
                            Cetak
                        </button>
                        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Receipt content */}
                <div className="p-5 overflow-y-auto max-h-[60vh]">
                    <div ref={printRef} className="receipt-content" style={{ width: RECEIPT_WIDTH_PX, margin: '0 auto', padding: '10px', fontFamily: "'Courier New', monospace", fontSize: 12, color: '#000', backgroundColor: '#fff' }}>
                        {/* Store header */}
                        <div style={{ textAlign: 'center', marginBottom: 12}}>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>FLOWWORK</div>
                            <div style={{ fontSize: 11, color: '#888' }}>Manajemen Bisnis Terintegrasi</div>
                            <div style={{ fontSize: 11, color: '#888' }}>Jl. Contoh No. 123, Jakarta</div>
                        </div>

                        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                        {/* Transaction info */}
                        <div style={{ fontSize: 11, marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ color: '#666' }}>No. Transaksi</span>
                                <span style={{ color: '#666' }}>{orderId}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ color: '#666' }}>Tanggal</span>
                                <span>{formatDate(now, 'dd/MM/yyyy HH:mm')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span>Kasir</span>
                                <span>{cashierName}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Pembayaran</span>
                                <span style={{ fontWeight: 500 }}>{paymentMethod}</span>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                        {/* Items */}
                        <div style={{ marginBottom: 8 }}>
                            {items.map(item => (
                                <div key={item.id} style={{ marginBottom: 6 }}>
                                    <div style={{ fontSize: 11 }}>{item.name}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                        <span>{item.qty} x {formatRupiah(item.selling_price)}</span>
                                        <span>{formatRupiah(item.selling_price * item.qty)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                        {/* Totals */}
                        <div style={{ fontSize: 11, marginBottom: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ color: '#666' }}>Subtotal</span>
                                <span>{formatRupiah(subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                    <span>Diskon</span>
                                    <span>- {formatRupiah(discount)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ color: '#666' }}>PPN 11%</span>
                                <span>{formatRupiah(tax)}</span>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, fontWeight: 'bold' }}>
                            <span>Total</span>
                            <span>{formatRupiah(total)}</span>
                        </div>

                        {paymentMethod === 'Cash' && cashReceived !== undefined && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                                    <span style={{ color: '#666' }}>Tunai Diterima</span>
                                    <span style={{ color: '#666' }}>{formatRupiah(cashReceived)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                    <span>Kembalian</span>
                                    <span>{formatRupiah(change || 0)}</span>
                                </div>
                            </>
                        )}

                        <div style={{ borderTop: '1px dashed #000', margin: '12px 0 8px' }} />

                        {/* Footer */}
                        <div style={{ textAlign: 'center', fontSize: 11, color: '#666' }}>
                            <div style={{ marginBottom: 2 }}>Terima kasih telah berbelanja!</div>
                            <div>Barang yang sudah dibeli tidak dapat dikembalikan</div>
                            <div style={{ marginTop: 6, fontSize: 10 }}>Powered by Flowwork</div>
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="px-5 pb-4 pt-2 border-t border-gray-100">
                    <div className="flex gap-2">
                        <button
                            onClick={handleShareWA}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[#25D366] text-white text-[12px] font-medium rounded-lg hover:bg-[#20BD5A] transition-colors"
                        >
                            <MessageCircle size={14} />
                            Kirim ke WhatsApp
                        </button>
                        <button
                            onClick={handleCopyText}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 text-gray-700 text-[12px] font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Share2 size={14} />
                            Salin Teks
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
