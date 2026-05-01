'use client';

import { usePathname } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const pageTitles: Record<string, { title: string; desc: string }> = {
  '/admin/dashboard': { title: 'Dashboard', desc: 'Ringkasan data peminjaman' },
  '/admin/new': { title: 'Peminjaman Baru', desc: 'Tambah data peminjaman baru' },
  '/admin/loans': { title: 'Daftar Peminjaman', desc: 'Kelola semua peminjaman' },
};

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();
  const page = pageTitles[pathname] || { title: 'Admin', desc: 'Panel administrasi' };
  const now = new Date();

  return (
    <header className="bg-slate-900 border-b border-white/5 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">{page.title}</h1>
          <p className="text-white/40 text-xs hidden sm:block">{page.desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-white/40 text-xs">{format(now, 'EEEE, dd MMM yyyy', { locale: idLocale })}</p>
          <p className="text-white/70 text-xs font-mono">{format(now, 'HH:mm')}</p>
        </div>
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" title="Sistem online" />
      </div>
    </header>
  );
}
