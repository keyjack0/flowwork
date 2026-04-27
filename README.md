# 🚀 Flowwork — Aplikasi Manajemen Bisnis

Aplikasi manajemen bisnis terintegrasi dengan fitur POS, stok, laporan keuangan, dan **pembayaran Midtrans**.

## ✨ Fitur Utama

| Modul | Fitur |
|-------|-------|
| **Dashboard** | Analytics real-time, chart penjualan, top products, retention rate |
| **Kasir (POS)** | Terminal transaksi, multi-metode pembayaran, QRIS, Midtrans Snap |
| **Pembayaran** | Cash, QRIS langsung, Midtrans Snap (semua metode), webhook notification |
| **Stok** | Real-time sync, low stock alert, stock opname |
| **Kalkulator HPP** | Kalkulasi HPP otomatis, profit margin simulator |
| **Keuangan** | P&L statement, laporan harian/bulanan, cash flow |
| **Pengeluaran** | Pencatatan pengeluaran per kategori |

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Font Poppins
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Pembayaran**: Midtrans (Snap + Core API)
- **Hosting**: Vercel
- **Charts**: Recharts

---

## 🚦 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd flowwork
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.local.example .env.local
```

Isi file `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Midtrans (Sandbox untuk testing)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Setup Database Supabase

Buka **Supabase Dashboard → SQL Editor**, jalankan berturut-turut:

```
1. supabase/migrations/001_schema.sql   ← Schema & seed data
2. supabase/migrations/002_functions.sql ← RPC functions & views
```

### 4. Jalankan Dev Server

```bash
npm run dev
```

Buka `http://localhost:3000`

---

## 💳 Setup Midtrans

### Mendapatkan API Keys

1. Daftar di [https://dashboard.midtrans.com](https://dashboard.midtrans.com)
2. Pilih environment: **Sandbox** (testing) atau **Production** (live)
3. Masuk ke **Settings → Access Keys**
4. Copy **Server Key** dan **Client Key**

### Setup Webhook Notification

1. Di Midtrans Dashboard → **Settings → Configuration**
2. Isi **Payment Notification URL**:
   ```
   https://yourdomain.com/api/midtrans/notification
   ```
3. Isi **Finish Redirect URL**:
   ```
   https://yourdomain.com/kasir/payment-result
   ```

> ⚠️ Untuk development lokal, gunakan **ngrok** atau **localtunnel** agar Midtrans bisa mengirim webhook:
> ```bash
> npx localtunnel --port 3000
> ```

### Metode Pembayaran yang Didukung

| Metode | Cara |
|--------|------|
| **Cash** | Langsung sukses, stok langsung berkurang |
| **QRIS** | QR Code ditampilkan di kasir, polling status otomatis |
| **Midtrans Snap** | Popup semua metode (GoPay, OVO, BCA, BRI, dll) |

---

## 📁 Struktur Folder

```
flowwork/
├── src/
│   ├── app/
│   │   ├── (app)/              # Layout dengan sidebar (protected)
│   │   │   ├── dashboard/      # Halaman dashboard
│   │   │   ├── kasir/          # POS + Midtrans
│   │   │   │   └── payment-result/  # Redirect dari Midtrans
│   │   │   ├── stok/           # Manajemen stok
│   │   │   ├── hpp/            # Kalkulator HPP
│   │   │   ├── keuangan/       # Laporan keuangan
│   │   │   └── pengeluaran/    # Pencatatan biaya
│   │   ├── api/
│   │   │   ├── midtrans/
│   │   │   │   ├── create/     # POST: buat transaksi Midtrans
│   │   │   │   ├── notification/ # POST: webhook dari Midtrans
│   │   │   │   └── status/     # GET: cek status transaksi
│   │   │   └── transactions/
│   │   │       └── cash/       # POST: transaksi cash
│   │   └── login/
│   ├── components/
│   │   └── layout/             # Sidebar, Topbar
│   ├── lib/
│   │   ├── midtrans.ts         # Midtrans integration
│   │   ├── supabase/           # Supabase clients
│   │   └── utils.ts            # Helper functions
│   ├── types/                  # TypeScript types
│   └── middleware.ts           # Auth middleware
├── supabase/
│   └── migrations/             # SQL schema & functions
└── public/
    └── manifest.json           # PWA manifest
```

---

## 🔐 Role & Akses

| Role | Akses |
|------|-------|
| **Owner** | Semua fitur termasuk profit bersih |
| **Manager** | Stok, laporan harian, kasir (tanpa profit tahunan) |
| **Kasir** | Hanya modul POS dan cek stok |

---

## 🚀 Deploy ke Vercel

```bash
npm run build   # Test build dulu
vercel deploy
```

**Environment Variables** yang wajib diset di Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION` (set ke `true` untuk production)
- `NEXT_PUBLIC_APP_URL` (domain produksi)

---

## 🧪 Testing Midtrans Sandbox

Gunakan kartu/nomor berikut untuk simulasi di sandbox:

**Kartu Kredit (sukses):**
- Nomor: `4811 1111 1111 1114`
- CVV: `123`, Expired: `01/25`

**GoPay/QRIS:** Gunakan app simulator di Midtrans dashboard

**Nomor VA BCA:** Akan digenerate otomatis saat checkout

---

## 📝 Lisensi

MIT License — Flowwork &copy; 2024
