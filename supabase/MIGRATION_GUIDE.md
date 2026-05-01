# 📦 Panduan Migrasi ke Database Supabase

## ⚡ Quick Start

### 1. Jalankan Migration SQL
```sql
-- Buka Supabase SQL Editor
-- Copy paste seluruh isi file: migrations/003_hpp_tables.sql
```

### 2. Verifikasi
```sql
-- Cek tabel baru
SELECT COUNT(*) FROM raw_materials;
SELECT COUNT(*) FROM recipes;
SELECT COUNT(*) FROM opex_configs;
```

### 3. Update Komponen HPP

Komponen HPP sekarang bisa langsung menggunakan data dari database:

```typescript
// BEFORE (localStorage only)
import { useHPPStore } from '@/hooks/useHPPStore'

function HPPPage() {
  const store = useHPPStore() // data dari localStorage
  // ...
}
```

```typescript
// AFTER (Supabase database)
import { useHPPDatabase } from '@/hooks/useHPPDatabase'
import { useRecipeDatabase } from '@/hooks/useRecipeDatabase'

function HPPPage() {
  const materials = useHPPDatabase()
  const recipes = useRecipeDatabase()
  // data otomatis dari Supabase + fallback localStorage jika offline
  // ...
}
```

---

## 📋 Checklist Migrasi

### Tahap 1: Database Setup ✅
- [x] Jalankan `003_hpp_tables.sql` di Supabase
- [ ] Verifikasi semua tabel terbuat
- [ ] Cek seed data masuk (8 raw materials, 8 opex configs)

### Tahap 2: API Routes Testing
- [ ] `GET /api/raw-materials` - return list bahan baku
- [ ] `POST /api/raw-materials` - tambah bahan baru
- [ ] `GET /api/recipes` - return list resep
- [ ] `POST /api/recipes` - buat resep baru

### Tahap 3: Frontend Integration
- [ ] Update `MaterialModule` untuk gunakan `useHPPDatabase`
- [ ] Update `RecipeBuilder` untuk gunakan `useRecipeDatabase`
- [ ] Update `OpexModule` untuk gunakan `useOpex`
- [ ] Test CRUD operations

### Tahap 4: Data Migration (Optional)
Jika ada data existing di localStorage yang ingin dimigrasi:

```typescript
// Di browser console, jalankan ini untuk export localStorage
const materials = localStorage.getItem('flowwork_hpp_materials')
const recipes = localStorage.getItem('flowwork_hpp_recipes')
const opex = localStorage.getItem('flowwork_hpp_opex')

console.log(JSON.stringify({ materials, recipes, opex }))
```

Kemudian buat script untuk import ke Supabase via API.

---

## 🔧 Troubleshooting

### Error: "relation does not exist"
```sql
-- Pastikan migration sudah dijalankan
-- Cek di Supabase SQL Editor
```

### Error: "permission denied"
```sql
-- Pastikan RLS policies sudah aktif
-- Cek di Supabase: Authentication > Policies
```

### Data tidak muncul di frontend
1. Cek network tab di DevTools
2. Pastikan API return data
3. Cek console untuk error

---

## 📊 Schema Overview

```
raw_materials          recipes               recipe_ingredients
├── id                 ├── id                ├── id
├── name               ├── name              ├── recipe_id → recipes.id
├── category           ├── description       ├── material_id → raw_materials.id
├── buy_price          ├── total_hpp         ├── quantity
├── buy_unit           ├── selling_price     ├── unit
├── conversion_rate    ├── margin_pct        ├── calculated_cost
├── yield_pct          └── is_active         └── notes
├── price_per_use
├── supplier
└── is_active

opex_configs           opex_settings         customers
├── id                 ├── id                ├── id
├── name               ├── target_portions   ├── name
├── category           ├── total_monthly     ├── email
├── monthly_amount     ├── opex_per_portion  ├── phone
└── is_active          └── updated_at        └── total_spent

suppliers
├── id
├── name
├── contact_person
├── phone
├── email
└── is_active
```

---

## 🎯 Next Steps

1. **Migrate HPP Module** - Ganti `useHPPStore` dengan `useHPPDatabase`
2. **Add Customer Tracking** - Integrasikan dengan transaksi
3. **Supplier Management** - Tambah UI untuk manage supplier
4. **Purchase Orders** - Fitur pembelian bahan baku dari supplier

---

## 📞 Support

Jika ada masalah:
1. Cek Supabase Logs di Dashboard
2. Cek console browser untuk error
3. Verify API response di Network tab
