"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllLoans, returnLoan, deleteLoanWithFiles } from "@/lib/loans";
import { Loan, LoanItemWithItem } from "@/lib/loans";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistance, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Printer,
  Eye,
  Trash2,
  Loader2,
  Package,
  RefreshCw,
  User,
  Clock,
  Filter,
} from "lucide-react";
import LoanDetailModal from "@/components/admin/LoanDetailModal";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import ReturnConfirmModal from "@/components/admin/ReturnConfirmModal";

type LoanWithItems = Loan & {
  loan_items?: LoanItemWithItem[];
};

export default function AdminLoansPage() {
  const { toast } = useToast();
  const [loans, setLoans] = useState<LoanWithItems[]>([]);
  const [filtered, setFiltered] = useState<LoanWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "dipinjam" | "kembali"
  >("all");
  const [selectedLoan, setSelectedLoan] = useState<LoanWithItems | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<LoanWithItems | null>(
    null,
  );
  const [confirmReturn, setConfirmReturn] = useState<LoanWithItems | null>(
    null,
  );
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadLoans();
    const channel = supabase
      .channel("admin-loans")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loans" },
        () => loadLoans(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    let result = [...loans];
    if (q) {
      result = result.filter(
        (l) =>
          (l.kode_unik ?? "").toLowerCase().includes(q) ||
          (l.nama ?? "").toLowerCase().includes(q) ||
          (l.nama_barang ?? "").toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }
    setFiltered(result);
  }, [loans, searchQuery, statusFilter]);

  const loadLoans = async () => {
    try {
      const data = await getAllLoans();
      setLoans(data as LoanWithItems[]);
    } catch {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loan: LoanWithItems) => {
    setProcessing(loan.id);
    try {
      await returnLoan(loan.id);
      toast({
        title: "✅ Berhasil",
        description: "Barang ditandai sebagai dikembalikan",
      });
      setConfirmReturn(null);
    } catch {
      toast({
        title: "Error",
        description: "Gagal mengembalikan barang",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (loan: LoanWithItems) => {
    // Validasi: Jika barang belum dikembalikan, jangan hapus
    if (loan.status === "dipinjam") {
      toast({
        title: "⚠️ Tidak Bisa Dihapus",
        description:
          "Barang masih dipinjam. Kembalikan barang terlebih dahulu sebelum menghapus data.",
        variant: "destructive",
      });
      setConfirmDelete(null);
      return;
    }

    setProcessing(loan.id);
    try {
      // Hapus dengan file di storage juga
      await deleteLoanWithFiles(
        loan.id,
        loan.foto_peminjam_url,
        loan.foto_barang_url,
      );
      toast({
        title: "🗑 Dihapus",
        description: "Data peminjaman dan foto berhasil dihapus",
      });
      setConfirmDelete(null);
    } catch {
      toast({
        title: "Error",
        description: "Gagal menghapus data",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getDuration = (loan: LoanWithItems) => {
    const end = loan.tanggal_kembali
      ? new Date(loan.tanggal_kembali)
      : new Date();
    return formatDistance(new Date(loan.tanggal_pinjam), end, {
      locale: idLocale,
    });
  };

  // Helper: Hitung total quantity & jenis barang dari loan_items
  const getLoanSummary = (loan: LoanWithItems) => {
    if (!loan.loan_items || loan.loan_items.length === 0) {
      // Fallback ke field legacy (single item)
      return {
        totalJenis: 1,
        totalUnit: loan.quantity ?? 1,
        items: loan.nama_barang
          ? [
              {
                nama_barang: loan.nama_barang,
                quantity: loan.quantity ?? 1,
                kode_barang: null,
              },
            ]
          : [],
      };
    }

    const totalJenis = loan.loan_items.length;
    const totalUnit = loan.loan_items.reduce(
      (acc, item) => acc + (item.quantity || 1),
      0,
    );
    const items = loan.loan_items.map((li) => ({
      nama_barang: li.items?.nama_barang ?? "Unknown",
      quantity: li.quantity ?? 1,
      kode_barang: li.items?.kode_barang ?? null,
    }));

    return { totalJenis, totalUnit, items };
  };

  // Helper: Normalisasi loan untuk passed ke modal (handle nullable fields)
  const normalizeLoanForModal = (loan: LoanWithItems) => ({
    ...loan,
    nama_barang: loan.nama_barang ?? "",
    kode_unik: loan.kode_unik ?? "",
    nama: loan.nama ?? "",
    prodi: loan.prodi ?? "",
    jurusan: loan.jurusan ?? "",
    foto_peminjam_url: loan.foto_peminjam_url ?? null,
    // Pastikan loan_items ikut passed ke modal untuk ditampilkan semua barang
    loan_items: loan.loan_items,
  });

  return (
    <>
      {showDetail && selectedLoan && (
        <LoanDetailModal
          loan={normalizeLoanForModal(selectedLoan)}
          onClose={() => setShowDetail(false)}
        />
      )}
      {confirmDelete && (
        <DeleteConfirmModal
          loan={normalizeLoanForModal(confirmDelete)}
          processing={processing === confirmDelete.id}
          onConfirm={() => handleDelete(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
      {confirmReturn && (
        <ReturnConfirmModal
          loan={normalizeLoanForModal(confirmReturn)}
          processing={processing === confirmReturn.id}
          onConfirm={() => handleReturn(confirmReturn)}
          onClose={() => setConfirmReturn(null)}
        />
      )}

      <div className="space-y-5 max-w-7xl">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Cari kode, nama, atau barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 text-sm transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "dipinjam", "kembali"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  statusFilter === s
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-slate-900 border border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {s === "all"
                  ? "Semua"
                  : s === "dipinjam"
                    ? "Dipinjam"
                    : "Kembali"}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setLoading(true);
              loadLoans();
            }}
            className="w-12 h-12 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Count */}
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <Filter className="w-3.5 h-3.5" />
          <span>
            Menampilkan{" "}
            <span className="text-white font-semibold">{filtered.length}</span>{" "}
            dari {loans.length} data
          </span>
        </div>

        {/* Table / Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-white/5 rounded-2xl">
            <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30">Tidak ada data ditemukan</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {[
                      "Kode",
                      "Peminjam",
                      "Barang",
                      "Tanggal Pinjam",
                      "Durasi",
                      "Status",
                      "Aksi",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-4 text-white/30 text-xs font-semibold uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((loan) => {
                    const { totalJenis, totalUnit, items } =
                      getLoanSummary(loan);

                    return (
                      <tr
                        key={loan.id}
                        className="hover:bg-white/3 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono text-blue-400 text-xs bg-blue-500/10 px-2 py-1 rounded-lg">
                            {loan.kode_unik}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {loan.foto_peminjam_url ? (
                              <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={loan.foto_peminjam_url}
                                  alt={loan.nama ?? "Peminjam"}
                                  width={36}
                                  height={36}
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-blue-400/50" />
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium text-sm">
                                {loan.nama}
                              </p>
                              <p className="text-white/30 text-xs">
                                {loan.prodi} • Sem {loan.semester}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {/* Tampilkan max 2 item, sisanya "+X lagi" */}
                            {items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="text-white/70 text-sm">
                                {item.nama_barang} × {item.quantity}
                              </div>
                            ))}
                            {items.length > 2 && (
                              <div className="text-white/40 text-xs">
                                + {items.length - 2} barang lagi
                              </div>
                            )}
                            <div className="text-blue-400 text-xs font-medium">
                              Total: {totalUnit} unit ({totalJenis} jenis)
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-white/50 text-xs">
                          {format(
                            new Date(loan.tanggal_pinjam),
                            "dd MMM yyyy HH:mm",
                            { locale: idLocale },
                          )}
                        </td>
                        <td className="px-5 py-4 text-white/50 text-xs">
                          {getDuration(loan)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              loan.status === "dipinjam"
                                ? "bg-blue-500/15 text-blue-400"
                                : "bg-emerald-500/15 text-emerald-400"
                            }`}
                          >
                            {loan.status === "dipinjam"
                              ? "Dipinjam"
                              : "Kembali"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setShowDetail(true);
                              }}
                              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/admin/print/${loan.kode_unik}`}
                              target="_blank"
                            >
                              <div
                                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                                title="Print QR"
                              >
                                <Printer className="w-4 h-4" />
                              </div>
                            </Link>
                            {loan.status === "dipinjam" && (
                              <button
                                onClick={() => setConfirmReturn(loan)}
                                disabled={processing === loan.id}
                                className="w-8 h-8 rounded-lg hover:bg-emerald-500/10 flex items-center justify-center text-white/40 hover:text-emerald-400 transition-colors"
                                title="Kembalikan Barang"
                              >
                                {processing === loan.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmDelete(loan)}
                              disabled={processing === loan.id}
                              className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {filtered.map((loan) => {
                const { totalJenis, totalUnit, items } = getLoanSummary(loan);

                return (
                  <div
                    key={loan.id}
                    className="bg-slate-900 border border-white/5 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="font-mono text-blue-400 text-xs bg-blue-500/10 px-2 py-1 rounded-lg">
                          {loan.kode_unik}
                        </span>
                        <p className="text-white font-semibold text-sm mt-1.5">
                          {loan.nama}
                        </p>
                        <p className="text-white/40 text-xs">
                          {loan.prodi} • Sem {loan.semester}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                          loan.status === "dipinjam"
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {loan.status === "dipinjam" ? "Dipinjam" : "Kembali"}
                      </span>
                    </div>
                    <div className="mb-1">
                      <p className="text-white/50 text-sm mb-1">📦 Barang:</p>
                      <div className="space-y-1">
                        {items.slice(0, 2).map((item, idx) => (
                          <p key={idx} className="text-white/70 text-sm">
                            {item.nama_barang} × {item.quantity}
                          </p>
                        ))}
                        {items.length > 2 && (
                          <p className="text-white/40 text-xs">
                            + {items.length - 2} barang lagi
                          </p>
                        )}
                        <p className="text-blue-400 text-xs font-medium">
                          Total: {totalUnit} unit ({totalJenis} jenis)
                        </p>
                      </div>
                    </div>
                    <p className="text-white/30 text-xs mb-3">
                      {format(
                        new Date(loan.tanggal_pinjam),
                        "dd MMM yyyy HH:mm",
                        { locale: idLocale },
                      )}{" "}
                      • {getDuration(loan)}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setShowDetail(true);
                        }}
                        className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detail
                      </button>
                      <Link
                        href={`/admin/print/${loan.kode_unik}`}
                        target="_blank"
                      >
                        <span className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                          <Printer className="w-3.5 h-3.5" /> Print
                        </span>
                      </Link>
                      {loan.status === "dipinjam" && (
                        <button
                          onClick={() => setConfirmReturn(loan)}
                          className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Kembalikan
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete(loan)}
                        className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
