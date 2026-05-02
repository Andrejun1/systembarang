"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell, AlertTriangle, LogOut } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, { title: string; desc: string }> = {
  "/admin/dashboard": { title: "Dashboard", desc: "Ringkasan data peminjaman" },
  "/admin/new": {
    title: "Peminjaman Baru",
    desc: "Tambah data peminjaman baru",
  },
  "/admin/loans": {
    title: "Daftar Peminjaman",
    desc: "Kelola semua peminjaman",
  },
};

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();
  const page = pageTitles[pathname] || {
    title: "Admin",
    desc: "Panel administrations",
  };
  const now = new Date();
  const { showWarning, remainingTime, signOut } = useAuth();

  // Format remaining time as MM:SS
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Inactivity Warning Banner */}
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 backdrop-blur-sm px-4 py-3 flex items-center justify-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-950 flex-shrink-0" />
          <p className="text-amber-950 text-sm font-medium">
            Sesi akan berakhir dalam {formatTime(remainingTime)}. Lakukan
            aktivitas untuk tetap login.
          </p>
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="bg-amber-600 border-amber-700 text-white hover:bg-amber-700 flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </Button>
        </div>
      )}

      <header
        className={`bg-slate-900 border-b border-white/5 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30 ${showWarning ? "mt-12" : ""}`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">
              {page.title}
            </h1>
            <p className="text-white/40 text-xs hidden sm:block">{page.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-white/40 text-xs">
              {format(now, "EEEE, dd MMM yyyy", { locale: idLocale })}
            </p>
            <p className="text-white/70 text-xs font-mono">
              {format(now, "HH:mm")}
            </p>
          </div>
          <div
            className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
            title="Sistem online"
          />
        </div>
      </header>
    </>
  );
}
