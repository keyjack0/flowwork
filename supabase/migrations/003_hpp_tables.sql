-- =============================================
-- FLOWWORK - HPP & Business Tables
-- Menambahkan tabel untuk module HPP Calculator
-- =============================================

-- 1. Tabel Raw Materials (Bahan Baku)
CREATE TABLE IF NOT EXISTS raw_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  buy_price DECIMAL(12, 2) NOT NULL,
  buy_unit TEXT NOT NULL DEFAULT 'gram',
  conversion_rate DECIMAL(10, 4) DEFAULT 1,
  yield_pct DECIMAL(5, 2) DEFAULT 100,
  price_per_use DECIMAL(12, 2),
  supplier TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Recipes (Resep)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  total_hpp DECIMAL(12, 2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12, 2),
  recommended_price DECIMAL(12, 2),
  margin_pct DECIMAL(5, 2),
  profit_per_portion DECIMAL(12, 2),
  opex_per_portion DECIMAL(12, 2) DEFAULT 0,
  net_profit_per_portion DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Recipe Ingredients (Bahan dalam Resep)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  material_id UUID REFERENCES raw_materials(id),
  quantity DECIMAL(10, 4) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'gram',
  calculated_cost DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel OPEX Config (Biaya Operasional Bulanan)
CREATE TABLE IF NOT EXISTS opex_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'fixed' atau 'variable'
  monthly_amount DECIMAL(12, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel OPEX Settings (Target Portion)
CREATE TABLE IF NOT EXISTS opex_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_portions_per_month INTEGER DEFAULT 300,
  total_monthly_opex DECIMAL(12, 2) DEFAULT 0,
  opex_per_portion DECIMAL(12, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default OPEX settings
INSERT INTO opex_settings (target_portions_per_month, total_monthly_opex, opex_per_portion)
VALUES (300, 0, 0)
ON CONFLICT DO NOTHING;

-- =============================================
-- Customers & Suppliers Tables
-- =============================================

-- 6. Tabel Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabel Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  product_category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE opex_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE opex_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk Raw Materials
CREATE POLICY "Authenticated users can view raw materials" ON raw_materials
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can insert raw materials" ON raw_materials
  FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update raw materials" ON raw_materials
  FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can delete raw materials" ON raw_materials
  FOR DELETE TO authenticated USING (TRUE);

-- RLS Policies untuk Recipes
CREATE POLICY "Authenticated users can view recipes" ON recipes
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can insert recipes" ON recipes
  FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update recipes" ON recipes
  FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can delete recipes" ON recipes
  FOR DELETE TO authenticated USING (TRUE);

-- RLS Policies untuk Recipe Ingredients
CREATE POLICY "Authenticated users can view recipe ingredients" ON recipe_ingredients
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can insert recipe ingredients" ON recipe_ingredients
  FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Authenticated users can update recipe ingredients" ON recipe_ingredients
  FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can delete recipe ingredients" ON recipe_ingredients
  FOR DELETE TO authenticated USING (TRUE);

-- RLS Policies untuk OPEX Configs
CREATE POLICY "Authenticated users can view opex configs" ON opex_configs
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can manage opex configs" ON opex_configs
  FOR ALL TO authenticated USING (TRUE);

-- RLS Policies untuk OPEX Settings
CREATE POLICY "Authenticated users can view opex settings" ON opex_settings
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can update opex settings" ON opex_settings
  FOR UPDATE TO authenticated USING (TRUE);

-- RLS Policies untuk Customers
CREATE POLICY "Authenticated users can view customers" ON customers
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can manage customers" ON customers
  FOR ALL TO authenticated USING (TRUE);

-- RLS Policies untuk Suppliers
CREATE POLICY "Authenticated users can view suppliers" ON suppliers
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can manage suppliers" ON suppliers
  FOR ALL TO authenticated USING (TRUE);

-- =============================================
-- Indexes untuk Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON raw_materials(category);
CREATE INDEX IF NOT EXISTS idx_raw_materials_active ON raw_materials(is_active);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes(is_active);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_material_id ON recipe_ingredients(material_id);
CREATE INDEX IF NOT EXISTS idx_opex_configs_category ON opex_configs(category);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- =============================================
-- Views untuk Reporting
-- =============================================

-- View: Recipe Cost Breakdown
CREATE OR REPLACE VIEW recipe_cost_breakdown AS
SELECT
  r.id AS recipe_id,
  r.name AS recipe_name,
  ri.id AS ingredient_id,
  rm.name AS material_name,
  rm.category AS material_category,
  ri.quantity,
  ri.unit,
  ri.calculated_cost,
  (ri.calculated_cost / NULLIF(r.total_hpp, 0) * 100) AS cost_percentage
FROM recipes r
LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
LEFT JOIN raw_materials rm ON rm.id = ri.material_id
WHERE r.is_active = TRUE
ORDER BY r.name, ri.calculated_cost DESC;

-- View: Low Stock Materials
CREATE OR REPLACE VIEW low_stock_materials AS
SELECT
  rm.id,
  rm.name,
  rm.category,
  rm.supplier,
  COUNT(DISTINCT ri.recipe_id) AS used_in_recipes
FROM raw_materials rm
LEFT JOIN recipe_ingredients ri ON ri.material_id = rm.id
WHERE rm.is_active = TRUE
GROUP BY rm.id, rm.name, rm.category, rm.supplier
ORDER BY used_in_recipes DESC;

-- View: Customer Summary
CREATE OR REPLACE VIEW customer_summary AS
SELECT
  c.id,
  c.name,
  c.email,
  c.phone,
  c.total_orders,
  c.total_spent,
  c.last_order_date,
  CASE
    WHEN c.total_spent >= 1000000 THEN 'VIP'
    WHEN c.total_spent >= 500000 THEN 'Regular'
    ELSE 'New'
  END AS customer_tier
FROM customers c
ORDER BY c.total_spent DESC;

-- =============================================
-- Seed Data - Contoh Data
-- =============================================

-- Contoh Raw Materials
INSERT INTO raw_materials (name, category, buy_price, buy_unit, conversion_rate, yield_pct, price_per_use, supplier) VALUES
  ('Daging Ayam', 'Protein', 45000, 'kg', 1000, 70, 64, 'Supplier A'),
  ('Daging Sapi', 'Protein', 120000, 'kg', 1000, 65, 185, 'Supplier B'),
  ('Beras', 'Karbohidrat', 12000, 'kg', 1000, 95, 13, 'Supplier C'),
  ('Minyak Goreng', 'Lemak', 25000, 'liter', 1000, 100, 25, 'Supplier D'),
  ('Bumbu Rempah', 'Bumbu', 35000, 'pack', 100, 100, 350, 'Supplier E'),
  ('Sayuran', 'Sayur', 8000, 'kg', 1000, 85, 9, 'Supplier F'),
  ('Telur', 'Protein', 28000, 'kg', 1000, 90, 31, 'Supplier G'),
  ('Tepung Terigu', 'Karbohidrat', 10000, 'kg', 1000, 100, 10, 'Supplier H')
ON CONFLICT DO NOTHING;

-- Contoh OPEX Configs
INSERT INTO opex_configs (name, category, monthly_amount) VALUES
  ('Sewa Tempat', 'fixed', 2000000),
  ('Gaji Karyawan', 'fixed', 3000000),
  ('Listrik & Air', 'fixed', 500000),
  ('Internet & WiFi', 'fixed', 300000),
  ('Biaya Kebersihan', 'fixed', 200000),
  ('Marketing & Promosi', 'variable', 500000),
  ('Packaging & Kantong', 'variable', 300000),
  ('Biaya Tak Terduga', 'variable', 200000)
ON CONFLICT DO NOTHING;

-- =============================================
-- Trigger untuk auto-update updated_at
-- =============================================

-- Function untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers untuk setiap tabel yang punya updated_at
DROP TRIGGER IF EXISTS update_raw_materials_updated_at ON raw_materials;
CREATE TRIGGER update_raw_materials_updated_at
  BEFORE UPDATE ON raw_materials
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_opex_configs_updated_at ON opex_configs;
CREATE TRIGGER update_opex_configs_updated_at
  BEFORE UPDATE ON opex_configs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
