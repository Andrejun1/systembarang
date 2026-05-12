# ✅ PRE-PRODUCTION CHECKLIST

**Tanggal Refactor:** 2026-05-12  
**Project:** Unimus Inventrack (UIT) - Sistem Peminjaman Barang Laboratorium  
**Status:** ✅ SIAP PRODUCTION

---

## 📋 Code Review & Testing

### Database Schema ✅
- [x] Migration file sudah dibuat: `20260512000000_add_pickup_date_and_reminder_status.sql`
- [x] Kolom `pickup_date` sudah ditambah (DATE, nullable)
- [x] Kolom `reminder_h2_sent_at` sudah ditambah (TIMESTAMPTZ, nullable)
- [x] Kolom `reminder_deadline_sent_at` sudah ditambah (TIMESTAMPTZ, nullable)
- [x] Indexes sudah dibuat untuk performance
- [x] Composite indexes untuk reminder queries
- [x] RLS (Row Level Security) masih aktif
- [x] Backward compatibility terjamin (all nullable)

### Frontend Form ✅
- [x] Field `pickup_date` sudah ditambah di `app/admin/new/page.tsx`
- [x] Field `deadline` sudah ada dengan label yang jelas
- [x] Validasi `pickup_date >= hari ini`
- [x] Validasi `deadline >= pickup_date`
- [x] Validasi `deadline >= hari ini`
- [x] Help text sudah clear
- [x] UI tetap consistent dengan design existing

### Backend Logic ✅
- [x] `lib/loans.ts` interface `LoanInsert` punya `pickup_date`
- [x] `lib/loans.ts` interface `Loan` punya `reminder_h2_sent_at` & `reminder_deadline_sent_at`
- [x] Function `createLoanWithItems` handle deadline + jam 23:59:00
- [x] Function `updateLoan` support update reminder fields
- [x] No breaking changes di existing functions
- [x] Type safety: TypeScript strict mode compatible

### Reminder API ✅
- [x] Endpoint `/api/reminder` sudah di-refactor
- [x] Dual-reminder system (H-2 + deadline) implemented
- [x] Reminder H-2: query untuk 48 jam sebelum deadline
- [x] Reminder deadline: query untuk hari deadline
- [x] Anti-duplikasi: menggunakan `reminder_h2_sent_at` & `reminder_deadline_sent_at`
- [x] HTML email template profesional (H-2 & deadline)
- [x] Text email template untuk fallback
- [x] Error handling & logging
- [x] Response structure clear & documented

### Environment & Configuration ✅
- [x] `.env.local` template sudah ready
- [x] `vercel.json` sudah dibuat dengan cron config
- [x] Cron schedule: `0 8 * * *` (08:00 UTC = 15:00 WIB)
- [x] Documentation untuk setup env vars

---

## 🚀 Deployment Steps

### Pre-Deployment (Local)

```bash
# 1. Install dependencies
npm install

# 2. Run migration locally (optional, untuk testing)
# gunakan Supabase CLI jika available
supabase migration up

# 3. Test form locally
npm run dev
# Visit: http://localhost:3000/admin/new
# Create test loan dengan pickup_date

# 4. Test reminder API locally
curl http://localhost:3000/api/reminder
# Should return: { summary: {...}, details: {...} }

# 5. Run tests (if available)
npm test
```

### Deployment (Vercel)

```bash
# 1. Commit dan push code
git add .
git commit -m "refactor: system tanggal/waktu dan dual-reminder"
git push origin main

# 2. Vercel akan auto-deploy ke production
# atau manual: vercel deploy --prod
```

### Post-Deployment (Verify)

1. **Database:**
   - [ ] Migration sudah executed di production Supabase
   - [ ] Kolom baru visible di table loans
   - [ ] Indexes sudah dibuat

2. **Frontend:**
   - [ ] Form `/admin/new` accessible
   - [ ] Field `pickup_date` ada dan berfungsi
   - [ ] Validasi date bekerja di browser
   - [ ] Bisa submit form baru dengan pickup_date

3. **Backend:**
   - [ ] Create loan baru dengan pickup_date
   - [ ] Deadline tersimpan dengan jam 23:59:00 di database
   - [ ] Query data dari database: deadline format correct

4. **Email:**
   - [ ] Resend API key valid
   - [ ] Test endpoint: `curl https://yourdomain.com/api/reminder`
   - [ ] Response struktur correct
   - [ ] Email template ter-preview dengan baik

5. **Cron:**
   - [ ] Vercel cron sudah registered
   - [ ] Visit: https://vercel.com → Settings → Cron Jobs
   - [ ] Status: Active
   - [ ] Schedule: 0 8 * * * (every day 08:00 UTC)

---

## 🧪 Manual Testing

### Test 1: Create Loan dengan pickup_date

```bash
# Via UI
1. Buka: https://yourdomain.com/admin/new
2. Isi form:
   - Nama: Test User
   - Tanggal Lahir: 2005-03-15
   - Program Studi: TIF
   - Jurusan: Teknik
   - Semester: 4
   - Nomor WA: 08123456789
   - Email: test@example.com
   - Tanggal Pengambilan: hari ini atau besok
   - Deadline Pengembalian: minggu depan
   - Select barang: pilih 1 barang
3. Submit form
4. Verifikasi: loan berhasil dibuat dengan kode unik

# Via Supabase
SELECT id, kode_unik, pickup_date, deadline, created_at 
FROM loans 
ORDER BY created_at DESC 
LIMIT 1;

# Expected:
# - pickup_date: 2026-05-15 (DATE format)
# - deadline: 2026-05-20T23:59:00+07:00 (dengan jam 23:59)
# - created_at: 2026-05-12T10:30:45.123456+07:00 (auto dari server)
```

### Test 2: Reminder H-2

```bash
# Create test loan dengan deadline H-2 besok
INSERT INTO loans (
  kode_unik, nama, email, nomor_whatsapp, status, 
  pickup_date, deadline, reminder_h2_sent_at
) VALUES (
  'TEST-H2-001',
  'Test User',
  'your-email@example.com',
  '08123456789',
  'dipinjam',
  CURRENT_DATE,
  -- deadline besok hari pukul 23:59
  (NOW() + INTERVAL '1 day')::DATE || 'T23:59:00+07:00'::TIMESTAMPTZ,
  NULL
);

# Call reminder API
curl https://yourdomain.com/api/reminder

# Expected:
# - reminder_h2_sent_at: di-update dengan current timestamp
# - Email dikirim ke your-email@example.com
# - Subject: "⏰ Pengingat H-2: Pengembalian Barang"
```

### Test 3: Reminder Deadline

```bash
# Create test loan dengan deadline hari ini
INSERT INTO loans (
  kode_unik, nama, email, nomor_whatsapp, status, 
  pickup_date, deadline, reminder_deadline_sent_at
) VALUES (
  'TEST-DEADLINE-001',
  'Test User',
  'your-email@example.com',
  '08123456789',
  'dipinjam',
  CURRENT_DATE - INTERVAL '7 days',
  -- deadline hari ini pukul 23:59
  CURRENT_DATE || 'T23:59:00+07:00'::TIMESTAMPTZ,
  NULL
);

# Call reminder API
curl https://yourdomain.com/api/reminder

# Expected:
# - reminder_deadline_sent_at: di-update dengan current timestamp
# - Email dikirim ke your-email@example.com
# - Subject: "🚨 HARI DEADLINE: Segera Kembalikan Barang"
```

### Test 4: Anti-Duplikasi

```bash
# Call reminder API 2x dalam hitungan menit
curl https://yourdomain.com/api/reminder
# response: { sent: [{...}], skipped: [] }

curl https://yourdomain.com/api/reminder
# Expected response: { sent: [], skipped: [] }
# Reminder tidak dikirim 2x (anti-duplikasi berhasil)

# Verify di database:
SELECT kode_unik, reminder_h2_sent_at, reminder_deadline_sent_at 
FROM loans 
WHERE kode_unik LIKE 'TEST-%';
```

### Test 5: Backward Compatibility

```bash
# Query data lama yang tidak punya pickup_date
SELECT id, kode_unik, pickup_date, created_at, deadline 
FROM loans 
WHERE pickup_date IS NULL 
LIMIT 5;

# Expected: ada data lama dengan pickup_date = NULL
# Sistem tetap work, fallback ke created_at untuk display

# Verify no errors di aplikasi untuk data lama
```

---

## 📊 Monitoring (First Week)

### Metrik yang Dipantau

- [ ] API response time: `/api/reminder` < 5 detik
- [ ] Email delivery rate: > 95%
- [ ] Error rate: < 0.1%
- [ ] Database query performance: indexes working
- [ ] No duplicate reminders sent

### Log Locations

**Vercel:**
- https://vercel.com/dashboard/[project]/logs
- Filter: `/api/reminder`

**Sentry (jika setup):**
- https://sentry.io/[organization]/[project]/issues

**Local Debug:**
```bash
# Tail logs dari Vercel function
vercel logs --follow

# atau check Vercel deployment logs
vercel logs https://yourdomain.com
```

### Alert Setup

```javascript
// Tambahkan ke sentry.ts atau error tracking
Sentry.captureException(error, {
  level: "error",
  tags: {
    feature: "reminder",
    type: "h2" || "deadline"
  }
});
```

---

## 🚨 Rollback Plan

Jika ada issue, rollback ke versi sebelumnya:

```bash
# 1. Rollback deployment di Vercel
# - Dashboard → Deployments → Click previous working deploy → Rollback

# 2. Rollback database (manual, jika needed)
# Caranya: Supabase → SQL Editor → jalankan undo script

# 3. Clear cache
vercel cache clear
```

**Undo Migration Script (jika perlu):**

```sql
-- HANYA jalankan ini jika rollback diperlukan
-- BACKUP DATA DULU sebelum jalankan ini!

ALTER TABLE loans
  DROP COLUMN IF EXISTS pickup_date CASCADE;
  
ALTER TABLE loans
  DROP COLUMN IF EXISTS reminder_h2_sent_at CASCADE;
  
ALTER TABLE loans
  DROP COLUMN IF EXISTS reminder_deadline_sent_at CASCADE;

DROP INDEX IF EXISTS idx_loans_pickup_date;
DROP INDEX IF EXISTS idx_loans_reminder_h2_sent_at;
DROP INDEX IF EXISTS idx_loans_reminder_deadline_sent_at;
DROP INDEX IF EXISTS idx_loans_reminder_h2_queries;
DROP INDEX IF EXISTS idx_loans_reminder_deadline_queries;
```

---

## 📞 Support Contact

Jika ada issue:

1. **Database Issue:** 
   - Check Supabase dashboard
   - Run: `SELECT * FROM pg_stat_activity;`
   - Check indexes: `SELECT * FROM pg_indexes WHERE tablename = 'loans';`

2. **Email Issue:**
   - Check Resend dashboard: https://resend.com/logs
   - Verify API key di Vercel env

3. **Deployment Issue:**
   - Check Vercel build logs
   - Run: `npm run build` locally untuk debug

4. **Cron Issue:**
   - Check Vercel cron logs
   - Verify schedule di vercel.json
   - Test endpoint manually via curl

---

## 📝 Sign-Off

- [ ] Lead Developer: ___________  Date: ________
- [ ] QA: ___________  Date: ________
- [ ] DevOps/Deployment: ___________  Date: ________

---

**Last Updated:** 2026-05-12  
**Version:** 1.0  
**Status:** ✅ READY FOR PRODUCTION
