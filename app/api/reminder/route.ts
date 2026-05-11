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

type ReminderLoan = {
  id: string;
  kode_unik: string;
  nama: string;
  email: string | null;
  nomor_whatsapp: string;
  deadline: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildReminderHtml(loan: ReminderLoan) {
  return `
    <html>
      <body style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f6f8fb; margin:0; padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px; margin:0 auto; padding:24px; background:#ffffff; border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,.08);">
          <tr>
            <td style="padding-bottom:24px; text-align:center;">
              <h1 style="margin:0; font-size:26px; color:#0f172a;">Pengingat Pengembalian Barang</h1>
              <p style="margin:8px 0 0; color:#475569; font-size:15px; line-height:1.6;">Halo ${loan.nama}, ini adalah pengingat untuk pengembalian peminjaman laboratorium Anda.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0;">
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:20px;">
                <p style="margin:0 0 12px; color:#334155; font-size:14px; font-weight:600;">Detail Peminjaman</p>
                <p style="margin:0; color:#475569; font-size:14px;"><strong>Kode Peminjaman:</strong> ${loan.kode_unik}</p>
                <p style="margin:8px 0 0; color:#475569; font-size:14px;"><strong>Nama:</strong> ${loan.nama}</p>
                <p style="margin:8px 0 0; color:#475569; font-size:14px;"><strong>Deadline Pengembalian:</strong> ${formatDateTime(loan.deadline)}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <p style="color:#334155; font-size:15px; line-height:1.75;">
                Mohon pastikan barang yang Anda pinjam dikembalikan tepat waktu. Jika Anda sudah menjadwalkan pengembalian, terima kasih. Jika belum, silakan hubungi admin laboratorium untuk konfirmasi.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 0; text-align:center;">
              <a href="mailto:${loan.email}" style="background:#2563eb; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:12px; display:inline-block; font-weight:600;">Hubungi Admin</a>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin:0; color:#94a3b8; font-size:13px; line-height:1.6;">Jika Anda telah mengembalikan barang, abaikan pesan ini.</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildReminderText(loan: ReminderLoan) {
  return `Pengingat Pengembalian Barang\n\nKode Peminjaman: ${loan.kode_unik}\nNama: ${loan.nama}\nDeadline Pengembalian: ${formatDateTime(loan.deadline)}\n\nMohon kembalikan barang tepat waktu atau hubungi admin jika perlu perpanjangan.`;
}

export async function GET() {
  const now = new Date();
  const soon = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const supabase = createSupabaseClient();
  const resend = createResendClient();

  if (!supabase || !resend) {
    return NextResponse.json(
      {
        error:
          "REMINDER_API_KEY and Supabase configuration are required to run this endpoint.",
      },
      { status: 503 },
    );
  }

  const query = await supabase
    .from("loans")
    .select("id,kode_unik,nama,email,nomor_whatsapp,deadline")
    .eq("status", "dipinjam")
    .is("reminder_sent_at", null)
    .gte("deadline", now.toISOString())
    .lte("deadline", soon.toISOString())
    .order("deadline", { ascending: true });

  const { data: loans, error } = query as {
    data: ReminderLoan[] | null;
    error: any;
  };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sent: Array<{ id: string; email: string; kode_unik: string }> = [];
  const skipped: Array<{ id: string; email: string | null; reason: string }> =
    [];

  for (const loan of loans ?? []) {
    if (!loan.email || typeof loan.email !== "string") {
      skipped.push({
        id: loan.id,
        email: loan.email,
        reason: "Email tidak tersedia",
      });
      continue;
    }

    const subject = `Pengingat Pengembalian Barang - ${loan.kode_unik}`;
    const html = buildReminderHtml(loan);
    const text = buildReminderText(loan);

    try {
      await resend.emails.send({
        from: resendFrom,
        to: loan.email,
        subject,
        html,
        text,
      });
      sent.push({ id: loan.id, email: loan.email, kode_unik: loan.kode_unik });
    } catch (sendError: any) {
      skipped.push({
        id: loan.id,
        email: loan.email,
        reason: sendError?.message ?? "Gagal mengirim email",
      });
    }
  }

  if (sent.length > 0) {
    const { error: updateError } = await supabase
      .from("loans")
      .update({ reminder_sent_at: new Date().toISOString() })
      .in(
        "id",
        sent.map((item) => item.id),
      );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    totalFound: loans?.length ?? 0,
    sent,
    skipped,
  });
}
