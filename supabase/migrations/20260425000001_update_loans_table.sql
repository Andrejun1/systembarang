/*
  # Update Loans Table

  ## Changes
  Menambahkan field nomor_whatsapp, deadline, dan item_id untuk integrasi katalog barang.

  ## New Columns
    - `nomor_whatsapp` (text) - Nomor WhatsApp peminjam
    - `deadline` (timestamptz) - Deadline pengembalian barang
    - `item_id` (uuid, foreign key) - Referensi ke tabel items

  ## Important Notes
    - nomor_whatsapp dan deadline wajib diisi
    - item_id optional (untuk backward compatibility)
*/

-- Add new columns to loans table
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS nomor_whatsapp text,
ADD COLUMN IF NOT EXISTS deadline timestamptz,
ADD COLUMN IF NOT EXISTS item_id uuid REFERENCES items(id) ON DELETE SET NULL;

-- Add constraint: nomor_whatsapp dan deadline wajib diisi
ALTER TABLE loans 
ADD CONSTRAINT nomor_whatsapp_required CHECK (nomor_whatsapp IS NOT NULL AND nomor_whatsapp != ''),
ADD CONSTRAINT deadline_required CHECK (deadline IS NOT NULL);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_loans_item_id ON loans(item_id);
CREATE INDEX IF NOT EXISTS idx_loans_deadline ON loans(deadline);

-- Create index for late returns (deadline < now)
CREATE INDEX IF NOT EXISTS idx_loans_overdue ON loans(deadline) WHERE status = 'dipinjam' AND deadline < now();
