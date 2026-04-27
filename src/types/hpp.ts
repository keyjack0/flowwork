// =============================================
// FLOWWORK - HPP Module Types
// =============================================

export interface RawMaterial {
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
