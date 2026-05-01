# Unimus Inventrack (UIT)

Sistem Manajemen Peminjaman Barang Laboratorium - Universitas Muhammadiyah Semarang

## Deskripsi

Website fullstack modern untuk mencatat, memantau, dan mengelola peminjaman barang laboratorium secara real-time, lengkap dengan foto peminjam, foto barang, dan kode unik/barcode sebagai bukti peminjaman.

## Teknologi yang Digunakan

- **Frontend**: Next.js 13 (App Router) + Tailwind CSS
- **Backend**: API Routes Next.js + Supabase
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth (Email & Password)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Fitur Utama

### Autentikasi

- Login admin dengan email dan password
- Session management dengan Supabase Auth
- Protected routes dengan middleware

### Manajemen Peminjaman

- Input data peminjaman lengkap (peminjam + barang)
- Upload foto peminjam dan foto barang
- Generate kode unik otomatis (format: UIT-YYYY-XXXX)
- Generate QR Code untuk setiap peminjaman
- Real-time update durasi peminjaman

### Dashboard

- Statistik peminjaman (total, aktif, dikembalikan, bulan ini)
- Daftar peminjaman terbaru
- Search berdasarkan kode, nama, atau barang
- Filter berdasarkan status (dipinjam/kembali)
- Preview foto peminjam dan barang
- Tombol kembalikan barang
- Tombol cetak bukti peminjaman
- Tombol hapus data

### Bukti Peminjaman

- Halaman printable dengan QR Code
- Format A4 siap cetak
- Informasi lengkap peminjam dan barang
- QR Code untuk verifikasi

## Setup Instruksi

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

#### A. Database

Database sudah otomatis ter-setup dengan migration yang sudah dijalankan.

Tabel yang dibuat:

- `loans` - menyimpan data peminjaman

#### B. Storage Buckets

Buat storage bucket di Supabase Dashboard:

1. Buka Supabase Dashboard → Storage
2. Klik "Create bucket"
3. Nama bucket: `loans`
4. Public bucket: **Yes** (agar foto bisa diakses publik)
5. Klik "Create bucket"

Setelah bucket dibuat, atur policy:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'loans');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'loans');

-- Allow public to view files
CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'loans');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'loans');
```

#### C. Authentication

Buat user admin untuk login:

1. Buka Supabase Dashboard → Authentication → Users
2. Klik "Add user" → "Create new user"
3. Masukkan email dan password admin
4. Klik "Create user"

Contoh:

- Email: `admin@unimus.ac.id`
- Password: `admin123` (gunakan password yang lebih aman di production)

### 3. Environment Variables

File `.env` sudah ter-setup dengan konfigurasi Supabase. Pastikan variabel berikut ada:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### 5. Login

Gunakan kredensial admin yang sudah dibuat di Supabase:

- Email: `admin@unimus.ac.id`
- Password: `admin123`

## Struktur Folder

```
├── app/
│   ├── dashboard/          # Halaman dashboard
│   │   ├── layout.tsx      # Layout dashboard dengan sidebar
│   │   ├── page.tsx        # Dashboard utama
│   │   ├── new/            # Form peminjaman baru
│   │   ├── loans/          # Daftar peminjaman
│   │   └── print/          # Halaman cetak
│   ├── login/              # Halaman login
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/
│   ├── dashboard/          # Komponen dashboard
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   └── ui/                 # UI components (shadcn/ui)
├── contexts/
│   └── AuthContext.tsx     # Auth context provider
├── lib/
│   ├── supabase/          # Supabase config
│   │   ├── client.ts
│   │   └── types.ts
│   ├── auth.ts            # Auth utilities
│   └── loans.ts           # Loan management utilities
└── middleware.ts          # Next.js middleware untuk auth
```

## Cara Penggunaan

### 1. Tambah Peminjaman Baru

1. Login sebagai admin
2. Klik "Peminjaman Baru" di sidebar atau tombol di dashboard
3. Isi data peminjam:
   - Nama lengkap
   - Tanggal lahir
   - Program studi
   - Jurusan
   - Semester
4. Upload foto peminjam (opsional)
5. Isi nama barang yang dipinjam
6. Upload foto barang (opsional)
7. Klik "Simpan Peminjaman"
8. Sistem akan otomatis generate kode unik dan QR Code

### 2. Lihat Daftar Peminjaman

1. Klik "Daftar Peminjaman" di sidebar
2. Gunakan search box untuk mencari berdasarkan kode/nama/barang
3. Filter berdasarkan status (Semua/Dipinjam/Kembali)
4. Klik icon mata untuk preview detail
5. Klik icon printer untuk cetak bukti
6. Klik icon check untuk tandai sebagai dikembalikan
7. Klik icon trash untuk hapus data

### 3. Kembalikan Barang

1. Di halaman "Daftar Peminjaman"
2. Cari peminjaman yang ingin dikembalikan
3. Klik tombol check (hijau)
4. Konfirmasi pengembalian
5. Status akan berubah menjadi "Kembali"
6. Tanggal pengembalian akan tercatat otomatis

### 4. Cetak Bukti Peminjaman

1. Di halaman "Daftar Peminjaman"
2. Klik icon printer pada baris peminjaman
3. Halaman print akan terbuka di tab baru
4. Klik tombol "Cetak" atau gunakan Ctrl+P (Cmd+P di Mac)
5. Pilih printer dan cetak

## Fitur Keamanan

- RLS (Row Level Security) aktif di semua tabel
- Hanya authenticated users yang bisa akses data
- Protected routes dengan middleware
- Session management dengan Supabase Auth
- Secure file upload ke Supabase Storage

## Catatan Penting

1. **Storage Bucket**: Pastikan bucket `loans` sudah dibuat dan bersifat public
2. **Admin User**: Buat minimal 1 user admin di Supabase Authentication
3. **QR Code**: Menggunakan API eksternal (qrserver.com) untuk generate QR Code
4. **Foto**: Foto disimpan di Supabase Storage dan dapat diakses via URL public
5. **Kode Unik**: Format UIT-YYYY-XXXX (contoh: UIT-2026-0001)

## Troubleshooting

### Error saat upload foto

- Pastikan storage bucket `loans` sudah dibuat
- Pastikan bucket bersifat public
- Pastikan storage policies sudah di-setup dengan benar

### Tidak bisa login

- Pastikan user sudah dibuat di Supabase Authentication
- Periksa email dan password yang digunakan
- Cek console browser untuk error message

### QR Code tidak muncul

- Pastikan koneksi internet aktif (QR Code menggunakan API eksternal)
- Coba refresh halaman

### Data tidak muncul di dashboard

- Pastikan sudah login sebagai authenticated user
- Periksa RLS policies di Supabase
- Cek console browser untuk error message

## Build untuk Production

```bash
npm run build
npm run start
```

## License

© 2026 Universitas Muhammadiyah Semarang
