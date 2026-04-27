// =============================================
// FLOWWORK - Midtrans Integration
// Docs: https://docs.midtrans.com
// =============================================

const midtransClient = require('midtrans-client')

// Snap API - untuk Payment Gateway dengan UI popup
export function createSnapClient() {
  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  })
}

// Core API - untuk direct charge (QRIS, Bank Transfer, dll)
export function createCoreApiClient() {
  return new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  })
}

export interface SnapTransactionParams {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  paymentType?: 'all' | 'qris' | 'bank_transfer' | 'gopay' | 'shopeepay'
}

/**
 * Membuat Snap Token untuk pembayaran via Midtrans Snap
 * Token ini dipakai di frontend untuk memunculkan popup pembayaran
 */
export async function createSnapTransaction(params: SnapTransactionParams) {
  const snap = createSnapClient()

  // Tentukan enabled payments berdasarkan tipe
  const enabledPayments = params.paymentType === 'qris'
    ? ['gopay', 'qris', 'shopeepay', 'dana', 'ovo', 'linkaja']
    : params.paymentType === 'bank_transfer'
    ? ['bca_va', 'bni_va', 'bri_va', 'mandiri_bill', 'permata_va']
    : undefined // undefined = semua metode aktif

  const transactionDetails = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.amount),
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || '08000000000',
    },
    item_details: params.items.map(item => ({
      id: item.id.substring(0, 50), // max 50 chars
      name: item.name.substring(0, 50),
      price: Math.round(item.price),
      quantity: item.quantity,
    })),
    ...(enabledPayments && {
      enabled_payments: enabledPayments,
    }),
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL}/kasir/payment-result`,
      error: `${process.env.NEXT_PUBLIC_APP_URL}/kasir/payment-result`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/kasir/payment-result`,
    },
    expiry: {
      unit: 'minutes',
      duration: 30, // Expired dalam 30 menit
    },
  }

  const transaction = await snap.createTransaction(transactionDetails)
  return transaction as { token: string; redirect_url: string }
}

/**
 * Membuat transaksi QRIS langsung (tanpa popup Snap)
 * Menghasilkan QR Code yang bisa langsung ditampilkan
 */
export async function createQrisTransaction(params: SnapTransactionParams) {
  const core = createCoreApiClient()

  const chargeParams = {
    payment_type: 'qris',
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.amount),
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
    },
    item_details: params.items.map(item => ({
      id: item.id.substring(0, 50),
      name: item.name.substring(0, 50),
      price: Math.round(item.price),
      quantity: item.quantity,
    })),
    qris: {
      acquirer: 'gopay',
    },
  }

  const response = await core.charge(chargeParams)
  return response
}

/**
 * Verifikasi notifikasi webhook dari Midtrans
 * WAJIB diverifikasi untuk keamanan
 */
export async function verifyMidtransNotification(notification: Record<string, unknown>) {
  const core = createCoreApiClient()
  const statusResponse = await core.transaction.notification(notification)
  return statusResponse
}

/**
 * Cek status transaksi via Midtrans Order ID
 */
export async function checkTransactionStatus(orderId: string) {
  const core = createCoreApiClient()
  const statusResponse = await core.transaction.status(orderId)
  return statusResponse
}

/**
 * Validasi signature key dari Midtrans webhook
 */
export function validateMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  signatureKey: string
): boolean {
  const crypto = require('crypto')
  const hash = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex')
  return hash === signatureKey
}

/**
 * Map status Midtrans ke status internal Flowwork
 */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): 'pending' | 'success' | 'failed' | 'expired' {
  if (transactionStatus === 'capture') {
    return fraudStatus === 'accept' ? 'success' : 'failed'
  }
  if (transactionStatus === 'settlement') return 'success'
  if (['cancel', 'deny', 'failure'].includes(transactionStatus)) return 'failed'
  if (transactionStatus === 'expire') return 'expired'
  return 'pending'
}
