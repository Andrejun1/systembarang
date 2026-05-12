import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
const resendFrom = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

function createResendClient() {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return null;
  }
  return new Resend(resendApiKey);
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
type ReminderLoan = {
  id: string;
  kode_unik: string;
  nama: string;
  email: string | null;
  nomor_whatsapp: string;
  deadline: string; // ISO timestamp dengan jam 23:59:00
  reminder_h2_sent_at: string | null;
  reminder_deadline_sent_at: string | null;
};

type ReminderResult = {
  id: string;
  type: "h2" | "deadline";
  email: string;
  kode_unik: string;
  sentAt: string;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format waktu menjadi format lokal Indonesia
 * @param value ISO timestamp string
 * @returns String format: "15 Mei 2026 23:59"
 */
function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Hitung jumlah jam dari sekarang hingga deadline
 */
function getHoursUntilDeadline(deadline: string): number {
  const now = new Date();
  const deadlineTime = new Date(deadline);
  const diffMs = deadlineTime.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

/**
 * Cek apakah sekarang sudah memasuki hari deadline
 * Deadline disimpan dengan jam 23:59:00, jadi hari deadline dimulai dari jam 00:00 hari tersebut
 */
function isDeadlineDay(deadline: string): boolean {
  const now = new Date();
  const deadlineTime = new Date(deadline);

  // Buat versi tanpa waktu untuk perbandingan
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineDate = new Date(
    deadlineTime.getFullYear(),
    deadlineTime.getMonth(),
    deadlineTime.getDate(),
  );

  return nowDate.getTime() === deadlineDate.getTime();
}

/**
 * Cek apakah sekarang berada dalam range H-2 (2 hari sebelum deadline)
 * H-2 dimulai dari 48 jam sebelum deadline dan berakhir saat hari deadline mulai
 */
function isWithinH2Period(deadline: string): boolean {
  const now = new Date();
  const deadlineTime = new Date(deadline);

  const h2Start = new Date(deadlineTime.getTime() - 48 * 60 * 60 * 1000);

  return now >= h2Start && now < deadlineTime;
}

// ============================================================================
// EMAIL BUILDERS
// ============================================================================

/**
 * Build HTML untuk reminder H-2 (2 hari sebelum deadline)
 */
function buildReminderH2Html(loan: ReminderLoan): string {
  const hoursLeft = getHoursUntilDeadline(loan.deadline);
  const daysLeft = Math.ceil(hoursLeft / 24);

  return `
    <html>
      <body style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f6f8fb; margin:0; padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px; margin:0 auto; padding:24px; background:#ffffff; border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,.08);">
          <tr>
            <td style="padding-bottom:24px; text-align:center;">
              <h1 style="margin:0; font-size:26px; color:#0f172a;">⏰ Pengingat H-2: Pengembalian Barang</h1>
              <p style="margin:8px 0 0; color:#475569; font-size:15px; line-height:1.6;">Halo ${loan.nama}, tinggal <strong>${daysLeft} hari</strong> lagi untuk mengembalikan peminjaman laboratorium Anda.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0;">
              <div style="background:#fef3c7; border:1px solid #fcd34d; border-radius:16px; padding:20px;">
                <p style="margin:0 0 12px; color:#92400e; font-size:14px; font-weight:600;">⏱️ Detail Pengembalian</p>
                <p style="margin:0; color:#b45309; font-size:14px;"><strong>Kode Peminjaman:</strong> ${loan.kode_unik}</p>
                <p style="margin:8px 0 0; color:#b45309; font-size:14px;"><strong>Nama:</strong> ${loan.nama}</p>
                <p style="margin:8px 0 0; color:#b45309; font-size:14px;"><strong>Deadline Pengembalian:</strong> ${formatDateTime(loan.deadline)}</p>
                <p style="margin:8px 0 0; color:#b45309; font-size:14px;"><strong>Sisa Waktu:</strong> ${daysLeft} hari</p>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <p style="color:#334155; font-size:15px; line-height:1.75;">
                Mohon persiapkan pengembalian barang Anda. Pastikan semua barang dalam kondisi baik saat dikembalikan. Jika Anda memerlukan perpanjangan atau memiliki kendala, segera hubungi admin laboratorium.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 0; text-align:center;">
              <a href="mailto:support@laboratorium.com" style="background:#f59e0b; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:12px; display:inline-block; font-weight:600;">Hubungi Admin</a>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin:0; color:#94a3b8; font-size:13px; line-height:1.6;">Ini adalah pengingat otomatis dari sistem Unimus Inventrack. Jika Anda telah mengembalikan barang, abaikan pesan ini.</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Build HTML untuk reminder hari deadline
 */
function buildReminderDeadlineHtml(loan: ReminderLoan): string {
  return `
    <html>
      <body style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f6f8fb; margin:0; padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px; margin:0 auto; padding:24px; background:#ffffff; border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,.08);">
          <tr>
            <td style="padding-bottom:24px; text-align:center;">
              <h1 style="margin:0; font-size:26px; color:#dc2626;">🚨 HARI DEADLINE: Segera Kembalikan Barang!</h1>
              <p style="margin:8px 0 0; color:#475569; font-size:15px; line-height:1.6;">Halo ${loan.nama}, <strong>HARI INI</strong> adalah deadline pengembalian peminjaman Anda.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0;">
              <div style="background:#fee2e2; border:1px solid #fca5a5; border-radius:16px; padding:20px;">
                <p style="margin:0 0 12px; color:#7f1d1d; font-size:14px; font-weight:600;">⚠️ Informasi Penting</p>
                <p style="margin:0; color:#991b1b; font-size:14px;"><strong>Kode Peminjaman:</strong> ${loan.kode_unik}</p>
                <p style="margin:8px 0 0; color:#991b1b; font-size:14px;"><strong>Nama:</strong> ${loan.nama}</p>
                <p style="margin:8px 0 0; color:#991b1b; font-size:14px;"><strong>Deadline Hari Ini Pukul:</strong> ${formatDateTime(loan.deadline)}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <p style="color:#334155; font-size:15px; line-height:1.75;">
                <strong>Mohon segera mengembalikan barang hari ini sebelum deadline.</strong> Pengembalian terlambat dapat berdampak pada status peminjaman Anda di masa depan. 
              </p>
              <p style="color:#334155; font-size:15px; line-height:1.75;">
                Jika ada kendala atau memerlukan perpanjangan, hubungi admin laboratorium <strong>SEKARANG JUGA</strong> sebelum deadline berakhir.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 0; text-align:center;">
              <a href="mailto:support@laboratorium.com" style="background:#dc2626; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:12px; display:inline-block; font-weight:600;">HUBUNGI ADMIN SEKARANG</a>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin:0; color:#94a3b8; font-size:13px; line-height:1.6;">Ini adalah pengingat otomatis hari deadline dari sistem Unimus Inventrack. Jika Anda telah mengembalikan barang, abaikan pesan ini.</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Build text version untuk reminder H-2
 */
function buildReminderH2Text(loan: ReminderLoan): string {
  const hoursLeft = getHoursUntilDeadline(loan.deadline);
  const daysLeft = Math.ceil(hoursLeft / 24);

  return `PENGINGAT H-2: PENGEMBALIAN BARANG

Halo ${loan.nama},

Tinggal ${daysLeft} hari lagi untuk mengembalikan peminjaman laboratorium Anda.

DETAIL PENGEMBALIAN:
Kode Peminjaman: ${loan.kode_unik}
Nama: ${loan.nama}
Deadline: ${formatDateTime(loan.deadline)}
Sisa Waktu: ${daysLeft} hari

Mohon persiapkan pengembalian barang Anda. Pastikan semua barang dalam kondisi baik saat dikembalikan.

Jika memerlukan perpanjangan atau bantuan, hubungi admin laboratorium.

---
Ini adalah pengingat otomatis dari Unimus Inventrack.`;
}

/**
 * Build text version untuk reminder deadline
 */
function buildReminderDeadlineText(loan: ReminderLoan): string {
  return `HARI DEADLINE: SEGERA KEMBALIKAN BARANG!

Halo ${loan.nama},

HARI INI adalah deadline pengembalian peminjaman Anda.

INFORMASI PENTING:
Kode Peminjaman: ${loan.kode_unik}
Nama: ${loan.nama}
Deadline Hari Ini Pukul: ${formatDateTime(loan.deadline)}

MOHON SEGERA MENGEMBALIKAN BARANG HARI INI SEBELUM DEADLINE.

Jika ada kendala atau memerlukan perpanjangan, HUBUNGI ADMIN LABORATORIUM SEKARANG JUGA sebelum deadline berakhir.

---
Ini adalah pengingat otomatis hari deadline dari Unimus Inventrack.`;
}

// ============================================================================
// MAIN ENDPOINT HANDLER
// ============================================================================

export async function GET() {
  const now = new Date();

  const supabase = createSupabaseClient();
  const resend = createResendClient();

  if (!supabase || !resend) {
    return NextResponse.json(
      {
        error:
          "RESEND_API_KEY and Supabase configuration are required to run this endpoint.",
      },
      { status: 503 },
    );
  }

  try {
    // ========================================================================
    // 1️⃣ REMINDER H-2 (2 hari sebelum deadline)
    // ========================================================================
    // Query: ambil loan yang:
    // - status = 'dipinjam'
    // - deadline dalam 48 jam ke depan (H-2)
    // - reminder_h2_sent_at IS NULL (belum dikirim)

    const h2Start = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const h2End = new Date(now.getTime() + 1 * 60 * 1000); // Buffer 1 menit

    const { data: loansH2, error: errorH2 } = await supabase
      .from("loans")
      .select(
        "id,kode_unik,nama,email,nomor_whatsapp,deadline,reminder_h2_sent_at,reminder_deadline_sent_at",
      )
      .eq("status", "dipinjam")
      .gte("deadline", h2Start.toISOString())
      .lt("deadline", h2End.toISOString())
      .is("reminder_h2_sent_at", null)
      .order("deadline", { ascending: true });

    if (errorH2) {
      return NextResponse.json({ error: errorH2.message }, { status: 500 });
    }

    const sentH2: ReminderResult[] = [];
    const skippedH2: Array<{ id: string; reason: string }> = [];

    // 🔄 Process reminder H-2
    for (const loan of loansH2 ?? []) {
      if (!loan.email || typeof loan.email !== "string") {
        skippedH2.push({
          id: loan.id,
          reason: "Email tidak tersedia",
        });
        continue;
      }

      try {
        const subject = `⏰ Pengingat H-2: Pengembalian Barang - ${loan.kode_unik}`;
        const html = buildReminderH2Html(loan as ReminderLoan);
        const text = buildReminderH2Text(loan as ReminderLoan);

        await resend.emails.send({
          from: resendFrom,
          to: loan.email,
          subject,
          html,
          text,
        });

        sentH2.push({
          id: loan.id,
          type: "h2",
          email: loan.email,
          kode_unik: loan.kode_unik,
          sentAt: new Date().toISOString(),
        });
      } catch (sendError: any) {
        skippedH2.push({
          id: loan.id,
          reason: sendError?.message ?? "Gagal mengirim email",
        });
      }
    }

    // Update database: tandai reminder H-2 sudah dikirim
    if (sentH2.length > 0) {
      const { error: updateErrorH2 } = await supabase
        .from("loans")
        .update({ reminder_h2_sent_at: new Date().toISOString() })
        .in(
          "id",
          sentH2.map((item) => item.id),
        );

      if (updateErrorH2) {
        console.error("❌ Gagal update reminder_h2_sent_at:", updateErrorH2);
      }
    }

    // ========================================================================
    // 2️⃣ REMINDER DEADLINE (hari deadline)
    // ========================================================================
    // Query: ambil loan yang:
    // - status = 'dipinjam'
    // - deadline hari ini (setelah jam 00:00 hari ini, sebelum jam 23:59)
    // - reminder_deadline_sent_at IS NULL (belum dikirim)

    const deadlineStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const deadlineEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const { data: loansDeadline, error: errorDeadline } = await supabase
      .from("loans")
      .select(
        "id,kode_unik,nama,email,nomor_whatsapp,deadline,reminder_h2_sent_at,reminder_deadline_sent_at",
      )
      .eq("status", "dipinjam")
      .gte("deadline", deadlineStart.toISOString())
      .lte("deadline", deadlineEnd.toISOString())
      .is("reminder_deadline_sent_at", null)
      .order("deadline", { ascending: true });

    if (errorDeadline) {
      return NextResponse.json({ error: errorDeadline.message }, { status: 500 });
    }

    const sentDeadline: ReminderResult[] = [];
    const skippedDeadline: Array<{ id: string; reason: string }> = [];

    // 🔄 Process reminder deadline
    for (const loan of loansDeadline ?? []) {
      if (!loan.email || typeof loan.email !== "string") {
        skippedDeadline.push({
          id: loan.id,
          reason: "Email tidak tersedia",
        });
        continue;
      }

      try {
        const subject = `🚨 HARI DEADLINE: Segera Kembalikan Barang - ${loan.kode_unik}`;
        const html = buildReminderDeadlineHtml(loan as ReminderLoan);
        const text = buildReminderDeadlineText(loan as ReminderLoan);

        await resend.emails.send({
          from: resendFrom,
          to: loan.email,
          subject,
          html,
          text,
        });

        sentDeadline.push({
          id: loan.id,
          type: "deadline",
          email: loan.email,
          kode_unik: loan.kode_unik,
          sentAt: new Date().toISOString(),
        });
      } catch (sendError: any) {
        skippedDeadline.push({
          id: loan.id,
          reason: sendError?.message ?? "Gagal mengirim email",
        });
      }
    }

    // Update database: tandai reminder deadline sudah dikirim
    if (sentDeadline.length > 0) {
      const { error: updateErrorDeadline } = await supabase
        .from("loans")
        .update({ reminder_deadline_sent_at: new Date().toISOString() })
        .in(
          "id",
          sentDeadline.map((item) => item.id),
        );

      if (updateErrorDeadline) {
        console.error(
          "❌ Gagal update reminder_deadline_sent_at:",
          updateErrorDeadline,
        );
      }
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary: {
        h2: {
          found: loansH2?.length ?? 0,
          sent: sentH2.length,
          skipped: skippedH2.length,
        },
        deadline: {
          found: loansDeadline?.length ?? 0,
          sent: sentDeadline.length,
          skipped: skippedDeadline.length,
        },
        totalSent: sentH2.length + sentDeadline.length,
      },
      details: {
        h2: {
          sent: sentH2,
          skipped: skippedH2,
        },
        deadline: {
          sent: sentDeadline,
          skipped: skippedDeadline,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Reminder API Error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
