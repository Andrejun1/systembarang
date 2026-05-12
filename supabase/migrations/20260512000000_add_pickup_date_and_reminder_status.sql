/*
  # Add Pickup Date and Reminder Status Fields to Loans

  ## Purpose
  - Menambahkan field pickup_date untuk tanggal pengambilan barang oleh peminjam
  - Menambahkan kolom status reminder untuk sistem notifikasi dual-reminder (H-2 + hari deadline)
  - Memastikan sistem tanggal/waktu yang stabil dan profesional

  ## New Columns
    - `pickup_date` (date) - Tanggal pengambilan barang oleh peminjam
      * Nullable untuk backward compatibility
      * User memilih tanggal ini melalui input type="date"
    
    - `reminder_h2_sent_at` (timestamptz, NULL) - Timestamp pengiriman reminder H-2
      * Reminder dikirim 2 hari sebelum deadline
      * Diisi saat reminder berhasil dikirim (untuk mencegah duplikasi)
    
    - `reminder_deadline_sent_at` (timestamptz, NULL) - Timestamp pengiriman reminder hari deadline
      * Reminder dikirim pada hari deadline
      * Diisi saat reminder berhasil dikirim (untuk mencegah duplikasi)

  ## Key Features
    - Backward compatibility: pickup_date nullable untuk data lama
    - Performance: Composite index untuk query reminder yang efisien
    - Safety: Double-status check untuk mencegah duplicate email
    - Stability: Semua timestamp berbasis server timezone (timestamptz)

  ## Migration Notes
    - Safe to run multiple times (IF NOT EXISTS)
    - Tidak ada data lama yang terhapus
    - Index creation idempotent
*/

-- ============================================================================
-- ADD COLUMNS (Backward Compatible)
-- ============================================================================
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS pickup_date date,
  ADD COLUMN IF NOT EXISTS reminder_h2_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_deadline_sent_at timestamptz;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Single-column indexes
CREATE INDEX IF NOT EXISTS idx_loans_pickup_date ON loans(pickup_date);
CREATE INDEX IF NOT EXISTS idx_loans_reminder_h2_sent_at ON loans(reminder_h2_sent_at);
CREATE INDEX IF NOT EXISTS idx_loans_reminder_deadline_sent_at ON loans(reminder_deadline_sent_at);

-- Composite index untuk query reminder (deadline + status + reminder status)
-- Query pattern: SELECT ... WHERE status = 'dipinjam' AND deadline BETWEEN ? AND ? AND reminder_h2_sent_at IS NULL
CREATE INDEX IF NOT EXISTS idx_loans_reminder_h2_queries 
  ON loans(deadline, status, reminder_h2_sent_at) 
  WHERE status = 'dipinjam' AND reminder_h2_sent_at IS NULL;

-- Query pattern: SELECT ... WHERE status = 'dipinjam' AND deadline BETWEEN ? AND ? AND reminder_deadline_sent_at IS NULL
CREATE INDEX IF NOT EXISTS idx_loans_reminder_deadline_queries 
  ON loans(deadline, status, reminder_deadline_sent_at) 
  WHERE status = 'dipinjam' AND reminder_deadline_sent_at IS NULL;

-- ============================================================================
-- VERIFY STRUCTURE (untuk dokumentasi)
-- ============================================================================
-- Kolom yang harus ada di table loans:
-- - id (uuid, primary key)
-- - kode_unik (text, unique)
-- - nama, tanggal_lahir, prodi, jurusan, semester (text/date)
-- - nomor_whatsapp, email (text)
-- - pickup_date (date, NEW - tanggal pengambilan)
-- - deadline (timestamptz - deadline pengembalian dengan jam 23:59)
-- - status (text: 'dipinjam', 'kembali', 'selesai')
-- - tanggal_kembali (timestamptz, nullable)
-- - reminder_h2_sent_at (timestamptz, nullable, NEW)
-- - reminder_deadline_sent_at (timestamptz, nullable, NEW)
-- - created_at (timestamptz, default: now())
-- - updated_at (timestamptz, default: now())