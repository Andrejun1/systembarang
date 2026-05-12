-- ============================================================================
-- STRUKTUR TABLE LOANS - SETELAH REFACTOR
-- ============================================================================
-- Last Updated: 2026-05-12
-- Dokumentasi lengkap struktur database table loans yang sudah direfactor

-- ============================================================================
-- TABLE: loans (Header/Master Peminjaman)
-- ============================================================================

-- Struktur field di table loans:
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ PRIMARY IDENTIFIER                                                  │
-- ├─────────────────────────────────────────────────────────────────────┤
-- │ id                UUID, PK, auto-generated via gen_random_uuid()    │
-- │ kode_unik         TEXT, UNIQUE, format: UIT-YYYY-NNNN               │
-- └─────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ DATA PEMINJAM (Borrower Info)                                       │
-- ├─────────────────────────────────────────────────────────────────────┤
-- │ nama              TEXT, NOT NULL                                    │
-- │ tanggal_lahir     DATE, NOT NULL                                    │
-- │ prodi             TEXT, NOT NULL                                    │
-- │ jurusan           TEXT, NOT NULL                                    │
-- │ semester          INTEGER, NOT NULL                                 │
-- │ nomor_whatsapp    TEXT, NOT NULL, format: 08123456789 atau +628xxx  │
-- │ email             TEXT, nullable, untuk pengiriman reminder         │
-- └─────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ TANGGAL & WAKTU (Refactored - NEW SYSTEM)                           │
-- ├─────────────────────────────────────────────────────────────────────┤
-- │ created_at        TIMESTAMPTZ, auto: DEFAULT now()                  │
-- │                   → Waktu record dibuat (server timestamp)          │
-- │                   → Contoh: 2026-05-12T10:30:45.123456+07:00        │
-- │                   → TIDAK RANDOM, STABIL ✅                          │
-- │                                                                     │
-- │ pickup_date       DATE, nullable                                    │
-- │                   → Tanggal pengambilan barang (user input)         │
-- │                   → Format: YYYY-MM-DD (tanpa waktu)                │
-- │                   → Contoh: 2026-05-15                              │
-- │                   → Validasi: >= hari ini                           │
-- │                   → Backward compatible: nullable untuk data lama   │
-- │                                                                     │
-- │ deadline          TIMESTAMPTZ, NOT NULL                             │
-- │                   → Deadline pengembalian barang                    │
-- │                   → Format: YYYY-MM-DDTHH:MM:SS (dengan jam 23:59) │
-- │                   → Contoh: 2026-05-20T23:59:00+07:00               │
-- │                   → User input tanggal, server add jam 23:59:00     │
-- │                   → Validasi: >= pickup_date                        │
-- │                   → TIDAK RANDOM, KONSISTEN ✅                       │
-- │                                                                     │
-- │ tanggal_kembali   TIMESTAMPTZ, nullable                             │
-- │                   → Waktu barang dikembalikan                       │
-- │                   → Diisi otomatis saat return (returnLoan())       │
-- └─────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ REMINDER STATUS (NEW - Dual Reminder System)                        │
-- ├─────────────────────────────────────────────────────────────────────┤
-- │ reminder_h2_sent_at           TIMESTAMPTZ, nullable                │
-- │                   → Timestamp saat reminder H-2 dikirim              │
-- │                   → NULL = belum dikirim                            │
-- │                   → Diisi saat GET /api/reminder berhasil           │
-- │                   → Prevent duplikasi reminder H-2                  │
-- │                                                                     │
-- │ reminder_deadline_sent_at     TIMESTAMPTZ, nullable                │
-- │                   → Timestamp saat reminder deadline dikirim        │
-- │                   → NULL = belum dikirim                            │
-- │                   → Diisi saat GET /api/reminder berhasil           │
-- │                   → Prevent duplikasi reminder deadline             │
-- └─────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ BARANG TERKAIT (Item Reference - for convenience)                   │
-- ├─────────────────────────────────────────────────────────────────────┤
-- │ nama_barang       TEXT, nullable                                    │
-- │                   → Referensi cepat ke item pertama (backward compat)
-- │ item_id           UUID, FK to items.id, nullable                    │
-- │                   → Referensi ke item pertama                       │
-- │ quantity          INTEGER, nullable                                 │
-- │                   → Quantity item pertama                           │
-- │ foto_barang_url   TEXT, nullable                                    │
-- │                   → URL foto barang dari Supabase Storage           │
-- └─────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ FOTO & MEDIA                                                        │
-- ├─────────────────────────────────────────────────────────────────────┤
-- │ foto_peminjam_url TEXT, nullable                                    │
-- │                   → URL foto peminjam dari Supabase Storage         │
-- └─────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ STATUS & AUDIT                                                      │
-- ├─────────────────────────────────────────────────────────────────────┤
-- │ status            TEXT, default: 'dipinjam'                         │
-- │                   → Values: 'dipinjam', 'kembali', 'selesai'        │
-- │ updated_at        TIMESTAMPTZ, auto-updated via trigger            │
-- │                   → Timestamp update terakhir                       │
-- └─────────────────────────────────────────────────────────────────────┘

-- ============================================================================
-- INDEXES (Performance Optimization)
-- ============================================================================

-- Single column indexes:
-- idx_loans_kode_unik
-- idx_loans_status
-- idx_loans_tanggal_pinjam
-- idx_loans_item_id
-- idx_loans_deadline
-- idx_loans_pickup_date
-- idx_loans_reminder_h2_sent_at
-- idx_loans_reminder_deadline_sent_at

-- Composite indexes (untuk reminder queries):
-- idx_loans_reminder_h2_queries
--   ON loans(deadline, status, reminder_h2_sent_at)
--   WHERE status = 'dipinjam' AND reminder_h2_sent_at IS NULL
--
-- idx_loans_reminder_deadline_queries
--   ON loans(deadline, status, reminder_deadline_sent_at)
--   WHERE status = 'dipinjam' AND reminder_deadline_sent_at IS NULL

-- ============================================================================
-- TABLE: loan_items (Detail Barang dalam Peminjaman)
-- ============================================================================

-- Struktur junction table loan_items:
-- id                UUID, PK
-- loan_id           UUID, FK to loans.id (ON DELETE CASCADE)
-- item_id           UUID, FK to items.id (ON DELETE SET NULL)
-- quantity          INTEGER
-- foto_barang_url   TEXT, nullable
-- created_at        TIMESTAMPTZ, default: now()

-- Relationship:
-- 1 loan ----< many loan_items >---- many items
-- Contoh: 1 peminjaman bisa punya 3 barang berbeda

-- ============================================================================
-- SEED DATA EXAMPLE
-- ============================================================================

-- Create test loan dengan reminder yang siap dikirim:
INSERT INTO loans (
  id,
  kode_unik,
  nama,
  tanggal_lahir,
  prodi,
  jurusan,
  semester,
  nomor_whatsapp,
  email,
  nama_barang,
  item_id,
  quantity,
  foto_peminjam_url,
  foto_barang_url,
  status,
  pickup_date,
  deadline,
  reminder_h2_sent_at,
  reminder_deadline_sent_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),                           -- id
  'UIT-2026-0001',                             -- kode_unik
  'Ahmad Syaiful',                             -- nama
  '2005-03-15'::DATE,                          -- tanggal_lahir
  'Teknik Informatika',                        -- prodi
  'Teknik',                                    -- jurusan
  4,                                           -- semester
  '08123456789',                               -- nomor_whatsapp
  'ahmad@example.com',                         -- email
  'Multimeter Digital',                        -- nama_barang (ref)
  '01234567-89ab-cdef-0123-456789abcdef'::UUID, -- item_id (ref)
  1,                                           -- quantity (ref)
  NULL,                                        -- foto_peminjam_url
  NULL,                                        -- foto_barang_url
  'dipinjam',                                  -- status
  '2026-05-15'::DATE,                          -- pickup_date
  '2026-05-20T23:59:00+07:00'::TIMESTAMPTZ,   -- deadline
  NULL,                                        -- reminder_h2_sent_at (belum dikirim)
  NULL,                                        -- reminder_deadline_sent_at (belum dikirim)
  NOW(),                                       -- created_at
  NOW()                                        -- updated_at
);

-- ============================================================================
-- QUERIES YANG SERING DIGUNAKAN
-- ============================================================================

-- 1. Ambil semua peminjaman yang masih aktif
SELECT * FROM loans 
WHERE status = 'dipinjam' 
ORDER BY deadline ASC;

-- 2. Ambil peminjaman yang sudah overdue
SELECT * FROM loans 
WHERE status = 'dipinjam' AND deadline < NOW() 
ORDER BY deadline ASC;

-- 3. Ambil peminjaman yang memerlukan reminder H-2
SELECT * FROM loans 
WHERE status = 'dipinjam' 
  AND deadline >= NOW() - INTERVAL '48 hours'
  AND deadline < NOW() + INTERVAL '1 minute'
  AND reminder_h2_sent_at IS NULL;

-- 4. Ambil peminjaman yang memerlukan reminder deadline
SELECT * FROM loans 
WHERE status = 'dipinjam' 
  AND DATE(deadline) = CURRENT_DATE
  AND reminder_deadline_sent_at IS NULL;

-- 5. Ambil peminjaman dengan detail barang (JOIN)
SELECT 
  l.*,
  li.id as item_detail_id,
  li.quantity as item_quantity,
  i.nama_barang,
  i.kode_barang
FROM loans l
LEFT JOIN loan_items li ON l.id = li.loan_id
LEFT JOIN items i ON li.item_id = i.id
WHERE l.id = 'xxx-xxx-xxx'
ORDER BY li.created_at ASC;

-- 6. Summary statistik
SELECT 
  COUNT(*) as total_pinjaman,
  COUNT(CASE WHEN status = 'dipinjam' THEN 1 END) as aktif,
  COUNT(CASE WHEN status = 'kembali' THEN 1 END) as sudah_dikembalikan,
  COUNT(CASE WHEN status = 'dipinjam' AND deadline < NOW() THEN 1 END) as overdue
FROM loans;

-- 7. Backup/Export peminjaman bulan ini
SELECT * FROM loans 
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
ORDER BY created_at DESC;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- File migration: 20260512000000_add_pickup_date_and_reminder_status.sql
--
-- Apa yang dilakukan:
-- 1. ALTER TABLE loans ADD COLUMN pickup_date DATE
-- 2. ALTER TABLE loans ADD COLUMN reminder_h2_sent_at TIMESTAMPTZ
-- 3. ALTER TABLE loans ADD COLUMN reminder_deadline_sent_at TIMESTAMPTZ
-- 4. CREATE INDEX idx_loans_pickup_date ON loans(pickup_date)
-- 5. CREATE INDEX idx_loans_reminder_h2_sent_at ON loans(reminder_h2_sent_at)
-- 6. CREATE INDEX idx_loans_reminder_deadline_sent_at ON loans(reminder_deadline_sent_at)
-- 7. CREATE COMPOSITE INDEXES untuk reminder queries
--
-- Safe to run multiple times (all operations have IF NOT EXISTS / IF NOT)
-- Tidak ada data yang dihapus
-- Backward compatible - semua kolom baru bersifat nullable

-- ============================================================================
-- BACKWARD COMPATIBILITY NOTES
-- ============================================================================

-- Data lama tanpa pickup_date:
-- - pickup_date = NULL (fallback ke created_at jika diperlukan)
-- - Tidak akan error, sistem handle NULL value
--
-- Data lama dengan reminder_sent_at (field lama):
-- - Kolom reminder_sent_at tetap ada (tidak dihapus)
-- - Kolom baru: reminder_h2_sent_at, reminder_deadline_sent_at
-- - Bisa migrate data lama: UPDATE loans SET reminder_h2_sent_at = reminder_sent_at WHERE...
--
-- Contoh query untuk handle backward compat di TypeScript:
-- const pickupDate = loan.pickup_date || new Date(loan.created_at).toISOString().split('T')[0];

-- ============================================================================
-- VERSION HISTORY
-- ============================================================================
-- v1.0 (2026-05-12) - Initial refactor dengan dual-reminder system
--   - Tambah pickup_date untuk tracking tanggal pengambilan
--   - Tambah reminder_h2_sent_at untuk reminder H-2
--   - Tambah reminder_deadline_sent_at untuk reminder deadline
--   - Stabilize deadline dengan jam 23:59:00
--   - Add performance indexes
