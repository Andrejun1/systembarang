"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllLoans } from "@/lib/loans";
import { getAvailableItems, Item } from "@/lib/items";
import { Loan } from "@/lib/supabase/types";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  FlaskConical,
  Scan,
  ArrowRight,
  Shield,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import BarcodeScannerModal from "@/components/public/BarcodeScannerModal";
import LoanCard from "@/components/public/LoanCard";
import StatsCard from "@/components/public/StatsCard";

type ActiveTab = "katalog" | "riwayat";

export default function PublicHomePage() {
  // ===== STATE =====
  const [activeTab, setActiveTab] = useState<ActiveTab>("katalog");

  // Data Loans
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loanSearchQuery, setLoanSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "dipinjam" | "kembali"
  >("all");

  // Data Catalog
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);
  const [filteredCatalogItems, setFilteredCatalogItems] = useState<Item[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // UI State
  const [showScanner, setShowScanner] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // ===== LOAD FUNCTIONS =====
  const loadLoans = async () => {
    try {
      const data = await getAllLoans();
      setLoans(data as Loan[]);
    } catch (error) {
      console.error("Error loading loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogItems = async () => {
    try {
      const data = await getAvailableItems();
      setCatalogItems(data);
    } catch (error) {
      console.error("Error loading catalog:", error);
    } finally {
      setCatalogLoading(false);
    }
  };

  // ===== REALTIME SETUP =====
  const setupRealtime = () => {
    const channel = supabase.channel("public-loans-realtime");

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "loans" },
      async () => {
        await Promise.all([loadLoans(), loadCatalogItems()]);
      },
    );

    channel.subscribe((status: string) => {
      if (status === "SUBSCRIBED") console.log("✅ Realtime active");
      if (status === "CHANNEL_ERROR") console.error("❌ Realtime error");
    });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // ===== FILTER LOANS =====
  const filterLoans = useCallback(() => {
    let filtered = [...loans];
    if (loanSearchQuery.trim()) {
      const q = loanSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.kode_unik.toLowerCase().includes(q) ||
          l.nama.toLowerCase().includes(q) ||
          l.nama_barang.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }
    setFilteredLoans(filtered);
  }, [loans, loanSearchQuery, statusFilter]);

  // ===== FILTER CATALOG =====
  const filterCatalogItems = useCallback(() => {
    let filtered = [...catalogItems];

    // Search filter
    if (catalogSearchQuery.trim()) {
      const q = catalogSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nama_barang.toLowerCase().includes(q) ||
          item.kode_barang.toLowerCase().includes(q) ||
          item.deskripsi?.toLowerCase().includes(q) ||
          item.kategori?.toLowerCase().includes(q),
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.kategori === categoryFilter);
    }

    setFilteredCatalogItems(filtered);
  }, [catalogItems, catalogSearchQuery, categoryFilter]);

  // ===== GET UNIQUE CATEGORIES =====
  const categories = Array.from(
    new Set(catalogItems.map((item) => item.kategori).filter(Boolean)),
  );

  // ===== SCAN HANDLER =====
  const handleScanResult = (kode: string) => {
    setShowScanner(false);
    window.location.href = `/detail/${kode}`;
  };

  // ===== STATS =====
  const stats = {
    total: loans.length,
    active: loans.filter((l) => l.status === "dipinjam").length,
    returned: loans.filter((l) => l.status === "kembali").length,
    today: loans.filter((l) => {
      const d = new Date(l.tanggal_pinjam);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
  };

  // ===== EFFECTS =====
  useEffect(() => {
    loadLoans();
    loadCatalogItems();

    const cleanupRealtime = setupRealtime();

    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(timer);
      cleanupRealtime();
    };
  }, []);

  useEffect(() => {
    filterLoans();
  }, [filterLoans]);

  useEffect(() => {
    filterCatalogItems();
  }, [filterCatalogItems]);

  // ===== RENDER =====
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #020817 0%, #0f1f3d 30%, #0f172a 100%)",
      }}
    >
      {/* Header */}
      <header
        className="border-b border-blue-900/30 backdrop-blur-xl sticky top-0 z-40"
        style={{ background: "rgba(2, 8, 23, 0.85)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center">
                <img
                  src="/logounimus.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-white font-bold text-lg tracking-tight">
                  Unimus <span className="text-blue-400">Inventrack</span>
                </span>
                <p className="text-[10px] text-blue-400/70 -mt-0.5 hidden sm:block">
                  Sistem Peminjaman Laboratorium
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-blue-400/60 text-xs">
                  {currentTime
                    ? format(currentTime, "EEEE, dd MMMM yyyy", {
                        locale: idLocale,
                      })
                    : "Memuat..."}
                </p>
                <p className="text-white font-mono text-sm font-medium">
                  {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
                </p>
              </div>
              <Link
                href="/login"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            Sistem <span className="text-gradient">Peminjaman</span>
            <br />
            Barang Laboratorium
          </h1>
          <p className="text-blue-200/60 text-lg max-w-2xl mx-auto mb-10">
            Universitas Muhammadiyah Semarang — Pantau status peminjaman secara
            real-time
          </p>

          {/* Quick Scan Button */}
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setShowScanner(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-medium transition-all duration-200 shadow-lg shadow-blue-600/20"
            >
              <Scan className="w-5 h-5" />
              <span>Scan QR Code</span>
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Peminjaman"
            value={stats.total}
            icon={Package}
            color="blue"
          />
          <StatsCard
            label="Sedang Dipinjam"
            value={stats.active}
            icon={Clock}
            color="amber"
          />
          <StatsCard
            label="Sudah Kembali"
            value={stats.returned}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatsCard
            label="Hari Ini"
            value={stats.today}
            icon={TrendingUp}
            color="purple"
          />
        </div>
      </section>

      {/* TABS NAVIGATION */}
      <section className="px-4 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("katalog")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                activeTab === "katalog"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-blue-300/70 hover:bg-white/5 hover:text-blue-300"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Katalog Barang</span>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {catalogItems.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("riwayat")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                activeTab === "riwayat"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-blue-300/70 hover:bg-white/5 hover:text-blue-300"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Riwayat Peminjaman</span>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {loans.length}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* TAB CONTENT */}
      <section className="px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* ===== TAB 1: KATALOG BARANG ===== */}
          {activeTab === "katalog" && (
            <div className="space-y-6">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <input
                    type="text"
                    placeholder="Cari barang, kode, atau kategori..."
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-blue-300/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all duration-200"
                  />
                </div>

                {/* ✅ Category Filter - Fixed */}
                {categories.length > 0 && (
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
                  >
                    <option value="all" className="bg-slate-800">
                      Semua Kategori
                    </option>
                    {categories.map((cat) => (
                      <option
                        key={cat}
                        value={cat as string} // ✅ Type assertion
                        className="bg-slate-800"
                      >
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Items Grid */}
              {catalogLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10"
                    />
                  ))}
                </div>
              ) : filteredCatalogItems.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                  <Package className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
                  <p className="text-blue-300/70 text-lg font-medium">
                    Tidak ada barang ditemukan
                  </p>
                  <p className="text-blue-400/40 text-sm mt-1">
                    {catalogSearchQuery
                      ? "Coba kata kunci lain"
                      : "Belum ada barang tersedia"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredCatalogItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/detail/${item.kode_barang}`}
                      className="group block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="relative h-36 bg-gray-800/50">
                        {item.foto_url ? (
                          <Image
                            src={item.foto_url}
                            alt={item.nama_barang}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-blue-400/40" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-green-500/90 text-white text-xs font-bold rounded-full">
                            {item.stok_tersedia} tersedia
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold text-sm line-clamp-1">
                          {item.nama_barang}
                        </h3>
                        <p className="text-blue-300/60 text-xs mt-0.5">
                          {item.kode_barang}
                        </p>

                        {/* ✅ Safe render kategori */}
                        {item.kategori && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded-full">
                            {item.kategori}
                          </span>
                        )}

                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-blue-300/50 mb-1">
                            <span>Ketersediaan</span>
                            <span>
                              Sisa: {item.stok_tersedia} dari {item.stok_total}
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                              style={{
                                width: `${item.stok_total > 0 ? (item.stok_tersedia / item.stok_total) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[10px] text-blue-300/70">
                            Total: {item.stok_total}
                          </span>
                          <span className="flex items-center gap-1 text-blue-400 text-xs font-medium group-hover:gap-2 transition-all">
                            Detail <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Info */}
              {filteredCatalogItems.length > 0 && (
                <div className="text-center text-blue-300/50 text-sm">
                  Menampilkan {filteredCatalogItems.length} dari{" "}
                  {catalogItems.length} barang
                </div>
              )}
            </div>
          )}

          {/* ===== TAB 2: RIWAYAT PEMINJAMAN ===== */}
          {activeTab === "riwayat" && (
            <div className="space-y-6">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <input
                    type="text"
                    placeholder="Cari kode peminjaman, nama, atau barang..."
                    value={loanSearchQuery}
                    onChange={(e) => setLoanSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-blue-300/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all duration-200"
                  />
                </div>
                <div className="flex gap-2">
                  {(["all", "dipinjam", "kembali"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        statusFilter === s
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "bg-white/5 text-blue-300/70 border border-white/10 hover:bg-white/10"
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
              </div>

              {/* Loans Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-48 rounded-2xl bg-white/5 animate-pulse border border-white/10"
                    />
                  ))}
                </div>
              ) : filteredLoans.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                  <Clock className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
                  <p className="text-blue-300/70 text-lg font-medium">
                    Tidak ada data peminjaman
                  </p>
                  <p className="text-blue-400/40 text-sm mt-1">
                    {loanSearchQuery
                      ? "Coba kata kunci lain"
                      : "Belum ada peminjaman tercatat"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLoans.map((loan, i) => (
                    <LoanCard key={loan.id} loan={loan as any} index={i} />
                  ))}
                </div>
              )}

              {/* Info */}
              {filteredLoans.length > 0 && (
                <div className="text-center text-blue-300/50 text-sm">
                  Menampilkan {filteredLoans.length} dari {loans.length}{" "}
                  peminjaman
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScannerModal
          onResult={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
