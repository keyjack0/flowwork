-- =============================================
-- RPC Functions untuk Flowwork
-- Jalankan di Supabase SQL Editor
-- =============================================

-- Fungsi untuk mengurangi stok secara atomic
-- Menghindari race condition saat banyak transaksi bersamaan
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_qty INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = stock - p_qty,
      updated_at = NOW()
  WHERE id = p_product_id AND stock >= p_qty;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stok tidak mencukupi untuk produk %', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk menambah stok (restock)
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_qty INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = stock + p_qty,
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View untuk laporan penjualan harian
CREATE OR REPLACE VIEW daily_sales_report AS
SELECT
  DATE(created_at) as sale_date,
  COUNT(*) as total_transactions,
  SUM(total_amount) as total_sales,
  SUM(total_profit) as total_profit,
  SUM(total_hpp) as total_hpp,
  AVG(total_amount) as avg_transaction_value
FROM transactions
WHERE status = 'success'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- View untuk laporan produk terlaris
CREATE OR REPLACE VIEW top_selling_products AS
SELECT
  p.id,
  p.name,
  p.sku,
  p.category,
  SUM(ti.quantity) as total_qty_sold,
  SUM(ti.subtotal) as total_revenue,
  SUM(ti.quantity * (ti.price_at_time - ti.hpp_at_time)) as total_profit
FROM transaction_items ti
JOIN products p ON p.id = ti.product_id
JOIN transactions t ON t.id = ti.transaction_id
WHERE t.status = 'success'
GROUP BY p.id, p.name, p.sku, p.category
ORDER BY total_qty_sold DESC;

-- View untuk produk yang stoknya hampir habis
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
  id, sku, name, category, stock, min_stock_alert,
  (stock - min_stock_alert) as stock_diff
FROM products
WHERE stock <= min_stock_alert AND is_active = true
ORDER BY stock_diff ASC;

-- Grant akses
GRANT EXECUTE ON FUNCTION decrement_stock TO authenticated;
GRANT EXECUTE ON FUNCTION increment_stock TO authenticated;
GRANT SELECT ON daily_sales_report TO authenticated;
GRANT SELECT ON top_selling_products TO authenticated;
GRANT SELECT ON low_stock_products TO authenticated;
