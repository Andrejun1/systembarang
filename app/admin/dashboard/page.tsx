"use client";

import { useEffect, useState } from "react";
import { getAllLoans } from "@/lib/loans";
import { getAllItems, getItemsStatistics } from "@/lib/items";
import { Loan } from "@/lib/supabase/types";
import { Item } from "@/lib/items";
import { supabase } from "@/lib/supabase/client";
import { formatDistance, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Package,
  Clock,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
  Loader2,
  BarChart3,
  Activity,
  AlertCircle,
  Box,
  ShoppingCart,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemStats, setItemStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("admin-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loans" },
        () => loadData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        () => loadData(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    try {
      const [loansData, itemsData, itemStatsData] = await Promise.all([
        getAllLoans(),
        getAllItems(),
        getItemsStatistics(),
      ]);
      setLoans(loansData as Loan[]);
      setItems(itemsData);
      setItemStats(itemStatsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    // Loan statistics
    totalLoans: loans.length,
    activeLoans: loans.filter((l) => l.status === "dipinjam").length,
    returnedLoans: loans.filter((l) => l.status === "kembali").length,
    todayLoans: loans.filter((l) => {
      const d = new Date(l.tanggal_pinjam);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    overdueLoans: loans.filter(
      (l) =>
        l.status === "dipinjam" &&
        l.deadline &&
        new Date(l.deadline) < new Date(),
    ).length,
    // Item statistics
    totalItems: itemStats.total || 0,
    availableItems: itemStats.available || 0,
    unavailableItems: itemStats.unavailable || 0,
  };

  const recentLoans = loans.slice(0, 8);
  const overdueLoans = loans
    .filter(
      (l) =>
        l.status === "dipinjam" &&
        l.deadline &&
        new Date(l.deadline) < new Date(),
    )
    .slice(0, 5);

  const statCards = [
    {
      label: "Total Peminjaman",
      value: stats.totalLoans,
      icon: Package,
      color: "blue",
      sub: "Semua waktu",
    },
    {
      label: "Sedang Dipinjam",
      value: stats.activeLoans,
      icon: Clock,
      color: "amber",
      sub: `${stats.overdueLoans} terlambat`,
    },
    {
      label: "Dikembalikan",
      value: stats.returnedLoans,
      icon: CheckCircle2,
      color: "emerald",
      sub: "Selesai",
    },
    {
      label: "Barang Tersedia",
      value: stats.availableItems,
      icon: Box,
      color: "purple",
      sub: `${stats.totalItems} total barang`,
    },
  ];

  const colorMap: Record<
    string,
    { bg: string; border: string; icon: string; text: string }
  > = {
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: "text-blue-400",
      text: "text-blue-300",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: "text-amber-400",
      text: "text-amber-300",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: "text-emerald-400",
      text: "text-emerald-300",
    },
    purple: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      icon: "text-purple-400",
      text: "text-purple-300",
    },
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Quick action */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <span className="text-white/60 text-sm">Overview Sistem</span>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/new"
            className="gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Peminjaman Baru
          </Link>
          <Link
            href="/admin/items"
            className="gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-purple-600/20"
          >
            <Box className="w-4 h-4" />
            Katalog Barang
          </Link>
          <Link
            href="/admin/return"
            className="gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-green-600/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            Pengembalian
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          const c = colorMap[s.color];
          return (
            <div
              key={s.label}
              className={`${c.bg} border ${c.border} rounded-2xl p-5`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${c.icon}`} />
                </div>
                <BarChart3 className={`w-4 h-4 ${c.icon} opacity-30`} />
              </div>
              <p className={`text-3xl font-black ${c.text} mb-1`}>{s.value}</p>
              <p className="text-white font-semibold text-sm">{s.label}</p>
              <p className="text-white/30 text-xs mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Overdue loans alert */}
      {stats.overdueLoans > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-300 font-bold">
                Ada {stats.overdueLoans} Peminjaman Terlambat
              </h3>
              <p className="text-red-200/60 text-sm mt-1">
                Barang-barang berikut sudah melewati deadline pengembalian
              </p>
              <Link
                href="/admin/return"
                className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm mt-3 font-medium"
              >
                Lihat detailnya <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent loans */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent loans - main */}
        <div className="lg:col-span-2 bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <h2 className="text-white font-bold">Peminjaman Terbaru</h2>
            <Link
              href="/admin/loans"
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Lihat semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : recentLoans.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Belum ada data peminjaman</p>
              <Link
                href="/admin/new"
                className="inline-flex mt-4 items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                <Plus className="w-4 h-4" /> Tambah sekarang
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      loan.status === "dipinjam"
                        ? "bg-blue-400"
                        : "bg-emerald-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm truncate">
                        {loan.nama}
                      </p>
                      <span
                        className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          loan.status === "dipinjam"
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {loan.status === "dipinjam" ? "Dipinjam" : "Kembali"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-white/40 text-xs truncate">
                        {loan.nama_barang}
                      </p>
                      <span className="text-white/20 text-xs">•</span>
                      <p className="font-mono text-white/30 text-xs flex-shrink-0">
                        {loan.kode_unik}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-white/40 text-xs">
                      {format(new Date(loan.tanggal_pinjam), "dd MMM yyyy", {
                        locale: idLocale,
                      })}
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {formatDistance(
                        new Date(loan.tanggal_pinjam),
                        new Date(),
                        {
                          addSuffix: true,
                          locale: idLocale,
                        },
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue loans - sidebar */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h2 className="text-white font-bold">
                Terlambat ({stats.overdueLoans})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : overdueLoans.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-white/30 text-sm">
                Tidak ada peminjaman terlambat
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {overdueLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="px-5 py-3 hover:bg-red-500/5 transition-colors"
                >
                  <p className="text-red-400 font-semibold text-sm truncate">
                    {loan.nama_barang}
                  </p>
                  <p className="text-white/40 text-xs mt-1 truncate">
                    {loan.nama}
                  </p>
                  {loan.nomor_whatsapp && (
                    <p className="text-white/30 text-xs mt-1 font-mono truncate">
                      {loan.nomor_whatsapp}
                    </p>
                  )}
                  {loan.deadline && (
                    <p className="text-red-300/70 text-xs mt-2">
                      Terlambat{" "}
                      {formatDistance(new Date(loan.deadline), new Date(), {
                        locale: idLocale,
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
