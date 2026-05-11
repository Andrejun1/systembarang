"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createLoanWithItems, generateKodeUnik } from "@/lib/loans";
import { uploadLoanPhoto } from "@/lib/upload";
import { Item } from "@/lib/items";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Camera,
  Upload,
  Loader2,
  Save,
  User,
  Package,
  X,
  Trash2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import CameraCapture from "@/components/admin/CameraCapture";
import { ItemSelect } from "@/components/ui/item-select";

// Type untuk item yang dipilih dalam loan
interface SelectedLoanItem {
  item: Item;
  quantity: number;
}

export default function NewLoanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Array untuk multiple items dengan quantity masing-masing
  const [selectedItems, setSelectedItems] = useState<SelectedLoanItem[]>([]);
  const [tempItem, setTempItem] = useState<Item | null>(null);
  const [tempQuantity, setTempQuantity] = useState(1);

  const [formData, setFormData] = useState({
    nama: "",
    tanggal_lahir: "",
    prodi: "",
    jurusan: "",
    semester: "",
    nomor_whatsapp: "",
    email: "",
    deadline: "",
  });

  const [fotoPeminjam, setFotoPeminjam] = useState<File | null>(null);
  const [fotoBarang, setFotoBarang] = useState<File | null>(null);
  const [previewPeminjam, setPreviewPeminjam] = useState("");
  const [previewBarang, setPreviewBarang] = useState("");

  const [cameraFor, setCameraFor] = useState<"peminjam" | "barang" | null>(
    null,
  );

  const peminjamInputRef = useRef<HTMLInputElement>(null);
  const barangInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "peminjam" | "barang",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "peminjam") {
      setFotoPeminjam(file);
      setPreviewPeminjam(url);
    } else {
      setFotoBarang(file);
      setPreviewBarang(url);
    }
  };

  const handleCameraCapture = (file: File, type: "peminjam" | "barang") => {
    const url = URL.createObjectURL(file);
    if (type === "peminjam") {
      setFotoPeminjam(file);
      setPreviewPeminjam(url);
    } else {
      setFotoBarang(file);
      setPreviewBarang(url);
    }
    setCameraFor(null);
  };

  // Tambah item ke list peminjaman
  const handleAddItem = () => {
    if (!tempItem) {
      toast({
        title: "Validasi Gagal",
        description: "Pilih barang dari katalog terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (tempQuantity < 1) {
      toast({
        title: "Validasi Gagal",
        description: "Jumlah pinjam minimal 1",
        variant: "destructive",
      });
      return;
    }

    if (tempQuantity > tempItem.stok_tersedia) {
      toast({
        title: "Stok Tidak Cukup",
        description: `Stok "${tempItem.nama_barang}" hanya ${tempItem.stok_tersedia}`,
        variant: "destructive",
      });
      return;
    }

    // Cek apakah item sudah ada di list, jika ya update quantity-nya
    const existingIndex = selectedItems.findIndex(
      (si) => si.item.id === tempItem.id,
    );
    if (existingIndex !== -1) {
      const newItems = [...selectedItems];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + tempQuantity,
      };
      // Validasi ulang total quantity vs stok
      if (newItems[existingIndex].quantity > tempItem.stok_tersedia) {
        toast({
          title: "Stok Tidak Cukup",
          description: `Total quantity "${tempItem.nama_barang}" melebihi stok tersedia`,
          variant: "destructive",
        });
        return;
      }
      setSelectedItems(newItems);
    } else {
      setSelectedItems([
        ...selectedItems,
        { item: tempItem, quantity: tempQuantity },
      ]);
    }

    // Reset temp state
    setTempItem(null);
    setTempQuantity(1);
  };

  // Update quantity item yang sudah dipilih
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    const item = selectedItems.find((si) => si.item.id === itemId);
    if (!item) return;

    if (newQuantity < 1) return;
    if (newQuantity > item.item.stok_tersedia) {
      toast({
        title: "Stok Tidak Cukup",
        description: `Maksimal ${item.item.stok_tersedia} unit`,
        variant: "destructive",
      });
      return;
    }

    setSelectedItems(
      selectedItems.map((si) =>
        si.item.id === itemId ? { ...si, quantity: newQuantity } : si,
      ),
    );
  };

  // Hapus item dari list
  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter((si) => si.item.id !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi: minimal 1 item dipilih
    if (selectedItems.length === 0) {
      toast({
        title: "Validasi Gagal",
        description: "Pilih minimal 1 barang untuk dipinjam",
        variant: "destructive",
      });
      return;
    }

    // Validasi stok untuk setiap item (double-check)
    for (const { item, quantity } of selectedItems) {
      if (quantity > item.stok_tersedia) {
        toast({
          title: "Stok Berubah",
          description: `Stok "${item.nama_barang}" tidak mencukupi. Silakan refresh dan coba lagi.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validasi nomor WhatsApp
    if (!formData.nomor_whatsapp || formData.nomor_whatsapp.trim() === "") {
      toast({
        title: "Validasi Gagal",
        description: "Nomor WhatsApp wajib diisi",
        variant: "destructive",
      });
      return;
    }

    // Validasi email
    if (!formData.email || formData.email.trim() === "") {
      toast({
        title: "Validasi Gagal",
        description: "Email peminjam wajib diisi",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast({
        title: "Validasi Gagal",
        description: "Format email tidak valid",
        variant: "destructive",
      });
      return;
    }

    // Validasi format nomor WhatsApp
    const phoneRegex = /^(\+62|0)[0-9]{9,12}$/;
    if (!phoneRegex.test(formData.nomor_whatsapp.replace(/[- ]/g, ""))) {
      toast({
        title: "Validasi Gagal",
        description:
          "Format nomor WhatsApp tidak valid (gunakan format: 08123456789 atau +628123456789)",
        variant: "destructive",
      });
      return;
    }

    // Validasi deadline
    if (!formData.deadline || formData.deadline.trim() === "") {
      toast({
        title: "Validasi Gagal",
        description: "Deadline pengembalian wajib diisi",
        variant: "destructive",
      });
      return;
    }

    // Validasi deadline harus lebih dari hari ini
    const deadlineDate = new Date(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate <= today) {
      toast({
        title: "Validasi Gagal",
        description: "Deadline harus lebih dari hari ini",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Generate satu kode unik untuk grup peminjaman ini
      const groupKode = await generateKodeUnik();

      // Upload foto peminjam (sekali untuk semua item)
      let fotoPeminjamUrl = null;
      if (fotoPeminjam) {
        fotoPeminjamUrl = await uploadLoanPhoto(
          fotoPeminjam,
          groupKode,
          "peminjam",
        );
      }

      // Siapkan array items untuk createLoanWithItems
      const itemsToBorrow = await Promise.all(
        selectedItems.map(async ({ item, quantity }, index) => {
          // Upload foto barang hanya untuk item pertama (opsional)
          let foto_barang_url = null;
          if (index === 0 && fotoBarang) {
            try {
              foto_barang_url = await uploadLoanPhoto(
                fotoBarang,
                `${groupKode}-${item.kode_barang}`,
                "barang",
              );
            } catch (err) {
              console.warn("Warning: Foto barang gagal diunggah:", err);
            }
          }
          return { item, quantity, foto_barang_url };
        }),
      );

      // 👈 Gunakan fungsi baru: createLoanWithItems
      // Fungsi ini sudah handle: create loan + create loan_items + decrease stock
      await createLoanWithItems(
        {
          kode_unik: groupKode,
          nama: formData.nama,
          tanggal_lahir: formData.tanggal_lahir,
          prodi: formData.prodi,
          jurusan: formData.jurusan,
          semester: parseInt(formData.semester),
          nomor_whatsapp: formData.nomor_whatsapp,
          email: formData.email,
          deadline: new Date(formData.deadline).toISOString(),
          foto_peminjam_url: fotoPeminjamUrl,
          status: "dipinjam",
        },
        itemsToBorrow,
      );

      try {
        const response = await fetch("/api/loan-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            nama: formData.nama,
            kode_unik: groupKode,
            deadline: new Date(formData.deadline).toISOString(),
            items: itemsToBorrow.map(({ item, quantity }) => ({
              nama_barang: item.nama_barang,
              quantity,
            })),
          }),
        });
        if (!response.ok) {
          console.warn("Email konfirmasi peminjaman gagal terkirim", await response.text());
        }
      } catch (sendError) {
        console.warn("Email konfirmasi peminjaman gagal terkirim", sendError);
      }

      toast({
        title: "✅ Berhasil!",
        description: `${selectedItems.length} jenis barang (${totalQuantity} unit) dipinjam dengan kode ${groupKode}`,
      });
      router.push("/admin/loans");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Gagal menyimpan data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Hitung total item dan quantity
  const totalItems = selectedItems.length;
  const totalQuantity = selectedItems.reduce((acc, si) => acc + si.quantity, 0);

  return (
    <>
      {cameraFor && (
        <CameraCapture
          type={cameraFor}
          onCapture={(file) => handleCameraCapture(file, cameraFor)}
          onClose={() => setCameraFor(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>

        <form onSubmit={handleSubmit}>
          {/* Data Peminjam */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden mb-5">
            <div className="flex items-center gap-3 p-5 border-b border-white/5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-white font-bold">Data Peminjam</h2>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: "nama",
                    label: "Nama Lengkap",
                    placeholder: "Nama lengkap peminjam",
                    required: true,
                  },
                  {
                    id: "tanggal_lahir",
                    label: "Tanggal Lahir",
                    type: "date",
                    required: true,
                  },
                  {
                    id: "prodi",
                    label: "Program Studi",
                    placeholder: "Contoh: Teknik Informatika",
                    required: true,
                  },
                  {
                    id: "jurusan",
                    label: "Jurusan",
                    placeholder: "Contoh: Teknik",
                    required: true,
                  },
                ].map((f) => (
                  <div key={f.id} className="space-y-1.5">
                    <label
                      htmlFor={f.id}
                      className="text-white/60 text-xs font-semibold uppercase tracking-wide"
                    >
                      {f.label}{" "}
                      {f.required && <span className="text-blue-400">*</span>}
                    </label>
                    <input
                      id={f.id}
                      name={f.id}
                      type={f.type || "text"}
                      placeholder={f.placeholder}
                      value={(formData as any)[f.id]}
                      onChange={handleChange}
                      required={f.required}
                      disabled={loading}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 text-sm transition-all disabled:opacity-50"
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label
                    htmlFor="semester"
                    className="text-white/60 text-xs font-semibold uppercase tracking-wide"
                  >
                    Semester <span className="text-blue-400">*</span>
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/40 text-sm transition-all disabled:opacity-50"
                  >
                    <option value="" className="bg-slate-800">
                      Pilih semester
                    </option>
                    {[...Array(14)].map((_, i) => (
                      <option
                        key={i + 1}
                        value={i + 1}
                        className="bg-slate-800"
                      >
                        Semester {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nomor WhatsApp & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="space-y-1.5">
                  <label
                    htmlFor="nomor_whatsapp"
                    className="text-white/60 text-xs font-semibold uppercase tracking-wide"
                  >
                    Nomor WhatsApp <span className="text-blue-400">*</span>
                  </label>
                  <input
                    id="nomor_whatsapp"
                    name="nomor_whatsapp"
                    type="tel"
                    placeholder="08123456789 atau +628123456789"
                    value={formData.nomor_whatsapp}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 text-sm transition-all disabled:opacity-50"
                  />
                  <p className="text-white/30 text-xs">
                    Format: 08123456789 atau +628123456789
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-white/60 text-xs font-semibold uppercase tracking-wide"
                  >
                    Email Peminjam <span className="text-blue-400">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nama@domain.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 text-sm transition-all disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="deadline"
                    className="text-white/60 text-xs font-semibold uppercase tracking-wide"
                  >
                    Deadline Pengembalian{" "}
                    <span className="text-blue-400">*</span>
                  </label>
                  <input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/40 text-sm transition-all disabled:opacity-50"
                  />
                  <p className="text-white/30 text-xs">
                    Minimal: lebih dari hari ini
                  </p>
                </div>
              </div>

              {/* Foto Peminjam */}
              <div className="space-y-2">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wide">
                  Foto Peminjam
                </label>
                <div className="flex items-start gap-4">
                  {previewPeminjam ? (
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                      <Image
                        src={previewPeminjam}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFotoPeminjam(null);
                          setPreviewPeminjam("");
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setCameraFor("peminjam")}
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 text-blue-400 text-sm font-medium px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" /> Ambil Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => peminjamInputRef.current?.click()}
                      disabled={loading}
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm font-medium px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" /> Upload File
                    </button>
                    <input
                      ref={peminjamInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "peminjam")}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Barang - Multi Item */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden mb-5">
            <div className="flex items-center gap-3 p-5 border-b border-white/5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Package className="w-4 h-4 text-amber-400" />
              </div>
              <h2 className="text-white font-bold">Data Barang</h2>
            </div>
            <div className="p-5 space-y-5">
              {/* Form Tambah Item */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-white/60 text-xs font-semibold uppercase tracking-wide">
                    Pilih Barang <span className="text-blue-400">*</span>
                  </label>
                  <div className="[&_button]:bg-white/5 [&_button]:border-white/10 [&_button]:text-white [&_button:hover]:bg-white/10">
                    <ItemSelect
                      value={tempItem?.id}
                      onChange={(item) => {
                        setTempItem(item);
                        setTempQuantity(1);
                      }}
                      onlyAvailable={true}
                      placeholder="Cari dan pilih barang..."
                      disabled={loading}
                    />
                  </div>
                  {tempItem && (
                    <p className="text-white/40 text-xs mt-1">
                      Stok: {tempItem.stok_tersedia}/{tempItem.stok_total}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/60 text-xs font-semibold uppercase tracking-wide">
                    Jumlah
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTempQuantity((q) => Math.max(1, q - 1))}
                      disabled={loading || tempQuantity <= 1 || !tempItem}
                      className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-50 transition-all flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={tempItem?.stok_tersedia ?? 1}
                      value={tempQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setTempQuantity(
                          Math.min(
                            Math.max(1, val),
                            tempItem?.stok_tersedia ?? 1,
                          ),
                        );
                      }}
                      disabled={loading || !tempItem}
                      className="w-14 text-center bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-blue-500/40 text-sm transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setTempQuantity((q) =>
                          Math.min(tempItem?.stok_tersedia ?? 1, q + 1),
                        )
                      }
                      disabled={
                        loading ||
                        !tempItem ||
                        tempQuantity >= (tempItem?.stok_tersedia ?? 1)
                      }
                      className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-50 transition-all flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                disabled={loading || !tempItem}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/20 text-amber-400 text-sm font-medium px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Tambah ke Peminjaman
              </button>

              {/* List Selected Items */}
              {selectedItems.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-sm">
                      Barang Dipinjam ({totalItems} jenis, {totalQuantity} total
                      unit)
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {selectedItems.map(({ item, quantity }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 bg-white/5 border border-white/10 rounded-xl"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            {item.nama_barang}
                          </p>
                          <p className="text-white/40 text-xs">
                            Kode: {item.kode_barang} • Stok:{" "}
                            {item.stok_tersedia}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(item.id, quantity - 1)
                            }
                            disabled={loading || quantity <= 1}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-50 transition-all flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-white text-sm font-medium">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(item.id, quantity + 1)
                            }
                            disabled={loading || quantity >= item.stok_tersedia}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-50 transition-all flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={loading}
                          className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 text-red-400 disabled:opacity-50 transition-all flex items-center justify-center"
                          title="Hapus dari list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Foto Barang (opsional, untuk dokumentasi) */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wide">
                  Foto Barang (opsional)
                </label>
                <div className="flex items-start gap-4">
                  {previewBarang ? (
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                      <Image
                        src={previewBarang}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFotoBarang(null);
                          setPreviewBarang("");
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setCameraFor("barang")}
                      disabled={loading}
                      className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/20 text-amber-400 text-sm font-medium px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" /> Ambil Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => barangInputRef.current?.click()}
                      disabled={loading}
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm font-medium px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" /> Upload File
                    </button>
                    <input
                      ref={barangInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "barang")}
                      className="hidden"
                    />
                  </div>
                </div>
                <p className="text-white/30 text-xs">
                  Foto akan dilampirkan ke item pertama dalam peminjaman
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/admin/dashboard">
              <button
                type="button"
                disabled={loading}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm font-medium px-6 py-3 rounded-xl transition-all disabled:opacity-50"
              >
                Batal
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading || selectedItems.length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan {totalQuantity} Unit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
