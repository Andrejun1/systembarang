"use client";

import { useEffect, useState } from "react";
import {
  getLoanByKode,
  getLoanWithItems,
  Loan,
  LoanItemWithItem,
} from "@/lib/loans";
import { supabase } from "@/lib/supabase/client";
import { format, formatDistance } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  User,
  Calendar,
  Barcode,
  MapPin,
  BookOpen,
  GraduationCap,
  Loader2,
  AlertCircle,
  FlaskConical,
} from "lucide-react";
import QRCodeDisplay from "@/components/public/QRCodeDisplay";

type LoanWithItems = Loan & {
  loan_items?: LoanItemWithItem[];
};

export default function DetailPage({ params }: { params: { kode: string } }) {
  const [loan, setLoan] = useState<LoanWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    loadLoan();
  }, [params.kode]);

  useEffect(() => {
    if (!loan) return;

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

  useEffect(() => {
    if (!loan) return;

    const channel = supabase
      .channel(`loan-${loan.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "loans",
          filter: `id=eq.${loan.id}`,
        },
        (payload) => {
          setLoan(payload.new as LoanWithItems);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loan?.id]);

  const loadLoan = async () => {
    try {
      // Pertama cek apakah ini kode peminjaman atau kode barang
      const data = await getLoanByKode(params.kode);
      if (!data) {
        setNotFound(true);
        return;
      }

      // Load loan dengan items yang sudah di-join
      const loanWithItems = await getLoanWithItems(data.id);
      if (!loanWithItems) {
        setNotFound(true);
        return;
      }
      setLoan(loanWithItems as LoanWithItems);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #020817 0%, #0f1f3d 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          <p className="text-blue-400/60">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (notFound || !loan) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(180deg, #020817 0%, #0f1f3d 100%)",
        }}
      >
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">
            Data Tidak Ditemukan
          </h1>
          <p className="text-blue-400/60 mb-6">
            Kode <span className="font-mono text-blue-300">{params.kode}</span>{" "}
            tidak ditemukan dalam sistem.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  const isDipinjam = loan.status === "dipinjam";

  return (
    <div
      className="min-h-screen pb-16"
      style={{
        background:
          "linear-gradient(180deg, #020817 0%, #0f1f3d 30%, #0f172a 100%)",
      }}
    >
      {/* Header */}
      <header
        className="border-b border-blue-900/30 backdrop-blur-xl sticky top-0 z-40 px-4 py-4"
        style={{ background: "rgba(2, 8, 23, 0.85)" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Kembali</span>
          </Link>
          <div className="flex items-center gap-2">
            <img
                  src="/logounimus.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
            <span className="text-white font-bold text-sm">
              Unimus Inventrack
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-5">
        {/* Title + Status */}
        <div className="text-center mb-6">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-3 ${
              isDipinjam
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {isDipinjam ? (
              <>
                <Clock className="w-4 h-4" /> Sedang Dipinjam
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Sudah Dikembalikan
              </>
            )}
          </span>
          <h1 className="text-white text-3xl font-black mb-1">{loan.nama}</h1>
          <p className="font-mono text-blue-400/60 text-sm">{loan.kode_unik}</p>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-2 gap-4">
          {/* Peminjam photo */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10">
              <p className="text-white/60 text-xs font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Foto Peminjam
              </p>
            </div>
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
              <div className="aspect-square flex items-center justify-center bg-blue-900/20">
                <User className="w-12 h-12 text-blue-400/30" />
              </div>
            )}
          </div>

          {/* Barang photo */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10">
              <p className="text-white/60 text-xs font-semibold flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Foto Barang
              </p>
            </div>
            {loan.foto_barang_url ? (
              <div className="relative aspect-square">
                <Image
                  src={loan.foto_barang_url}
                  alt={loan.nama_barang || "Foto Barang"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center bg-blue-900/20">
                <Package className="w-12 h-12 text-blue-400/30" />
              </div>
            )}
          </div>
        </div>

        {/* Real-time Duration */}
        <div
          className={`rounded-2xl p-5 border ${isDipinjam ? "bg-blue-500/10 border-blue-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/50 text-xs font-medium mb-1">
                ⏱ Lama Peminjaman (Real-time)
              </p>
              <p
                className={`text-3xl font-black ${isDipinjam ? "text-blue-300" : "text-emerald-300"}`}
              >
                {elapsed}
              </p>
            </div>
            {isDipinjam && (
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-white font-bold">Detail Peminjaman</h2>
          </div>
          <div className="divide-y divide-white/5">
            <InfoRow icon={User} label="Nama Peminjam" value={loan.nama} />
            <InfoRow
              icon={GraduationCap}
              label="Program Studi"
              value={loan.prodi}
            />
            <InfoRow icon={BookOpen} label="Jurusan" value={loan.jurusan} />
            <InfoRow
              icon={MapPin}
              label="Semester"
              value={`Semester ${loan.semester}`}
            />
            <InfoRow
              icon={Calendar}
              label="Tanggal Pinjam"
              value={format(
                new Date(loan.tanggal_pinjam),
                "dd MMMM yyyy, HH:mm",
                { locale: idLocale },
              )}
            />
            {loan.tanggal_kembali && (
              <InfoRow
                icon={CheckCircle2}
                label="Tanggal Kembali"
                value={format(
                  new Date(loan.tanggal_kembali),
                  "dd MMMM yyyy, HH:mm",
                  { locale: idLocale },
                )}
              />
            )}
          </div>
        </div>

        {/* Items Dipinjam */}
        {loan.loan_items && loan.loan_items.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Package className="w-4 h-4" />
                Barang yang Dipinjam ({loan.loan_items.length} item)
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {loan.loan_items.map((loanItem, idx) => (
                <div
                  key={loanItem.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex gap-4">
                    {loanItem.foto_barang_url && (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-blue-900/20">
                        <Image
                          src={loanItem.foto_barang_url}
                          alt={loanItem.items?.nama_barang || "Barang"}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">
                        {loanItem.items?.nama_barang || "Unknown"}
                      </p>
                      <p className="text-blue-300/60 text-xs mt-0.5">
                        {loanItem.items?.kode_barang}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                          <Package className="w-3 h-3" />
                          Qty: {loanItem.quantity}
                        </span>
                        {loanItem.items?.kategori && (
                          <span className="inline-flex items-center px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                            {loanItem.items.kategori}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Old single barang display for backward compatibility */}
        {(!loan.loan_items || loan.loan_items.length === 0) &&
          loan.nama_barang && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Barang yang Dipinjam
                </h2>
              </div>
              <div className="p-4">
                <InfoRow
                  icon={Package}
                  label="Nama Barang"
                  value={loan.nama_barang}
                />
              </div>
            </div>
          )}

        {/* QR Code */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3">
          <p className="text-white/60 text-xs font-semibold flex items-center gap-1.5">
            <Barcode className="w-3.5 h-3.5" /> QR Code Peminjaman
          </p>
          <QRCodeDisplay
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/detail/${loan.kode_unik}`}
            size={180}
          />
          <p className="font-mono text-blue-400/60 text-sm">{loan.kode_unik}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-lg bg-blue-900/40 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-400/70" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/40 text-xs">{label}</p>
        <p className="text-white font-medium text-sm truncate">{value}</p>
      </div>
    </div>
  );
}
