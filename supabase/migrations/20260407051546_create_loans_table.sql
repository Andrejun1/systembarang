/*
  # Create Loans Management System

  ## Overview
  Membuat sistem database untuk Unimus Inventrack (UIT) - sistem manajemen peminjaman barang laboratorium.

  ## 1. New Tables
    - `loans`
      - `id` (uuid, primary key) - ID unik untuk setiap peminjaman
      - `kode_unik` (text, unique) - Kode unik peminjaman (contoh: UIT-2026-0001)
      - `nama` (text) - Nama peminjam
      - `tanggal_lahir` (date) - Tanggal lahir peminjam
      - `prodi` (text) - Program studi peminjam
      - `jurusan` (text) - Jurusan peminjam
      - `semester` (integer) - Semester peminjam
      - `nama_barang` (text) - Nama barang yang dipinjam
      - `foto_peminjam_url` (text) - URL foto peminjam dari Supabase Storage
      - `foto_barang_url` (text) - URL foto barang dari Supabase Storage
      - `tanggal_pinjam` (timestamptz) - Tanggal dan waktu peminjaman (auto set)
      - `tanggal_kembali` (timestamptz, nullable) - Tanggal dan waktu pengembalian
      - `status` (text) - Status peminjaman (dipinjam/kembali)
      - `created_at` (timestamptz) - Timestamp pembuatan record
      - `updated_at` (timestamptz) - Timestamp update terakhir

  ## 2. Security
    - Enable RLS on `loans` table
    - Add policy for authenticated users (admin) to read all loans
    - Add policy for authenticated users (admin) to insert loans
    - Add policy for authenticated users (admin) to update loans
    - Add policy for authenticated users (admin) to delete loans

  ## 3. Important Notes
    - Menggunakan UUID sebagai primary key untuk keamanan
    - Kode unik digunakan untuk tracking dan QR code
    - Status default adalah 'dipinjam'
    - Timestamp otomatis untuk tracking
*/

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_unik text UNIQUE NOT NULL,
  nama text NOT NULL,
  tanggal_lahir date NOT NULL,
  prodi text NOT NULL,
  jurusan text NOT NULL,
  semester integer NOT NULL,
  nama_barang text NOT NULL,
  foto_peminjam_url text,
  foto_barang_url text,
  tanggal_pinjam timestamptz DEFAULT now() NOT NULL,
  tanggal_kembali timestamptz,
  status text DEFAULT 'dipinjam' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated admin users
CREATE POLICY "Admin can view all loans"
  ON loans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete loans"
  ON loans FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_loans_kode_unik ON loans(kode_unik);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_tanggal_pinjam ON loans(tanggal_pinjam DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();