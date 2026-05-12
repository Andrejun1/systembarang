# Environment Variables Setup Guide

## 🔐 Wajib Ada di `.env.local` (Development)

```env
# ============================================================================
# SUPABASE - Database & Authentication
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://jtqexkywzfedgufkcmmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Service Role Key (untuk API yang memerlukan privilege lebih)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# EMAIL - Resend.dev
# ============================================================================
RESEND_API_KEY=re_7cNndWAy_9zHetHL5CBSbXHHVbbWn1GjR
RESEND_FROM_EMAIL=onboarding@resend.dev
```

## 🔐 Wajib Ada di Environment Production (Vercel)

**Di Vercel Dashboard:**
Settings → Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL: https://jtqexkywzfedgufkcmmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJ...
SUPABASE_SERVICE_ROLE_KEY: eyJ...
RESEND_API_KEY: re_7cNn...
RESEND_FROM_EMAIL: onboarding@resend.dev
CRON_SECRET: your-random-secret-key-here (optional, untuk extra security)
NEXT_PUBLIC_APP_URL: https://yourdomain.com (optional)
```

## 📝 Cara Setup

### 1. Local Development

Buat file `.env.local` di root project:

```bash
# Dari template .env.example jika ada
cp .env.example .env.local

# Edit dengan editor favorit
# Isi dengan nilai yang sesuai
```

### 2. Production (Vercel)

**Option A: Via Vercel Dashboard**

1. Go to: https://vercel.com/dashboard
2. Select project → Settings
3. Environment Variables
4. Add dari tabel di atas

**Option B: Via Vercel CLI**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM_EMAIL
```

### 3. Supabase Setup

**Get Supabase Keys:**

1. Go to: https://app.supabase.com
2. Select project → Settings → API
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Resend Setup

**Get Resend Keys:**

1. Go to: https://resend.com/api-keys
2. Create/Copy API Key → `RESEND_API_KEY`
3. Verifikasi sender email → `RESEND_FROM_EMAIL`

---

## ✅ Verification Checklist

Setelah setup, verifikasi dengan:

```bash
# Test connection ke Supabase
curl -X GET "https://jtqexkywzfedgufkcmmh.supabase.co/rest/v1/loans?limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Test Resend API (jika punya akses curl)
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "'"$RESEND_FROM_EMAIL"'",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

---

## 🚨 Security Notes

⚠️ **JANGAN PERNAH:**
- Push `.env.local` ke Git (pastikan di `.gitignore`)
- Commit API keys atau secrets
- Share API keys di public
- Use same keys untuk development dan production

✅ **LAKUKAN:**
- Rotate keys regularly
- Use different keys untuk dev vs production
- Keep `.env.local` di local machine saja
- Use Vercel's built-in secret management

---

## 🔄 Rotate Keys

Jika perlu rotate keys (security incident):

### 1. Supabase API Keys

- Go to: https://app.supabase.com → Settings → API
- Click "Reveal" next to key
- Click "Rotate" button
- Update di `.env.local` dan Vercel

### 2. Resend API Keys

- Go to: https://resend.com/api-keys
- Delete old key
- Create new key
- Update di `.env.local` dan Vercel

---

**Last Updated:** 2026-05-12
