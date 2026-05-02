"use client";

import { Loan, LoanItemWithItem } from "@/lib/loans";
import { format, formatDistance } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Image from "next/image";
import {
  X,
  User,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Barcode,
} from "lucide-react";
import { useEffect, useState } from "react";
import QRCodeDisplay from "@/components/public/QRCodeDisplay";
import Link from "next/link";

interface LoanDetailModalProps {
  loan: Loan & { loan_items?: LoanItemWithItem[] };
  onClose: () => void;
}

export default function LoanDetailModal({
  loan,
  onClose,
}: LoanDetailModalProps) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const end = loan.tanggal_kembali
        ? new Date(loan.tanggal_kembali)
        : new Date();
      setElapsed(
        formatDistance(new Date(loan.tanggal_pinjam), end, {
          locale: idLocale,
        }),
      );
    };
    update();
    const t = loan.status === "dipinjam" ? setInterval(update, 1000) : null;
    return () => {
      if (t) clearInterval(t);
    };
  }, [loan]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(2,8,23,0.9)" }}
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-white font-bold">Detail Peminjaman</h2>
            <p className="font-mono text-blue-400/50 text-xs mt-0.5">
              {loan.kode_unik}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status + Duration */}
          <div
            className={`rounded-2xl p-4 flex items-center justify-between ${
              loan.status === "dipinjam"
                ? "bg-blue-500/10 border border-blue-500/20"
                : "bg-emerald-500/10 border border-emerald-500/20"
            }`}
          >
            <div>
              <div
                className={`flex items-center gap-2 mb-1 ${loan.status === "dipinjam" ? "text-blue-400" : "text-emerald-400"}`}
              >
                {loan.status === "dipinjam" ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span className="font-bold text-sm">
                  {loan.status === "dipinjam"
                    ? "Sedang Dipinjam"
                    : "Sudah Dikembalikan"}
                </span>
              </div>
              <p
                className={`text-2xl font-black ${loan.status === "dipinjam" ? "text-blue-300" : "text-emerald-300"}`}
              >
                {elapsed}
              </p>
            </div>
            {loan.status === "dipinjam" && (
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
            )}
          </div>

          {/* Photos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <p className="text-white/40 text-xs font-semibold px-3 py-2 border-b border-white/10 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Foto Peminjam
              </p>
              {loan.foto_peminjam_url ? (
                <div className="relative aspect-square">
                  <Image
                    src={loan.foto_peminjam_url}
                    alt={loan.nama}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center">
                  <User className="w-12 h-12 text-white/10" />
                </div>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <p className="text-white/40 text-xs font-semibold px-3 py-2 border-b border-white/10 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Foto Barang
              </p>
              {loan.foto_barang_url ? (
                <div className="relative aspect-square">
                  <Image
                    src={loan.foto_barang_url}
                    alt={loan.nama_barang ?? ""}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center">
                  <Package className="w-12 h-12 text-white/10" />
                </div>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
            {[
              { icon: User, label: "Nama", value: loan.nama },
              {
                icon: Calendar,
                label: "Tanggal Lahir",
                value: format(new Date(loan.tanggal_lahir), "dd MMMM yyyy", {
                  locale: idLocale,
                }),
              },
              {
                icon: GraduationCap,
                label: "Program Studi",
                value: loan.prodi,
              },
              { icon: BookOpen, label: "Jurusan", value: loan.jurusan },
              {
                icon: BookOpen,
                label: "Semester",
                value: `Semester ${loan.semester}`,
              },
              ...(loan.loan_items && loan.loan_items.length > 0
                ? loan.loan_items.map((item, idx) => ({
                    icon: Package,
                    label: idx === 0 ? "Barang" : `Barang ${idx + 1}`,
                    value: `${item.items?.nama_barang ?? "Unknown"} × ${item.quantity}`,
                  }))
                : [
                    {
                      icon: Package,
                      label: "Nama Barang",
                      value: loan.nama_barang || "-",
                    },
                  ]),
              {
                icon: Calendar,
                label: "Tanggal Pinjam",
                value: format(
                  new Date(loan.tanggal_pinjam),
                  "dd MMM yyyy, HH:mm",
                  { locale: idLocale },
                ),
              },
              ...(loan.tanggal_kembali
                ? [
                    {
                      icon: CheckCircle2,
                      label: "Tanggal Kembali",
                      value: format(
                        new Date(loan.tanggal_kembali),
                        "dd MMM yyyy, HH:mm",
                        { locale: idLocale },
                      ),
                    },
                  ]
                : []),
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3 px-4 py-3"
              >
                <row.icon className="w-4 h-4 text-blue-400/40 flex-shrink-0" />
                <p className="text-white/40 text-xs w-28 flex-shrink-0">
                  {row.label}
                </p>
                <p className="text-white text-sm font-medium flex-1">
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-white/40 text-xs font-semibold flex items-center gap-1.5">
              <Barcode className="w-3.5 h-3.5" /> QR Code
            </p>
            <QRCodeDisplay
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/detail/${loan.kode_unik}`}
              size={150}
            />
            <p className="font-mono text-blue-400/40 text-xs">
              {loan.kode_unik}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href={`/admin/print/${loan.kode_unik}`}
              target="_blank"
              className="flex-1"
            >
              <button className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 text-blue-400 text-sm font-medium py-3 rounded-xl transition-all">
                🖨 Print QR Code
              </button>
            </Link>
            <button
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm font-medium py-3 rounded-xl transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
