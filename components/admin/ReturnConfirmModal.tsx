'use client';

import { Loan } from '@/lib/supabase/types';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function ReturnConfirmModal({
  loan, processing, onConfirm, onClose,
}: { loan: Loan; processing: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,8,23,0.9)' }}>
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-white font-bold">Kembalikan Barang?</h2>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5 space-y-1.5">
          <p className="text-white/40 text-xs uppercase tracking-wide font-semibold">Konfirmasi Pengembalian</p>
          <p className="text-white font-semibold">{loan.nama}</p>
          <p className="text-white/50 text-sm">📦 {loan.nama_barang}</p>
          <p className="font-mono text-blue-400/50 text-xs">{loan.kode_unik}</p>
        </div>
        <p className="text-white/40 text-xs mb-5">
          Status akan diubah menjadi <span className="text-emerald-400 font-semibold">Dikembalikan</span> dan tanggal kembali akan dicatat otomatis.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm font-medium py-3 rounded-xl transition-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {processing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
              : <><CheckCircle2 className="w-4 h-4" /> Konfirmasi</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
