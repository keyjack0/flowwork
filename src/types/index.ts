// =============================================
// FLOWWORK - TypeScript Types
// =============================================

export type Role = 'Owner' | 'Manager' | 'Kasir'

export interface Profile {
  id: string
  full_name: string | null
  role_id: number
  role?: { role_name: Role }
  updated_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  description: string | null
  stock: number
  min_stock_alert: number
  base_price_modal: number
  selling_price: number
  category: string | null
  image_emoji: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CartItem extends Product {
  qty: number
}

export interface TransactionItem {
  id?: string
  transaction_id?: string
  product_id: string
  product_name: string
  quantity: number
  price_at_time: number
  hpp_at_time: number
  subtotal: number
}

export type PaymentMethod = 'cash' | 'qris' | 'midtrans'
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'expired'

export interface Transaction {
  id: string
  cashier_id: string | null
  total_amount: number
  total_hpp: number
  total_profit: number
  tax_amount: number
  discount_amount: number
  payment_method: string
  midtrans_order_id: string | null
  midtrans_transaction_id: string | null
  midtrans_payment_type: string | null
  midtrans_snap_token: string | null
  midtrans_redirect_url: string | null
  midtrans_raw_response: Record<string, unknown> | null
  status: TransactionStatus
  notes: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  transaction_items?: TransactionItem[]
}

export interface Expense {
  id: string
  category: string | null
  amount: number
  note: string | null
  expense_date: string
  created_by: string | null
  created_at: string
}

export interface StockLog {
  id: string
  product_id: string
  change_amount: number
  reason: string | null
  reference_id: string | null
  created_by: string | null
  created_at: string
  products?: Product
}

// Midtrans Types
export interface MidtransSnapResponse {
  transaction_id?: string
  order_id: string
  gross_amount: string
  payment_type: string
  transaction_status: string
  fraud_status?: string
  status_code: string
  status_message: string
  finish_redirect_url?: string
}

export interface MidtransCreateTransactionPayload {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}

// Dashboard Analytics
export interface DashboardMetrics {
  totalSales: number
  totalProfit: number
  totalTransactions: number
  totalProductsSold: number
  salesGrowth: number
  profitGrowth: number
  transactionGrowth: number
}

export interface DailySalesData {
  date: string
  label: string
  sales: number
  profit: number
  transactions: number
}

export interface TopProduct {
  product_id: string
  product_name: string
  category: string
  total_qty: number
  total_revenue: number
}

export interface ExpenseCategory {
  category: string
  total: number
  percentage: number
}
