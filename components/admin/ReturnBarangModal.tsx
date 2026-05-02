"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  returnLoan,
  getLoanByKode,
  updateLoan,
  getAllLoans,
} from "@/lib/loans";
import { increaseStock, getItemByBarcode } from "@/lib/items";
import { useRealtimeListener } from "@/hooks/use-realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  Clock,
  User,
  Phone,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import BarcodeScannerModal from "@/components/public/BarcodeScannerModal";
import Image from "next/image";

interface LoanWithDetails {
  id: string;
  kode_unik: string;
  nama: string;
  nomor_whatsapp: string;
  nama_barang: string;
  deadline: string;
  status: "dipinjam" | "kembali";
  tanggal_pinjam: string;
  tanggal_kembali: string | null;
  foto_peminjam_url: string | null;
  foto_barang_url: string | null;
  item_id: string | null;
}

export default function ReturnBarangModal() {
  const router = useRouter();
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Track last scanned code to prevent duplicates
  const lastScannedRef = useRef<{ code: string; timestamp: number } | null>(
    null,
  );

  const loadLoans = useCallback(async () => {
    try {
      const data = await getAllLoans();
      // Filter hanya yang masih dipinjam (belum dikembalikan)
      const activeLoans = data.filter(
        (l) => l.status === "dipinjam",
      ) as LoanWithDetails[];
      setLoans(activeLoans);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Gagal memuat data peminjaman",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  // Subscribe to realtime updates with optimization
  useRealtimeListener("loans", () => {
    loadLoans();
  }, { event: "*" });

  const handleScanResult = async (kodeBarang: string) => {
    // Prevent duplicate scans within 2 seconds
    const now = Date.now();
    if (
      lastScannedRef.current &&
      lastScannedRef.current.code === kodeBarang &&
      now - lastScannedRef.current.timestamp < 2000
    ) {
      return;
    }
    lastScannedRef.current = { code: kodeBarang, timestamp: now };

    setShowScanner(false);
    setLoading(true);

    try {
      // First try to find loan by kode (UIT code)
      let loan = await getLoanByKode(kodeBarang);

      // If not found, try to find item by barcode (LAB code)
      if (!loan && kodeBarang.startsWith("LAB")) {
        const item = await getItemByBarcode(kodeBarang);
        if (item && item.id) {
          // Find loan with this item_id that is still borrowed
          const loanForItem = loans.find(
            (l) => l.item_id === item.id && l.status === "dipinjam",
          );
          if (loanForItem) {
            loan = loanForItem as any;
          }
        }
      }

      if (!loan) {
        toast({
          title: "Peminjaman Tidak Ditemukan",
          description: `Kode "${kodeBarang}" tidak ditemukan atau sudah dikembalikan.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (loan.status === "kembali") {
        toast({
          title: "Sudah Dikembalikan",
          description: `Barang ini sudah dikembalikan pada ${format(
            new Date(loan.tanggal_kembali!),
            "dd MMM yyyy HH:mm",
            { locale: idLocale },
          )}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Automatically process the return without showing dialog
      setIsReturning(true);
      try {
        // 1. Update loan status to 'kembali'
        await returnLoan(loan.id);

        // 2. Increase stock if item_id exists
        if (loan.item_id) {
          await increaseStock(loan.item_id, 1);
        }

        // 3. Reload loans
        await loadLoans();

        toast({
          title: "Berhasil!",
          description: `Barang "${loan.nama_barang}" berhasil dikembalikan.`,
        });

        setSelectedLoan(null);
        setShowConfirmDialog(false);
      } catch (err: any) {
        console.error(err);
        toast({
          title: "Error",
          description: err.message || "Gagal memproses pengembalian",
          variant: "destructive",
        });
      } finally {
        setIsReturning(false);
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Gagal memproses scan barcode",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!selectedLoan) return;

    setIsReturning(true);
    try {
      // 1. Update loan status to 'kembali'
      await returnLoan(selectedLoan.id);

      // 2. Increase stock if item_id exists
      if (selectedLoan.item_id) {
        await increaseStock(selectedLoan.item_id, 1);
      }

      // 3. Reload loans
      await loadLoans();

      toast({
        title: "Berhasil!",
        description: `Barang "${selectedLoan.nama_barang}" berhasil dikembalikan.`,
      });

      setShowConfirmDialog(false);
      setSelectedLoan(null);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Gagal memproses pengembalian",
        variant: "destructive",
      });
    } finally {
      setIsReturning(false);
    }
  };

  const isOverdue = selectedLoan
    ? new Date(selectedLoan.deadline) < new Date()
    : false;

  return (
    <div className="space-y-6 min-h-screen bg-slate-950 p-6">
      {/* Scan Modal */}
      {showScanner && (
        <BarcodeScannerModal
          onResult={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">
            Pengembalian Barang
          </h2>
          <p className="text-gray-400 mt-1">
            Kelola pengembalian barang yang sedang dipinjam
          </p>
        </div>
        <Button
          onClick={() => setShowScanner(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <QrCode className="mr-2 h-4 w-4" />
          Scan QR Code
        </Button>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Konfirmasi Pengembalian</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {selectedLoan && (
                <div className="space-y-4 mt-4">
                  {selectedLoan.foto_barang_url && (
                    <div className="relative h-40 bg-slate-800 rounded-lg overflow-hidden">
                      <Image
                        src={selectedLoan.foto_barang_url}
                        alt={selectedLoan.nama_barang}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Barang
                        </p>
                        <p className="text-sm text-gray-400">
                          {selectedLoan.nama_barang}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Peminjam
                        </p>
                        <p className="text-sm text-gray-400">
                          {selectedLoan.nama}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          WhatsApp
                        </p>
                        <p className="text-sm text-gray-400">
                          {selectedLoan.nomor_whatsapp}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Dipinjam{" "}
                          {formatDistanceToNow(
                            new Date(selectedLoan.tanggal_pinjam),
                            {
                              addSuffix: true,
                              locale: idLocale,
                            },
                          )}
                        </p>
                        <p className="text-sm text-gray-400">
                          Deadline:{" "}
                          {format(
                            new Date(selectedLoan.deadline),
                            "dd MMM yyyy HH:mm",
                            {
                              locale: idLocale,
                            },
                          )}
                        </p>
                        {isOverdue && (
                          <Badge className="mt-2 bg-red-900/50 text-red-300 border-red-800">
                            Terlambat{" "}
                            {formatDistanceToNow(
                              new Date(selectedLoan.deadline),
                              {
                                locale: idLocale,
                              },
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-300">
                      Status: Siap Dikembalikan
                    </p>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel disabled={isReturning} className="bg-slate-800 text-gray-300 hover:bg-slate-700">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReturn}
              disabled={isReturning}
              className="bg-green-600 hover:bg-green-700"
            >
              {isReturning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Kembalikan
                </>
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Active Loans List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Barang Sedang Dipinjam ({loans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : loans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <CheckCircle2 className="h-12 w-12 mb-3 text-green-500" />
              <p>Semua barang sudah dikembalikan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => {
                const isLate = new Date(loan.deadline) < new Date();
                return (
                  <div
                    key={loan.id}
                    className={`p-4 border rounded-lg transition-all ${
                      isLate
                        ? "border-red-900/50 bg-red-950/30"
                        : "border-slate-700 hover:border-blue-600 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-white">
                          {loan.nama_barang}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {loan.nama} • {loan.nomor_whatsapp}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
                            {loan.kode_unik}
                          </Badge>
                          {isLate && (
                            <Badge className="bg-red-900/50 text-red-300 border-red-800 text-xs">
                              Terlambat
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setShowConfirmDialog(true);
                        }}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Kembalikan
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}