"use client";

import { useEffect, useRef, useState } from "react";
import { getLoanByKode, Loan } from "@/lib/loans";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Image from "next/image";
import { Printer, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import QRCode from "qrcode";
import Link from "next/link";

export default function AdminPrintPage({
  params,
}: {
  params: { kode: string };
}) {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    loadLoan();
  }, []);

  useEffect(() => {
    if (loan && qrCanvasRef.current && origin) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        `${origin}/detail/${loan.kode_unik}`,
        {
          width: 100,
          margin: 1,
          color: { dark: "#1e3a8a", light: "#ffffff" },
          errorCorrectionLevel: "H",
        },
      );
    }
  }, [loan, origin]);

  const loadLoan = async () => {
    try {
      const data = await getLoanByKode(params.kode);
      if (!data) setNotFound(true);
      else setLoan(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (notFound || !loan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600">
          Data tidak ditemukan:{" "}
          <span className="font-mono font-bold">{params.kode}</span>
        </p>
        <Link
          href="/admin/loans"
          className="text-blue-600 hover:underline text-sm"
        >
          ← Kembali ke Daftar
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Print controls - hidden when printing */}
      <div className="no-print fixed top-4 left-4 right-4 z-50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        <Link href="/admin/loans">
          <button className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl shadow hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </Link>
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Cetak / Print
        </button>
      </div>

      {/* Print page */}
      <div className="min-h-screen bg-gray-100 pt-28 sm:pt-20 pb-10 px-4 no-print-bg">
        <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none print:p-0">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
                    <img
                      src="/logounimus.png"
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-black text-lg sm:text-xl tracking-tight">
                      UNIMUS INVENTRACK
                    </p>
                    <p className="text-blue-200 text-xs">
                      Universitas Muhammadiyah Semarang
                    </p>
                  </div>
                </div>
                <p className="text-blue-100 text-xs text-center sm:text-left">
                  Sistem Manajemen Peminjaman Barang Laboratorium
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-xl shadow-lg flex-shrink-0">
                <canvas ref={qrCanvasRef} style={{ display: "block" }} />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {/* Title + Code */}
            <div className="text-center mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-dashed border-blue-100">
              <h2 className="text-lg sm:text-xl font-black text-gray-800 mb-2 sm:mb-3">
                BUKTI PEMINJAMAN BARANG LABORATORIUM
              </h2>
              <div className="inline-block bg-blue-50 border-2 border-blue-200 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl">
                <p className="text-blue-500 text-xs font-semibold uppercase tracking-widest mb-1">
                  Kode Peminjaman
                </p>
                <p className="font-mono text-2xl sm:text-3xl font-black text-blue-700 tracking-wider">
                  {loan.kode_unik}
                </p>
              </div>
            </div>

            {/* Main info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
              {/* Peminjam */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-5 h-px bg-blue-400 inline-block" />
                  DATA PEMINJAM
                </h3>
                <div className="space-y-2.5 text-sm">
                  {[
                    { label: "Nama", value: loan.nama },
                    {
                      label: "Tanggal Lahir",
                      value: format(
                        new Date(loan.tanggal_lahir),
                        "dd MMMM yyyy",
                        { locale: idLocale },
                      ),
                    },
                    { label: "Program Studi", value: loan.prodi },
                    { label: "Jurusan", value: loan.jurusan },
                    { label: "Semester", value: `Semester ${loan.semester}` },
                  ].map((r) => (
                    <div key={r.label} className="flex gap-2">
                      <span className="text-gray-400 w-28 flex-shrink-0">
                        {r.label}
                      </span>
                      <span className="text-gray-800 font-semibold flex-1">
                        : {r.value}
                      </span>
                    </div>
                  ))}
                </div>

                {loan.foto_peminjam_url && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 font-semibold mb-2">
                      FOTO PEMINJAM
                    </p>
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-gray-200">
                      <Image
                        src={loan.foto_peminjam_url}
                        alt={loan.nama}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Barang */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-5 h-px bg-blue-400 inline-block" />
                  DATA BARANG
                </h3>
                <div className="space-y-2.5 text-sm">
                  {[
                    { label: "Nama Barang", value: loan.nama_barang },
                    {
                      label: "Tanggal Pinjam",
                      value:
                        format(
                          new Date(loan.tanggal_pinjam),
                          "dd MMMM yyyy, HH:mm",
                          { locale: idLocale },
                        ) + " WIB",
                    },
                    {
                      label: "Status",
                      value:
                        loan.status === "dipinjam"
                          ? "Sedang Dipinjam"
                          : "Sudah Dikembalikan",
                    },
                    ...(loan.tanggal_kembali
                      ? [
                          {
                            label: "Tgl Kembali",
                            value:
                              format(
                                new Date(loan.tanggal_kembali),
                                "dd MMMM yyyy, HH:mm",
                                { locale: idLocale },
                              ) + " WIB",
                          },
                        ]
                      : []),
                  ].map((r) => (
                    <div key={r.label} className="flex gap-2">
                      <span className="text-gray-400 w-28 flex-shrink-0">
                        {r.label}
                      </span>
                      <span
                        className={`font-semibold flex-1 ${r.label === "Status" ? (loan.status === "dipinjam" ? "text-blue-600" : "text-emerald-600") : "text-gray-800"}`}
                      >
                        : {r.value}
                      </span>
                    </div>
                  ))}
                </div>

                {loan.foto_barang_url && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 font-semibold mb-2">
                      FOTO BARANG
                    </p>
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-gray-200">
                      <Image
                        src={loan.foto_barang_url}
                        alt={loan.nama_barang || "Foto Barang"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl mb-8 text-sm">
              <p className="text-amber-800">
                <strong>📌 Catatan:</strong> Simpan bukti peminjaman ini. QR
                Code dapat dipindai untuk verifikasi status peminjaman secara
                real-time.
              </p>
            </div>

            {/* Signature */}
            <div className="grid grid-cols-2 gap-10">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-16">Peminjam</p>
                <div className="border-t border-gray-800 pt-2">
                  <p className="text-sm font-bold text-gray-700">{loan.nama}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-16">
                  Admin Laboratorium
                </p>
                <div className="border-t border-gray-800 pt-2">
                  <p className="text-sm font-medium text-gray-400">
                    ( ................................ )
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Dicetak:{" "}
                {format(new Date(), "dd MMMM yyyy, HH:mm", {
                  locale: idLocale,
                })}{" "}
                WIB
                {" · "} UIT v2.0 — Unimus Inventrack
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .no-print-bg {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: unset !important;
          }

          #print-area {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Sembunyikan header & sidebar global */
          header,
          nav,
          aside,
          footer,
          [class*="navbar"],
          [class*="sidebar"],
          [class*="header"] {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
