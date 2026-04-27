import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Format angka ke Rupiah
 */
export function formatRupiah(amount: number, short = false): string {
  if (short) {
    if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`
    if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)} jt`
    if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)} rb`
    return `Rp ${amount.toLocaleString('id-ID')}`
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format tanggal ke bahasa Indonesia
 */
export function formatDate(date: string | Date, fmt = 'dd MMM yyyy, HH:mm'): string {
  return format(new Date(date), fmt, { locale: id })
}

export function formatDateRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id })
}

/**
 * Generate order ID untuk Midtrans
 * Format: FW-{timestamp}-{random4}
 */
export function generateOrderId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `FW-${timestamp}-${random}`
}

/**
 * Hitung margin profit
 */
export function calculateMargin(sellingPrice: number, modalPrice: number): number {
  if (sellingPrice === 0) return 0
  return Math.round(((sellingPrice - modalPrice) / sellingPrice) * 100)
}

/**
 * Hitung HPP total dari komponen biaya
 */
export function calculateHPP(params: {
  modalPrice: number
  packingCost?: number
  shippingSubsidy?: number
  adsCost?: number
}): number {
  return (
    params.modalPrice +
    (params.packingCost || 0) +
    (params.shippingSubsidy || 0) +
    (params.adsCost || 0)
  )
}

/**
 * Hitung harga jual ideal berdasarkan target margin
 */
export function calculateIdealSellPrice(hpp: number, targetMarginPct: number): number {
  if (targetMarginPct >= 100) return 0
  return Math.ceil(hpp / (1 - targetMarginPct / 100))
}

/**
 * Truncate teks
 */
export function truncate(str: string, n: number): string {
  return str.length > n ? str.substring(0, n - 3) + '...' : str
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Warna status transaksi
 */
export function getStatusColor(status: string) {
  switch (status) {
    case 'success': return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' }
    case 'pending': return { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' }
    case 'failed': return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' }
    case 'expired': return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' }
    default: return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' }
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'success': return 'Sukses'
    case 'pending': return 'Menunggu'
    case 'failed': return 'Gagal'
    case 'expired': return 'Expired'
    default: return status
  }
}
