'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    X, Banknote, QrCode, CreditCard, Loader2,
    CheckCircle2, ChevronRight, RotateCcw, Smartphone
} from 'lucide-react'
import { CartItem } from '@/types'
import { formatRupiah, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface PaymentModalProps {
    open: boolean
    onClose: () => void
    onSuccess: (orderId: string, method: string, change?: number) => void
    onNewTransaction?: () => void
    cart: CartItem[]
    subtotal: number
    tax: number
    discount: number
    total: number
}

type Step = 'method' | 'cash_input' | 'qris_waiting' | 'snap_waiting' | 'done'
type Method = 'cash' | 'qris' | 'snap'

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000]

export default function PaymentModal({
    open, onClose, onSuccess, onNewTransaction,
    cart, subtotal, tax, discount, total,
}: PaymentModalProps) {
    const [step, setStep] = useState<Step>('method')
    const [method, setMethod] = useState<Method>('cash')
    const [cashInput, setCashInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [qrisData, setQrisData] = useState<{ qrUrl: string; orderId: string } | null>(null)
    const [snapOrderId, setSnapOrderId] = useState<string | null>(null)
    const [doneData, setDoneData] = useState<{ orderId: string; change: number; method: string } | null>(null)
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    const cashParsed = parseInt(cashInput.replace(/\D/g, '')) || 0
    const change = cashParsed - total
    const isCashEnough = cashParsed >= total

    // Reset state setiap kali modal dibuka
    useEffect(() => {
        if (open) {
            setStep('method')
            setMethod('cash')
            setCashInput('')
            setLoading(false)
            setQrisData(null)
            setSnapOrderId(null)
            setDoneData(null)
        }
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, [open])

    function stopPolling() {
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
    }

    const startPolling = useCallback((orderId: string, payMethod: string) => {
        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/midtrans/status?orderId=${orderId}`)
                const data = await res.json()
                if (data.status === 'success') {
                    stopPolling()
                    setDoneData({ orderId, change: 0, method: payMethod })
                    setStep('done')
                } else if (['failed', 'expired'].includes(data.status)) {
                    stopPolling()
                    toast.error('Pembayaran gagal atau expired')
                    setStep('method')
                    setQrisData(null)
                }
            } catch (e) { console.error('Polling error:', e) }
        }, 3000)
    }, [])

    // Format input cash dengan titik ribuan
    function handleCashInput(val: string) {
        const num = val.replace(/\D/g, '')
        if (!num) { setCashInput(''); return }
        setCashInput(parseInt(num).toLocaleString('id-ID'))
    }

    function addQuickAmount(amount: number) {
        const current = parseInt(cashInput.replace(/\D/g, '')) || 0
        const next = current + amount
        setCashInput(next.toLocaleString('id-ID'))
    }

    function setExactAmount() {
        setCashInput(total.toLocaleString('id-ID'))
    }

    async function processCash() {
        if (!isCashEnough) { toast.error('Uang tidak cukup'); return }
        setLoading(true)
        try {
            const res = await fetch('/api/transactions/cash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItems: cart, taxAmount: tax, discountAmount: discount }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setDoneData({ orderId: data.orderId, change, method: 'Cash' })
            setStep('done')
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    async function processQris() {
        setLoading(true)
        try {
            const res = await fetch('/api/midtrans/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartItems: cart, paymentType: 'qris_direct',
                    taxAmount: tax, discountAmount: discount,
                    customerName: 'Customer', customerEmail: 'customer@flowwork.id',
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setQrisData({ qrUrl: data.qrCode, orderId: data.orderId })
            setStep('qris_waiting')
            startPolling(data.orderId, 'QRIS')
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    async function processSnap() {
        setLoading(true)
        try {
            const res = await fetch('/api/midtrans/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartItems: cart, paymentType: 'all',
                    taxAmount: tax, discountAmount: discount,
                    customerName: 'Customer', customerEmail: 'customer@flowwork.id',
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            if (typeof window !== 'undefined' && (window as any).snap) {
                setLoading(false)
                    ; (window as any).snap.pay(data.snapToken, {
                        onSuccess: () => {
                            // Untuk VA/QRIS via Snap, callback sukses UI belum tentu settlement.
                            // Tetap polling backend sampai status internal benar-benar success.
                            setSnapOrderId(data.orderId)
                            setStep('snap_waiting')
                            startPolling(data.orderId, 'Midtrans')
                        },
                        onPending: () => {
                            setSnapOrderId(data.orderId)
                            setStep('snap_waiting')
                            startPolling(data.orderId, 'Midtrans')
                        },
                        onError: () => toast.error('Pembayaran gagal'),
                        onClose: () => setStep('method'),
                    })
            } else {
                window.open(data.redirectUrl, '_blank')
                setSnapOrderId(data.orderId)
                setStep('snap_waiting')
                startPolling(data.orderId, 'Midtrans')
                setLoading(false)
            }
        } catch (e: any) {
            toast.error(e.message)
            setLoading(false)
        }
    }

    function handleDone() {
        if (doneData) onSuccess(doneData.orderId, doneData.method, doneData.change)
        onClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => step !== 'qris_waiting' && step !== 'snap_waiting' && onClose()} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden fade-in">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <div className="text-[15px] font-bold text-gray-800">
                            {step === 'method' && 'Pilih Metode Pembayaran'}
                            {step === 'cash_input' && 'Pembayaran Tunai'}
                            {step === 'qris_waiting' && 'Scan QRIS'}
                            {step === 'snap_waiting' && 'Menunggu Pembayaran'}
                            {step === 'done' && 'Pembayaran Berhasil'}
                        </div>
                        <div className="text-[12px] text-gray-400 mt-0.5">
                            Total: <span className="font-bold text-[#685AFF]">{formatRupiah(total)}</span>
                        </div>
                    </div>
                    {step !== 'qris_waiting' && step !== 'snap_waiting' && step !== 'done' && (
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Order summary strip */}
                {step === 'method' && (
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="flex justify-between text-[12px] text-gray-500 mb-1">
                            <span>Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} item)</span>
                            <span>{formatRupiah(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-[12px] text-green-600 mb-1">
                                <span>Diskon</span><span>- {formatRupiah(discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-[12px] text-gray-500 mb-2">
                            <span>PPN 11%</span><span>{formatRupiah(tax)}</span>
                        </div>
                        <div className="flex justify-between text-[14px] font-bold text-gray-800 pt-2 border-t border-gray-200">
                            <span>Total Bayar</span>
                            <span className="text-[#685AFF]">{formatRupiah(total)}</span>
                        </div>
                    </div>
                )}

                {/* ── STEP: Pilih Metode ── */}
                {step === 'method' && (
                    <div className="p-5 space-y-3">
                        {[
                            { id: 'cash' as Method, icon: Banknote, label: 'Tunai (Cash)', desc: 'Hitung kembalian otomatis', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                            { id: 'qris' as Method, icon: QrCode, label: 'QRIS', desc: 'GoPay, OVO, Dana, ShopeePay', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                            { id: 'snap' as Method, icon: CreditCard, label: 'Kartu / Transfer / E-Wallet', desc: 'BCA, BRI, BNI, Mandiri, Kredivo', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setMethod(opt.id)}
                                className={cn(
                                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                                    method === opt.id ? `${opt.border} ${opt.bg}` : 'border-gray-100 hover:border-gray-200 bg-white'
                                )}
                            >
                                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', method === opt.id ? opt.bg : 'bg-gray-100')}>
                                    <opt.icon size={20} className={method === opt.id ? opt.color : 'text-gray-400'} />
                                </div>
                                <div className="flex-1">
                                    <div className={cn('text-[13px] font-semibold', method === opt.id ? 'text-gray-800' : 'text-gray-700')}>{opt.label}</div>
                                    <div className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</div>
                                </div>
                                <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all', method === opt.id ? 'border-[#685AFF] bg-[#685AFF]' : 'border-gray-300')}>
                                    {method === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                            </button>
                        ))}

                        <button
                            onClick={() => {
                                if (method === 'cash') setStep('cash_input')
                                else if (method === 'qris') processQris()
                                else processSnap()
                            }}
                            disabled={loading}
                            className="w-full py-3.5 bg-[#685AFF] text-white rounded-xl text-[14px] font-bold hover:bg-[#4A3FCC] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <><Loader2 size={16} className="animate-spin" />Memproses...</>
                                : <>{method === 'cash' ? 'Lanjut Input Uang' : 'Proses Pembayaran'} <ChevronRight size={16} /></>}
                        </button>
                    </div>
                )}

                {/* ── STEP: Input Cash ── */}
                {step === 'cash_input' && (
                    <div className="p-5">
                        <div className="mb-4">
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Uang Diterima</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-bold text-gray-400">Rp</span>
                                <input
                                    type="text"
                                    value={cashInput}
                                    onChange={e => handleCashInput(e.target.value)}
                                    placeholder="0"
                                    autoFocus
                                    className="w-full pl-10 pr-4 py-4 text-[22px] font-bold text-gray-800 border-2 border-gray-200 rounded-xl focus:border-[#685AFF] focus:outline-none transition-colors text-right"
                                />
                            </div>
                        </div>

                        {/* Quick amounts */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {QUICK_AMOUNTS.map(amt => (
                                <button key={amt} onClick={() => addQuickAmount(amt)}
                                    className="py-2 text-[12px] font-semibold text-[#685AFF] bg-[rgba(104,90,255,0.08)] rounded-lg hover:bg-[rgba(104,90,255,0.15)] transition-colors">
                                    +{amt >= 1000 ? (amt / 1000) + 'rb' : amt}
                                </button>
                            ))}
                        </div>
                        <button onClick={setExactAmount} className="w-full py-2 text-[12px] font-medium text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-[#685AFF] hover:text-[#685AFF] transition-colors mb-4">
                            Pas {formatRupiah(total)}
                        </button>

                        {/* Kembalian */}
                        <div className={cn(
                            'rounded-xl p-4 mb-4 transition-all',
                            !cashInput ? 'bg-gray-50' :
                                isCashEnough ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        )}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[12px] text-gray-500">Total Tagihan</span>
                                <span className="text-[13px] font-bold text-gray-800">{formatRupiah(total)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[12px] text-gray-500">Uang Diterima</span>
                                <span className="text-[13px] font-bold text-gray-800">{cashInput ? formatRupiah(cashParsed) : '-'}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                                <span className="text-[13px] font-bold text-gray-700">Kembalian</span>
                                <span className={cn('text-[18px] font-bold', isCashEnough && cashInput ? 'text-green-600' : 'text-red-500')}>
                                    {cashInput ? (isCashEnough ? formatRupiah(change) : '- Kurang ' + formatRupiah(-change)) : '-'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setStep('method')} className="px-4 py-3 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                Kembali
                            </button>
                            <button
                                onClick={processCash}
                                disabled={!isCashEnough || loading}
                                className="flex-1 py-3 bg-[#685AFF] text-white rounded-xl text-[14px] font-bold hover:bg-[#4A3FCC] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <><Loader2 size={15} className="animate-spin" />Memproses...</> : <>✓ Konfirmasi Bayar</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP: QRIS Waiting ── */}
                {step === 'qris_waiting' && qrisData && (
                    <div className="p-5 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[11px] font-semibold mb-4">
                            <Loader2 size={11} className="animate-spin" />
                            Menunggu pembayaran...
                        </div>

                        {/* QR Code */}
                        <div className="inline-block p-3 border-2 border-[#685AFF] rounded-2xl mb-4">
                            {qrisData.qrUrl ? (
                                <img src={qrisData.qrUrl} alt="QRIS" className="w-44 h-44 rounded-lg" />
                            ) : (
                                <div className="w-44 h-44 bg-gray-50 rounded-lg flex items-center justify-center">
                                    <QrCode size={64} className="text-gray-300" />
                                </div>
                            )}
                        </div>

                        <div className="text-[11px] text-gray-400 mb-1">Scan dengan aplikasi e-wallet apapun</div>
                        <div className="text-[22px] font-bold text-gray-800 mb-1">{formatRupiah(total)}</div>
                        <div className="font-mono text-[11px] text-gray-300 mb-4">{qrisData.orderId}</div>

                        {/* Supported apps */}
                        <div className="flex justify-center gap-2 mb-5">
                            {['GoPay', 'OVO', 'Dana', 'ShopeePay', 'LinkAja'].map(app => (
                                <span key={app} className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-medium text-gray-500">{app}</span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => { stopPolling(); setQrisData(null); setStep('method') }}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <RotateCcw size={13} /> Ganti Metode
                            </button>
                            <button
                                onClick={() => startPolling(qrisData.orderId, 'QRIS')}
                                className="flex-1 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-[13px] font-medium hover:bg-blue-100 transition-colors"
                            >
                                Cek Ulang Status
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP: Snap Waiting ── */}
                {step === 'snap_waiting' && (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Smartphone size={28} className="text-purple-500" />
                        </div>
                        <div className="text-[15px] font-bold text-gray-800 mb-2">Selesaikan Pembayaran</div>
                        <div className="text-[13px] text-gray-500 mb-1">Lanjutkan di tab/popup Midtrans</div>
                        <div className="font-mono text-[11px] text-gray-300 mb-6">{snapOrderId}</div>
                        <div className="flex items-center justify-center gap-2 text-[12px] text-gray-400 mb-6">
                            <Loader2 size={14} className="animate-spin text-[#685AFF]" />
                            Menunggu konfirmasi pembayaran...
                        </div>
                        <button
                            onClick={() => { stopPolling(); setStep('method') }}
                            className="px-5 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                            Batalkan & Ganti Metode
                        </button>
                    </div>
                )}

                {/* ── STEP: Done ── */}
                {step === 'done' && doneData && (
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 size={36} className="text-green-500" />
                        </div>
                        <div className="text-[17px] font-bold text-gray-800 mb-1">Pembayaran Berhasil!</div>
                        <div className="font-mono text-[11px] text-gray-400 mb-5">{doneData.orderId}</div>

                        {/* Ringkasan */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left space-y-2">
                            <div className="flex justify-between text-[12px]">
                                <span className="text-gray-500">Total</span>
                                <span className="font-bold text-gray-800">{formatRupiah(total)}</span>
                            </div>
                            <div className="flex justify-between text-[12px]">
                                <span className="text-gray-500">Metode</span>
                                <span className="font-semibold text-gray-700">{doneData.method}</span>
                            </div>
                            {doneData.method === 'Cash' && (
                                <>
                                    <div className="flex justify-between text-[12px]">
                                        <span className="text-gray-500">Uang Diterima</span>
                                        <span className="font-semibold text-gray-700">{formatRupiah(cashParsed)}</span>
                                    </div>
                                    <div className="flex justify-between text-[13px] pt-2 border-t border-gray-200">
                                        <span className="font-bold text-gray-700">Kembalian</span>
                                        <span className="font-bold text-green-600 text-[16px]">{formatRupiah(doneData.change)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleDone} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                                🖨️ Cetak Struk
                            </button>
                            <button onClick={onNewTransaction} className="flex-1 py-2.5 bg-[#685AFF] text-white rounded-xl text-[13px] font-bold hover:bg-[#4A3FCC] transition-colors">
                                Transaksi Baru
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
