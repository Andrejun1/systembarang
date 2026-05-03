"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Plus,
  List,
  X,
  FlaskConical,
  LogOut,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/new", label: "Peminjaman Baru", icon: Plus },
  { href: "/admin/loans", label: "Daftar Peminjaman", icon: List },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside
      className={cn(
        "fixed lg:relative z-50 lg:z-auto flex flex-col w-64 min-h-screen transition-transform duration-300 border-r border-white/5",
        "bg-slate-900",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center">
                <img
                  src="/logounimus.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              Unimus UIT
            </p>
            <p className="text-blue-400/40 text-[10px]">Admin Panel</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-white/50 hover:text-white hover:bg-white/5",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-3 mt-3 border-t border-white/5">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Lihat Halaman Publik
          </Link>
        </div>
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-3 bg-white/5 rounded-xl mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.email?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">Admin</p>
            <p className="text-white/40 text-[10px] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
