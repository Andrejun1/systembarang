/*
  # Create Loan Items Table

  ## Overview
  Membuat tabel junction loan_items untuk mendukung multiple items per loan.

  ## New Table
    - `loan_items`
      - `id` (uuid, primary key) - ID unik untuk setiap item dalam loan
      - `loan_id` (uuid, foreign key) - Referensi ke loans table
      - `item_id` (uuid, foreign key) - Referensi ke items table
      - `quantity` (integer) - Jumlah item yang dipinjam
      - `foto_barang_url` (text, nullable) - URL foto spesifik untuk item ini
      - `created_at` (timestamptz) - Timestamp pembuatan

  ## Security
    - Enable RLS on `loan_items` table
    - Add policy for authenticated users (admin) to read all loan_items
    - Add policy for authenticated users (admin) to insert loan_items
    - Add policy for authenticated users (admin) to update loan_items
    - Add policy for authenticated users (admin) to delete loan_items

  ## Important Notes
    - Junction table untuk many-to-many relationship antara loans dan items
    - Quantity minimal 1
    - Foreign key constraints ke loans dan items
*/

-- Create loan_items table
CREATE TABLE IF NOT EXISTS loan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  foto_barang_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE loan_items ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated admin users
CREATE POLICY "Admin can view all loan_items"
  ON loan_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert loan_items"
  ON loan_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update loan_items"
  ON loan_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete loan_items"
  ON loan_items FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loan_items_loan_id ON loan_items(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_items_item_id ON loan_items(item_id);

-- Create unique constraint to prevent duplicate items in same loan
CREATE UNIQUE INDEX IF NOT EXISTS idx_loan_items_unique ON loan_items(loan_id, item_id);