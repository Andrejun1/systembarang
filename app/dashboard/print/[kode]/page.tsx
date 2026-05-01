'use client';

import { useEffect, useState } from 'react';
import { getLoanByKode } from '@/lib/loans';
import { Loan } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Image from 'next/image';

export default function PrintPage({ params }: { params: { kode: string } }) {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoan();
  }, []);

  const loadLoan = async () => {
    try {
      const data = await getLoanByKode(params.kode);
      setLoan(data);
    } catch (error) {
      console.error('Error loading loan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Data peminjaman tidak ditemukan</p>
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(loan.kode_unik)}`;

  return (
    <>
      <div className="print:hidden fixed top-4 right-4 z-50">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="mr-2 h-4 w-4" />
          Cetak
        </Button>
      </div>

      <div className="min-h-screen bg-white p-8 print:p-0">
        <div className="max-w-4xl mx-auto bg-white print:shadow-none shadow-lg rounded-lg overflow-hidden border-2 border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">UNIMUS INVENTRACK</h1>
                <p className="text-sm text-blue-100 mt-1">
                  Universitas Muhammadiyah Semarang
                </p>
                <p className="text-xs text-blue-200 mt-1">
                  Sistem Manajemen Peminjaman Barang Laboratorium
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <Image
                  src={qrCodeUrl}
                  alt="QR Code"
                  width={120}
                  height={120}
                  className="rounded"
                />
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="text-center mb-6 pb-4 border-b-2 border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                BUKTI PEMINJAMAN BARANG
              </h2>
              <div className="inline-block bg-blue-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-600">Kode Peminjaman</p>
                <p className="text-2xl font-bold text-blue-700 font-mono">
                  {loan.kode_unik}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                    Data Peminjam
                  </h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-32 text-sm text-gray-600">Nama</span>
                      <span className="flex-1 text-sm font-medium">: {loan.nama}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-sm text-gray-600">Tanggal Lahir</span>
                      <span className="flex-1 text-sm font-medium">
                        : {format(new Date(loan.tanggal_lahir), 'dd MMMM yyyy', { locale: idLocale })}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-sm text-gray-600">Program Studi</span>
                      <span className="flex-1 text-sm font-medium">: {loan.prodi}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-sm text-gray-600">Jurusan</span>
                      <span className="flex-1 text-sm font-medium">: {loan.jurusan}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-sm text-gray-600">Semester</span>
                      <span className="flex-1 text-sm font-medium">: {loan.semester}</span>
                    </div>
                  </div>
                </div>

                {loan.foto_peminjam_url && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">
                      Foto Peminjam
                    </h4>
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={loan.foto_peminjam_url}
                        alt="Foto Peminjam"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                    Data Barang
                  </h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-32 text-sm text-gray-600">Nama Barang</span>
                      <span className="flex-1 text-sm font-medium">: {loan.nama_barang}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-sm text-gray-600">Tanggal Pinjam</span>
                      <span className="flex-1 text-sm font-medium">
                        : {format(new Date(loan.tanggal_pinjam), 'dd MMMM yyyy, HH:mm', { locale: idLocale })} WIB
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-sm text-gray-600">Status</span>
                      <span className="flex-1 text-sm font-medium">
                        : <span className={loan.status === 'dipinjam' ? 'text-blue-600' : 'text-green-600'}>
                          {loan.status === 'dipinjam' ? 'Sedang Dipinjam' : 'Sudah Dikembalikan'}
                        </span>
                      </span>
                    </div>
                    {loan.tanggal_kembali && (
                      <div className="flex">
                        <span className="w-32 text-sm text-gray-600">Tanggal Kembali</span>
                        <span className="flex-1 text-sm font-medium">
                          : {format(new Date(loan.tanggal_kembali), 'dd MMMM yyyy, HH:mm', { locale: idLocale })} WIB
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {loan.foto_barang_url && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">
                      Foto Barang
                    </h4>
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={loan.foto_barang_url}
                        alt="Foto Barang"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t-2 border-gray-200 pt-6 mt-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Catatan:</strong> Simpan bukti peminjaman ini dengan baik.
                  QR Code dapat digunakan untuk verifikasi peminjaman.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 mt-8">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-16">Peminjam</p>
                  <div className="border-t border-gray-900 pt-2">
                    <p className="text-sm font-medium">{loan.nama}</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-16">Admin Laboratorium</p>
                  <div className="border-t border-gray-900 pt-2">
                    <p className="text-sm font-medium">( ............................ )</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
              <p>Dicetak pada: {format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: idLocale })} WIB</p>
              <p className="mt-1">UIT - Unimus Inventrack v1.0</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
