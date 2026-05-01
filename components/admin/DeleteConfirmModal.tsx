'use client';

import { Loan } from '@/lib/supabase/types';
import { Loader2, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({
  loan, processing, onConfirm, onClose,
}: { loan: Loan; processing: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,8,23,0.9)' }}>
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-white font-bold">Hapus Data?</h2>
        </div>
        <p className="text-white/50 text-sm mb-5">
          Data peminjaman <span className="text-white font-semibold">{loan.nama}</span> ({loan.kode_unik}) akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={processing}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm font-medium py-3 rounded-xl transition-all">
            Batal
          </button>
          <button onClick={onConfirm} disabled={processing}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Menghapus...</> : <><Trash2 className="w-4 h-4" /> Hapus</>}
          </button>
        </div>
      </div>
    </div>
  );
}
