// =============================================
// FLOWWORK - HPP Module Types
// =============================================

// Database types (from Supabase)
export interface RawMaterial {
  id: string
  name: string
  category: string | null
  buy_price: number
  buy_unit: string
  conversion_rate: number
  yield_pct: number
  price_per_use: number | null
  supplier: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// Legacy client-side type (for localStorage compatibility)
export interface RawMaterialLegacy {
  id: string
  name: string
  category: string
  buyUnit: string        // satuan beli (kg, liter, pack)
  useUnit: string        // satuan pakai (gram, ml, pcs)
  buyPrice: number       // harga beli per satuan beli
  conversionRate: number // 1 satuan beli = N satuan pakai (mis: 1 kg = 1000 gram)
  yieldPct: number       // % utilisasi setelah penyusutan (mis: 80 = 80%)
  pricePerUse: number    // otomatis: buyPrice / conversionRate / (yieldPct/100)
  createdAt: string
}

// Database types
export interface RecipeIngredientDB {
  id: string
  recipe_id: string
  material_id: string
  quantity: number
  unit: string
  calculated_cost: number
  notes: string | null
  created_at: string
  material?: RawMaterial
}

export interface RecipeDB {
  id: string
  name: string
  description: string | null
  total_hpp: number
  selling_price: number | null
  recommended_price: number | null
  margin_pct: number | null
  profit_per_portion: number | null
  opex_per_portion: number | null
  net_profit_per_portion: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  ingredients?: RecipeIngredientDB[]
}

// Legacy client-side types
export interface RecipeIngredient {
  materialId: string
  materialName: string
  useUnit: string
  qty: number            // jumlah pakai per porsi
  costPerPortion: number // otomatis: qty * pricePerUse
}

export interface Recipe {
  id: string
  name: string
  category: string
  portionCount: number   // jumlah porsi dari 1x produksi
  ingredients: RecipeIngredient[]
  addons: Addon[]
  totalIngredientCost: number
  totalAddonCost: number
  totalHPP: number       // ingredient + addon + opex per porsi
  createdAt: string
  notes?: string
}

export interface Addon {
  id: string
  name: string           // kardus, plastik, stiker, sendok
  costPerPortion: number
}

// Database types
export interface OpexConfigDB {
  id: string
  name: string
  category: string
  monthly_amount: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OpexSettingsDB {
  id: string
  target_portions_per_month: number
  total_monthly_opex: number
  opex_per_portion: number
  updated_at: string
}

// Legacy client-side types
export interface OpexItem {
  id: string
  name: string
  category: 'fixed' | 'variable'
  monthlyAmount: number
}

export interface OpexConfig {
  items: OpexItem[]
  targetPortionsPerMonth: number
  opexPerPortion: number // auto-calculated
  totalMonthlyOpex: number
}

export interface ProfitSimulation {
  sellPrice: number
  hpp: number            // total hpp per porsi (ingredient + addon + opex)
  grossProfit: number    // sellPrice - (ingredient + addon)
  netProfit: number      // sellPrice - hpp total
  grossMarginPct: number
  netMarginPct: number
  bepPortions: number    // Break Even Point in portions
  bepRevenue: number
}

// Customer & Supplier types
export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  total_orders: number
  total_spent: number
  last_order_date: string | null
  created_at: string
  customer_tier?: 'VIP' | 'Regular' | 'New'
}

export interface Supplier {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  product_category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
