-- LANGSUNG JALANKAN SQL INI DI SUPABASE SQL EDITOR
-- Untuk menambahkan akses public read ke tabel items dan loan_items

-- 1. Tambahkan policy untuk items - izinkan public membaca
CREATE POLICY "Public can view all items"
  ON items FOR SELECT
  TO anon
  USING (true);

-- 2. Tambahkan policy untuk loan_items - izinkan public membaca
CREATE POLICY "Public can view all loan_items"
  ON loan_items FOR SELECT
  TO anon
  USING (true);
