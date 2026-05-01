# Flowwork - Database Schema Documentation

## 📁 Struktur File

```
supabase/
├── migrations/
│   ├── 001_schema.sql          # Schema utama (products, transactions, expenses, dll)
│   ├── 002_functions.sql       # Database functions & views
│   └── 003_hpp_tables.sql      # HPP module tables (NEW)
└── README.md                   # Dokumentasi ini
```

## 📊 Tabel Database

### Core Tables (001_schema.sql)

| Tabel | Deskripsi |
|-------|-----------|
| `roles` | Role user (Owner, Manager, Kasir) |
| `profiles` | Profile user (extends auth.users) |
| `products` | Produk/inventaris |
| `transactions` | Header transaksi penjualan |
| `transaction_items` | Detail item dalam transaksi |
| `expenses` | Pengeluaran operasional |
| `stock_logs` | Log perubahan stok |

### HPP Module Tables (003_hpp_tables.sql)

| Tabel | Deskripsi |
|-------|-----------|
| `raw_materials` | Bahan baku untuk kalkulasi HPP |
| `recipes` | Resep produk jadi |
| `recipe_ingredients` | Komposisi bahan dalam resep |
| `opex_configs` | Konfigurasi biaya operasional bulanan |
| `opex_settings` | Setting target produksi per bulan |

### Business Tables (003_hpp_tables.sql)

| Tabel | Deskripsi |
|-------|-----------|
| `customers` | Data pelanggan untuk loyalty program |
| `suppliers` | Data supplier/pemasok |

## 🚀 Cara Install

### 1. Jalankan Migration di Supabase SQL Editor

```sql
-- Copy paste isi file berikut secara berurutan:
-- 1. migrations/001_schema.sql
-- 2. migrations/002_functions.sql
-- 3. migrations/003_hpp_tables.sql
```

### 2. Verifikasi Tabel

```sql
-- Cek semua tabel sudah ada
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## 📝 API Endpoints

Setelah migration dijalankan, endpoint berikut tersedia:

### Raw Materials (Bahan Baku)
```
GET    /api/raw-materials              # List semua bahan baku
POST   /api/raw-materials              # Tambah bahan baku baru
GET    /api/raw-materials/:id          # Detail bahan baku
PATCH  /api/raw-materials/:id          # Update bahan baku
DELETE /api/raw-materials/:id          # Soft delete (set is_active = false)
```

### Recipes (Resep)
```
GET    /api/recipes                    # List semua resep (dengan ingredients)
POST   /api/recipes                    # Buat resep baru dengan ingredients
GET    /api/recipes/:id                # Detail resep dengan ingredients
PATCH  /api/recipes/:id                # Update resep + ingredients
DELETE /api/recipes/:id                # Soft delete resep
```

### OPEX (Operational Expenses)
```
GET    /api/opex?type=configs          # List OPEX configs
GET    /api/opex?type=settings         # Get OPEX settings
POST   /api/opex                       # Create OPEX config / Update settings
PATCH  /api/opex/:id                   # Update OPEX config
DELETE /api/opex/:id                   # Soft delete OPEX config
```

### Customers
```
GET    /api/customers?tier=VIP         # List customers (filter by tier: VIP/Regular/New)
POST   /api/customers                  # Tambah customer baru
GET    /api/customers/:id              # Detail customer
PATCH  /api/customers/:id              # Update customer
DELETE /api/customers/:id              # Hapus customer
```

### Suppliers
```
GET    /api/suppliers?active=true      # List suppliers
POST   /api/suppliers                  # Tambah supplier baru
GET    /api/suppliers/:id              # Detail supplier
PATCH  /api/suppliers/:id              # Update supplier
DELETE /api/suppliers/:id              # Soft delete supplier
```

## 🔧 Database Functions (002_functions.sql)

### Stock Management
```sql
-- Kurangi stok (atomic, hindari race condition)
SELECT decrement_stock(product_id, qty);

-- Tambah stok (restock)
SELECT increment_stock(product_id, qty);
```

### Views
```sql
-- Laporan penjualan harian
SELECT * FROM daily_sales_report;

-- Produk terlaris
SELECT * FROM top_selling_products;

-- Produk stok menipis
SELECT * FROM low_stock_products;

-- Breakdown cost resep
SELECT * FROM recipe_cost_breakdown;

-- Summary customer
SELECT * FROM customer_summary;
```

## 📈 Tips

### 1. Backup Data
```sql
-- Export semua tabel
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### 2. Reset Seed Data
```sql
-- Hapus data contoh, sisakan schema
TRUNCATE raw_materials, recipes, recipe_ingredients, opex_configs, customers, suppliers CASCADE;
```

### 3. Update OPEX Settings
```sql
-- Update target portions
UPDATE opex_settings 
SET target_portions_per_month = 500 
WHERE id = 1;
```

## 🔐 Row Level Security (RLS)

Semua tabel memiliki RLS yang memungkinkan user authenticated untuk:
- `SELECT`: Melihat data
- `INSERT`: Menambah data
- `UPDATE`: Mengupdate data
- `DELETE`: Soft delete (set `is_active = false`)

## 📱 Integrasi dengan Frontend

### Contoh Fetch Raw Materials
```typescript
// src/hooks/useRawMaterials.ts
import { createClient } from '@/lib/supabase/client'

export async function getRawMaterials() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('raw_materials')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) throw error
  return data
}
```

### Contoh Create Recipe
```typescript
async function createRecipe(recipeData: {
  name: string
  ingredients: Array<{
    material_id: string
    quantity: number
    unit: string
    calculated_cost: number
  }>
}) {
  const res = await fetch('/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipeData)
  })
  return res.json()
}
```

## 📅 Changelog

### v0.3.0 (2026-05-01)
- ✅ Added `raw_materials` table untuk HPP module
- ✅ Added `recipes` dan `recipe_ingredients` tables
- ✅ Added `opex_configs` dan `opex_settings` tables
- ✅ Added `customers` table untuk loyalty tracking
- ✅ Added `suppliers` table untuk supplier management
- ✅ Added API routes untuk semua tabel baru
- ✅ Added database views untuk reporting

### v0.2.0 (2026-04-21)
- Database functions untuk stock management
- Views untuk reporting (daily sales, top products, low stock)

### v0.1.0 (2026-04-21)
- Initial schema: products, transactions, expenses, stock_logs
