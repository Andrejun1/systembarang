/*
  # Add Email and Reminder Status to Loans

  Menambahkan kolom email untuk menyimpan alamat email peminjam dan
  reminder_sent_at untuk memastikan reminder email hanya dikirim sekali.
*/

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Index untuk mempercepat pencarian reminder yang belum dikirim
CREATE INDEX IF NOT EXISTS idx_loans_reminder_sent_at ON loans(reminder_sent_at);

-- Index tambahan untuk batas waktu pengembalian
CREATE INDEX IF NOT EXISTS idx_loans_deadline_for_reminder ON loans(deadline);
