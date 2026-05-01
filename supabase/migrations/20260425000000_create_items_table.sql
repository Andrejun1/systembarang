/*
  # Create Items (Barang) Management Table

  ## Overview
  Membuat tabel untuk mengelola katalog barang laboratorium dengan stok realtime.

  ## Tables
    - `items`
      - `id` (uuid, primary key) - ID unik untuk setiap barang
      - `kode_barang` (text, unique) - Kode barang unik (contoh: LAB-2026-0001)
      - `nama_barang` (text) - Nama barang
      - `deskripsi` (text) - Deskripsi barang
      - `kategori` (text) - Kategori barang
      - `stok_total` (integer) - Total stok barang
      - `stok_tersedia` (integer) - Stok yang masih tersedia
      - `foto_url` (text, nullable) - URL foto barang
      - `barcode` (text, unique, nullable) - Kode barcode barang
      - `qr_code` (text, nullable) - QR code data
      - `created_at` (timestamptz) - Timestamp pembuatan
      - `updated_at` (timestamptz) - Timestamp update terakhir

  ## Security
    - Enable RLS on `items` table
    - Add policy for authenticated users (admin) to read all items
    - Add policy for authenticated users (admin) to insert items
    - Add policy for authenticated users (admin) to update items
    - Add policy for authenticated users (admin) to delete items

  ## Important Notes
    - stok_tersedia tidak boleh lebih dari stok_total
    - Stok tersedia akan otomatis berkurang saat peminjaman dan bertambah saat pengembalian
    - Barang dengan stok_tersedia = 0 akan ditandai "Tidak Tersedia"
*/

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_barang text UNIQUE NOT NULL,
  nama_barang text NOT NULL,
  deskripsi text,
  kategori text,
  stok_total integer NOT NULL DEFAULT 1,
  stok_tersedia integer NOT NULL DEFAULT 1,
  foto_url text,
  barcode text UNIQUE,
  qr_code text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add constraint: stok_tersedia tidak boleh negatif atau melebihi stok_total
ALTER TABLE items ADD CONSTRAINT stok_valid CHECK (stok_tersedia >= 0 AND stok_tersedia <= stok_total);

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated admin users
CREATE POLICY "Admin can view all items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update items"
  ON items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete items"
  ON items FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_items_kode_barang ON items(kode_barang);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
CREATE INDEX IF NOT EXISTS idx_items_stok_tersedia ON items(stok_tersedia);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_items_updated_at();
