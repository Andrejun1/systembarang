"use client";

import { useEffect, useState } from "react";
import {
  getAllItems,
  createItem,
  updateItem,
  deleteItem,
  generateKodeBarang,
  Item,
  ItemInsert,
} from "@/lib/items";
import { uploadItemPhoto, deleteItemPhoto } from "@/lib/upload";
import { useRealtimeListener } from "@/hooks/use-realtime";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Upload,
  Loader2,
  Package,
  X,
} from "lucide-react";
import Image from "next/image";

// Daftar kategori yang tersedia
const CATEGORIES = [
  "Elektronik",
  "Alat Ukur",
  "Bahan Kimia",
  "Alat Laboratorium",
  "Perlengkapan",
  "Lainnya",
];

export default function ItemsCatalog() {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStok, setFilterStok] = useState<"semua" | "tersedia" | "kosong">(
    "semua",
  );
  const [filterKategori, setFilterKategori] = useState<string>("semua");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const [formData, setFormData] = useState<
    Partial<ItemInsert> & { id?: string }
  >({
    nama_barang: "",
    deskripsi: "",
    kategori: "",
    stok_total: 1,
    barcode: "",
  });

  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string>("");

  useEffect(() => {
    loadItems();
  }, []);

  useRealtimeListener(
    "items",
    () => {
      loadItems();
    },
    { event: "*" },
  );

  const loadItems = async () => {
    try {
      const data = await getAllItems();
      setItems(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Gagal memuat data barang",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kode_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStok === "semua" ||
      (filterStok === "tersedia" && item.stok_tersedia > 0) ||
      (filterStok === "kosong" && item.stok_tersedia === 0);

    const matchesKategori =
      filterKategori === "semua" || item.kategori === filterKategori;

    return matchesSearch && matchesFilter && matchesKategori;
  });

  const handleOpenAdd = async () => {
    const kodeBarang = await generateKodeBarang();
    setFormData({
      kode_barang: kodeBarang,
      nama_barang: "",
      deskripsi: "",
      kategori: "",
      stok_total: 1,
      barcode: "",
    });
    setFotoPreview("");
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (item: Item) => {
    setFormData({
      id: item.id,
      nama_barang: item.nama_barang,
      deskripsi: item.deskripsi,
      kategori: item.kategori,
      stok_total: item.stok_total,
      barcode: item.barcode,
    });
    setFotoPreview(item.foto_url || "");
    setIsEditDialogOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "stok_total" ? parseInt(value) || 0 : value,
    }));
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFoto(true);
    try {
      if (formData.foto_url) {
        await deleteItemPhoto(formData.foto_url);
      }
      const fotoUrl = await uploadItemPhoto(
        file,
        formData.kode_barang || Date.now().toString(),
      );
      setFotoPreview(fotoUrl);
      setFormData((prev) => ({ ...prev, foto_url: fotoUrl }));
      toast({ title: "Berhasil", description: "Foto berhasil diunggah" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Gagal mengunggah foto",
        variant: "destructive",
      });
    } finally {
      setUploadingFoto(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_barang) {
      toast({
        title: "Validasi Gagal",
        description: "Nama barang harus diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      if (formData.id) {
        await updateItem(formData.id, formData);
        toast({ title: "Berhasil", description: "Barang berhasil diperbarui" });
        setIsEditDialogOpen(false);
      } else {
        const kodeBarang = await generateKodeBarang();
        await createItem({
          ...formData,
          kode_barang: formData.kode_barang || kodeBarang,
          nama_barang: formData.nama_barang!,
          stok_total: formData.stok_total || 1,
        });
        toast({
          title: "Berhasil",
          description: "Barang berhasil ditambahkan",
        });
        setIsAddDialogOpen(false);
      }
      await loadItems();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Gagal menyimpan barang",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);

      // ✅ 1. Hapus foto dari Storage/Bucket jika ada
      if (itemToDelete.foto_url) {
        try {
          await deleteItemPhoto(itemToDelete.foto_url);
          console.log("✅ Foto berhasil dihapus dari bucket");
        } catch (storageErr: any) {
          // ⚠️ Log warning tapi lanjutkan hapus database (fail-safe)
          console.warn(
            "⚠️ Gagal menghapus foto dari bucket:",
            storageErr?.message,
          );
          toast({
            title: "Peringatan",
            description:
              "Data terhapus, tetapi foto mungkin masih tersimpan di storage",
            variant: "destructive",
          });
        }
      }

      // ✅ 2. Hapus data dari database
      await deleteItem(itemToDelete.id);

      toast({ title: "Berhasil", description: "Barang berhasil dihapus" });
      await loadItems();
    } catch (err: any) {
      console.error("❌ Delete error:", err);
      toast({
        title: "Error",
        description: err.message || "Gagal menghapus barang",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setItemToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      nama_barang: "",
      deskripsi: "",
      kategori: "",
      stok_total: 1,
      barcode: "",
    });
    setFotoPreview("");
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Katalog Barang
          </h2>
          <p className="text-gray-400 mt-1 text-sm md:text-base">
            Kelola inventori barang laboratorium
          </p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={handleOpenAdd}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Barang
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                Tambah Barang Baru
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Isi form di bawah untuk menambahkan barang ke katalog
              </DialogDescription>
            </DialogHeader>
            <ItemFormDialog
              formData={formData}
              handleInputChange={handleInputChange}
              handleFotoChange={handleFotoChange}
              handleSubmit={handleSubmit}
              fotoPreview={fotoPreview}
              setFotoPreview={setFotoPreview}
              uploadingFoto={uploadingFoto}
              loading={loading}
              isEdit={false}
              setFormData={setFormData}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama barang, kode, atau deskripsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterKategori} onValueChange={setFilterKategori}>
                <SelectTrigger className="w-[160px] bg-gray-700 border-gray-600 text-white">
                  <SelectValue
                    placeholder="Kategori"
                    className="text-gray-300"
                  />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60 overflow-y-auto">
                  <SelectItem
                    value="semua"
                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    Semua Kategori
                  </SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-white hover:bg-gray-700 focus:bg-gray-700"
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterStok}
                onValueChange={(v) => setFilterStok(v as any)}
              >
                <SelectTrigger className="w-[140px] bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Stok" className="text-gray-300" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60 overflow-y-auto">
                  <SelectItem
                    value="semua"
                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    Semua Barang
                  </SelectItem>
                  <SelectItem
                    value="tersedia"
                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    Tersedia
                  </SelectItem>
                  <SelectItem
                    value="kosong"
                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    Stok Habis
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-500 mb-4" />
            <p className="text-gray-400 text-center">
              Tidak ada barang ditemukan
            </p>
            <p className="text-gray-500 text-sm text-center mt-2">
              Coba ubah filter atau tambahkan barang baru
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden hover:shadow-lg hover:shadow-blue-900/20 transition-all bg-gray-800 border-gray-700 flex flex-col"
            >
              {item.foto_url ? (
                <div className="relative h-40 sm:h-48 bg-gray-700">
                  <Image
                    src={item.foto_url}
                    alt={item.nama_barang}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 sm:h-48 bg-gray-700 flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-500" />
                </div>
              )}

              <CardContent className="pt-4 pb-4 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="font-semibold text-base md:text-lg text-white line-clamp-1">
                    {item.nama_barang}
                  </h3>
                  <p className="text-xs text-gray-400">{item.kode_barang}</p>
                  {item.deskripsi && (
                    <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                      {item.deskripsi}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap mt-3">
                  {item.kategori && (
                    <Badge
                      variant="secondary"
                      className="bg-gray-700 text-gray-200 text-xs border-gray-600"
                    >
                      {item.kategori}
                    </Badge>
                  )}
                  {item.stok_tersedia > 0 ? (
                    <Badge className="bg-green-900/50 text-green-300 text-xs border-green-700">
                      {item.stok_tersedia}/{item.stok_total}
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="text-xs bg-red-900/50 border-red-700"
                    >
                      Stok Habis
                    </Badge>
                  )}
                </div>

                {item.barcode && (
                  <div className="text-center text-xs text-gray-400 mt-2 font-mono">
                    {item.barcode}
                  </div>
                )}

                <div className="flex gap-2 pt-4 mt-2 border-t border-gray-700">
                  {/* Edit Button */}
                  <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={(open) => {
                      setIsEditDialogOpen(open);
                      if (!open) resetForm();
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="flex-1 text-xs sm:text-sm bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:text-white"
                      >
                        <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          Edit Barang
                        </DialogTitle>
                      </DialogHeader>
                      <ItemFormDialog
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handleFotoChange={handleFotoChange}
                        handleSubmit={handleSubmit}
                        fotoPreview={fotoPreview}
                        setFotoPreview={setFotoPreview}
                        uploadingFoto={uploadingFoto}
                        loading={loading}
                        isEdit={true}
                        item={item}
                        setFormData={setFormData}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* Delete Button - Simple onClick, triggers global AlertDialog */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setItemToDelete(item)}
                    className="flex-1 text-xs sm:text-sm bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Hapus</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 🔥 GLOBAL DELETE DIALOG - Outside the map loop 🔥 */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={() => setItemToDelete(null)}
      >
        <AlertDialogContent className="w-[95vw] sm:w-full max-w-md bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Hapus Barang?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Anda yakin ingin menghapus "{itemToDelete?.nama_barang}"? Tindakan
              ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Form Dialog Component - Dark Theme
function ItemFormDialog({
  formData,
  handleInputChange,
  handleFotoChange,
  handleSubmit,
  fotoPreview,
  setFotoPreview, // ✅ Ditambahkan sebagai prop
  uploadingFoto,
  loading,
  isEdit,
  setFormData,
}: {
  formData: Partial<ItemInsert> & { id?: string };
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleFotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  fotoPreview: string;
  setFotoPreview: React.Dispatch<React.SetStateAction<string>>; // ✅ Type ditambahkan
  uploadingFoto: boolean;
  loading: boolean;
  isEdit: boolean;
  item?: Item;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ItemInsert>>>;
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="kode_barang" className="text-gray-200">
            Kode Barang
          </Label>
          <Input
            id="kode_barang"
            name="kode_barang"
            value={formData.kode_barang || ""}
            disabled
            className="bg-gray-700 border-gray-600 text-white disabled:opacity-60"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stok_total" className="text-gray-200">
            Stok Total *
          </Label>
          <Input
            id="stok_total"
            name="stok_total"
            type="number"
            min="1"
            value={formData.stok_total || "1"}
            onChange={handleInputChange}
            required
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama_barang" className="text-gray-200">
          Nama Barang *
        </Label>
        <Input
          id="nama_barang"
          name="nama_barang"
          value={formData.nama_barang || ""}
          onChange={handleInputChange}
          required
          placeholder="Masukkan nama barang"
          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deskripsi" className="text-gray-200">
          Deskripsi
        </Label>
        <Textarea
          id="deskripsi"
          name="deskripsi"
          value={formData.deskripsi || ""}
          onChange={handleInputChange}
          placeholder="Deskripsi barang (opsional)"
          rows={3}
          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kategori" className="text-gray-200">
          Kategori
        </Label>
        <Select
          value={formData.kategori || ""}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, kategori: value }))
          }
        >
          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
            <SelectValue
              placeholder="Pilih kategori"
              className="text-gray-300"
            />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 max-h-60 overflow-y-auto">
            {CATEGORIES.map((cat) => (
              <SelectItem
                key={cat}
                value={cat}
                className="text-white hover:bg-gray-700 focus:bg-gray-700"
              >
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode" className="text-gray-200">
          Kode Barang
        </Label>
        <Input
          id="barcode"
          name="barcode"
          value={formData.barcode || ""}
          onChange={handleInputChange}
          placeholder="Masukkan kode barang"
          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-200">Foto Barang</Label>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {fotoPreview && (
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-2 border-gray-600 flex-shrink-0">
              <Image
                src={fotoPreview}
                alt="Preview"
                fill
                className="object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 bg-red-600 hover:bg-red-700 text-white rounded-full p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setFotoPreview("");
                  setFormData((prev) => ({ ...prev, foto_url: undefined }));
                }}
              >
                <X className="h-3 w-3" color="white" />
              </Button>
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              id="foto-input"
              className="hidden"
              disabled={uploadingFoto}
            />
            <label htmlFor="foto-input">
              <Button
                type="button"
                variant="outline"
                asChild
                disabled={uploadingFoto}
                className="w-full sm:w-auto bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                <span>
                  {uploadingFoto ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> Upload Foto
                    </>
                  )}
                </span>
              </Button>
            </label>
            <p className="text-xs text-gray-400 mt-2">
              Format: JPG, PNG, Max 5MB
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-700">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
            </>
          ) : (
            "Simpan"
          )}
        </Button>
      </div>
    </form>
  );
}
