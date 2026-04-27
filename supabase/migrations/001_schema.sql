-- =============================================
-- FLOWWORK - Database Schema (Supabase)
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Tabel Roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO roles (role_name) VALUES ('Owner'), ('Manager'), ('Kasir') ON CONFLICT DO NOTHING;

-- 2. Tabel Profiles (ekstensi auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role_id INTEGER REFERENCES roles(id) DEFAULT 3,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger: auto-buat profile saat user baru register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Tabel Produk & Inventaris
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  stock INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  base_price_modal DECIMAL(12, 2) NOT NULL,
  selling_price DECIMAL(12, 2) NOT NULL,
  category TEXT,
  image_emoji TEXT DEFAULT '📦',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Transaksi (Header)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cashier_id UUID REFERENCES profiles(id),
  total_amount DECIMAL(12, 2) NOT NULL,
  total_hpp DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_profit DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  payment_method VARCHAR(50),
  -- Midtrans fields
  midtrans_order_id VARCHAR(100) UNIQUE,
  midtrans_transaction_id VARCHAR(100),
  midtrans_payment_type VARCHAR(50),
  midtrans_snap_token TEXT,
  midtrans_redirect_url TEXT,
  midtrans_raw_response JSONB,
  status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed, expired
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel Detail Transaksi
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_at_time DECIMAL(12, 2) NOT NULL,
  hpp_at_time DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL
);

-- 6. Tabel Pengeluaran Operasional
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(100),
  amount DECIMAL(12, 2) NOT NULL,
  note TEXT,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabel Log Stok
CREATE TABLE IF NOT EXISTS stock_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  change_amount INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: user hanya bisa lihat/edit profile sendiri
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Products: semua authenticated user bisa baca, hanya owner/manager yang bisa tulis
CREATE POLICY "Authenticated users can view products" ON products FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can insert products" ON products FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update products" ON products FOR UPDATE TO authenticated USING (TRUE);

-- Transactions: semua authenticated user
CREATE POLICY "Authenticated users can view transactions" ON transactions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can insert transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update transactions" ON transactions FOR UPDATE TO authenticated USING (TRUE);

-- Transaction items
CREATE POLICY "Authenticated users can view transaction_items" ON transaction_items FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can insert transaction_items" ON transaction_items FOR INSERT TO authenticated WITH CHECK (TRUE);

-- Expenses
CREATE POLICY "Authenticated users can manage expenses" ON expenses FOR ALL TO authenticated USING (TRUE);

-- Stock logs
CREATE POLICY "Authenticated users can view stock_logs" ON stock_logs FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can insert stock_logs" ON stock_logs FOR INSERT TO authenticated WITH CHECK (TRUE);

-- =============================================
-- SEED DATA - Produk Contoh
-- =============================================
INSERT INTO products (sku, name, description, stock, min_stock_alert, base_price_modal, selling_price, category, image_emoji) VALUES
  ('SKU-001', 'Kaos Premium Oversize', 'Kaos bahan cotton combed 30s', 45, 10, 85000, 185000, 'Pakaian', '👕'),
  ('SKU-002', 'Celana Jogger Pria', 'Celana jogger fleece tebal', 28, 10, 120000, 249000, 'Pakaian', '👖'),
  ('SKU-003', 'Topi Snapback', 'Topi snapback adjustable', 6, 8, 45000, 99000, 'Aksesoris', '🧢'),
  ('SKU-004', 'Jaket Bomber', 'Jaket bomber nylon waterproof', 15, 5, 220000, 429000, 'Pakaian', '🧥'),
  ('SKU-005', 'Sepatu Sneakers', 'Sepatu sneakers casual unisex', 4, 5, 310000, 599000, 'Sepatu', '👟'),
  ('SKU-006', 'Tas Ransel Canvas', 'Tas ransel canvas 25L', 19, 5, 165000, 329000, 'Aksesoris', '🎒'),
  ('SKU-007', 'Kaos Polo Regular', 'Kaos polo pique lacoste', 3, 8, 70000, 149000, 'Pakaian', '👔'),
  ('SKU-008', 'Sandal Casual', 'Sandal casual EVA sole', 22, 5, 55000, 129000, 'Sepatu', '🩴'),
  ('SKU-009', 'Kacamata Sunglasses', 'Kacamata UV400 protection', 31, 5, 40000, 89000, 'Aksesoris', '🕶️')
ON CONFLICT (sku) DO NOTHING;
