# Setup Instructions - Unimus Inventrack

## Langkah 1: Setup Supabase Storage Bucket

Karena storage bucket tidak dapat dibuat secara otomatis, Anda perlu membuat bucket secara manual di Supabase Dashboard.

### A. Buat Storage Bucket

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Klik menu "Storage" di sidebar kiri
4. Klik tombol "New bucket"
5. Isi form dengan:
   - **Name**: `loans`
   - **Public bucket**: Centang/Enable (agar foto bisa diakses publik)
6. Klik "Create bucket"

### B. Setup Storage Policies

Setelah bucket dibuat, Anda perlu setup RLS policies untuk storage:

1. Di halaman Storage, klik bucket `loans`
2. Klik tab "Policies"
3. Jalankan SQL berikut di SQL Editor (Storage → Configuration → Policies):

```sql
-- Policy untuk upload (authenticated users)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'loans');

-- Policy untuk update (authenticated users)
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'loans')
WITH CHECK (bucket_id = 'loans');

-- Policy untuk view (public access untuk melihat foto)
CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'loans');

-- Policy untuk delete (authenticated users)
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'loans');
```

## Langkah 2: Buat User Admin

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Klik menu "Authentication" di sidebar kiri
4. Klik tab "Users"
5. Klik "Add user" → "Create new user"
6. Isi form:
   - **Email**: `admin@unimus.ac.id` (atau email lain)
   - **Password**: Buat password yang kuat (minimal 6 karakter)
   - **Auto Confirm User**: Centang/Enable
7. Klik "Create user"

**PENTING**: Simpan email dan password ini untuk login ke aplikasi!

## Langkah 3: Jalankan Aplikasi

```bash
# Install dependencies (jika belum)
npm install

# Run development server
npm run dev
```

Buka browser dan akses: [http://localhost:3000](http://localhost:3000)

## Langkah 4: Login

1. Aplikasi akan redirect ke halaman login
2. Masukkan email dan password admin yang sudah dibuat
3. Klik "Login"
4. Anda akan masuk ke dashboard

## Verifikasi Setup

Setelah login, coba:

1. **Tambah Peminjaman Baru**:
   - Klik "Peminjaman Baru"
   - Isi form
   - Upload foto peminjam dan barang
   - Simpan

2. **Lihat Daftar Peminjaman**:
   - Klik "Daftar Peminjaman"
   - Pastikan data muncul
   - Coba search dan filter

3. **Cetak Bukti**:
   - Klik icon printer pada salah satu peminjaman
   - Pastikan QR code muncul
   - Coba cetak dengan Ctrl+P atau Cmd+P

## Troubleshooting

### Error: "Error creating loan: Failed to upload file"

**Solusi**: Pastikan storage bucket `loans` sudah dibuat dan policies sudah disetup dengan benar.

### Error: "Invalid login credentials"

**Solusi**: Pastikan:
- User sudah dibuat di Supabase Authentication
- Email dan password yang dimasukkan benar
- User sudah di-confirm (Auto Confirm User dicentang saat membuat user)

### Foto tidak bisa di-upload

**Solusi**:
1. Cek apakah bucket `loans` sudah dibuat
2. Cek apakah bucket bersifat public
3. Cek apakah storage policies sudah disetup
4. Cek console browser untuk error message detail

### QR Code tidak muncul di halaman print

**Solusi**:
- Pastikan koneksi internet aktif (QR Code menggunakan API eksternal)
- Coba refresh halaman
- Cek console browser untuk error

## Database Structure

Tabel `loans` sudah otomatis dibuat dengan struktur:

- `id` (uuid) - Primary key
- `kode_unik` (text) - Kode peminjaman (UIT-YYYY-XXXX)
- `nama` (text) - Nama peminjam
- `tanggal_lahir` (date) - Tanggal lahir peminjam
- `prodi` (text) - Program studi
- `jurusan` (text) - Jurusan
- `semester` (integer) - Semester
- `nama_barang` (text) - Nama barang
- `foto_peminjam_url` (text) - URL foto peminjam
- `foto_barang_url` (text) - URL foto barang
- `tanggal_pinjam` (timestamptz) - Tanggal peminjaman
- `tanggal_kembali` (timestamptz) - Tanggal pengembalian
- `status` (text) - Status (dipinjam/kembali)
- `created_at` (timestamptz) - Timestamp dibuat
- `updated_at` (timestamptz) - Timestamp update

## Fitur-Fitur

✅ Login admin dengan Supabase Auth
✅ Dashboard dengan statistik real-time
✅ Form input peminjaman lengkap
✅ Upload foto peminjam dan barang
✅ Generate kode unik otomatis (UIT-YYYY-XXXX)
✅ Generate QR Code untuk setiap peminjaman
✅ Daftar peminjaman dengan search & filter
✅ Real-time update durasi peminjaman
✅ Preview detail peminjaman dengan foto
✅ Fitur kembalikan barang
✅ Cetak bukti peminjaman dengan QR Code
✅ Delete peminjaman

## Keamanan

- ✅ Row Level Security (RLS) aktif
- ✅ Authenticated users only
- ✅ Protected routes dengan middleware
- ✅ Session management
- ✅ Secure file upload

## Support

Jika ada masalah atau pertanyaan, silakan cek:
1. README.md untuk dokumentasi lengkap
2. Console browser untuk error message
3. Supabase Dashboard untuk cek data

---

© 2026 Universitas Muhammadiyah Semarang
