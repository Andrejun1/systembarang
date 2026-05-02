"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getAvailableItems, searchItems, Item } from "@/lib/items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemSelectProps {
  value?: string;
  onChange: (item: Item | null) => void;
  onlyAvailable?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ItemSelect({
  value,
  onChange,
  onlyAvailable = true,
  placeholder = "Pilih barang...",
  disabled = false,
}: ItemSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load items on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const data = onlyAvailable ? await getAvailableItems() : [];
        setItems(data);
      } catch (err) {
        console.error("Error loading items:", err);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, [onlyAvailable]);

  // Filter items based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredItems(items);
    } else {
      const query = search.toLowerCase();
      const filtered = items.filter(
        (item) =>
          item.nama_barang.toLowerCase().includes(query) ||
          item.kode_barang.toLowerCase().includes(query) ||
          item.deskripsi?.toLowerCase().includes(query)
      );
      setFilteredItems(filtered);
    }
  }, [search, items]);

  // Handle selection
  const handleSelect = useCallback(
    (item: Item) => {
      setSelectedItem(item);
      onChange(item);
      setOpen(false);
      setSearch("");
    },
    [onChange]
  );

  // Handle clear
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedItem(null);
      onChange(null);
      setSearch("");
    },
    [onChange]
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-between text-left font-normal h-10",
          "bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white",
          !selectedItem && "text-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      >
        <span className="truncate">
          {selectedItem
            ? `${selectedItem.nama_barang} (${selectedItem.stok_tersedia}/${selectedItem.stok_total})`
            : placeholder}
        </span>
        {selectedItem ? (
          <X 
            className="ml-2 h-4 w-4 shrink-0 opacity-70 hover:opacity-100" 
            onClick={(e) => {
              e.stopPropagation();
              handleClear(e);
            }}
          />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        )}
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-slate-700 bg-slate-900 shadow-lg rounded-md">
          <div className="p-2 border-b border-slate-800">
            <Input
              ref={inputRef}
              placeholder="Cari barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <p className="text-sm text-gray-400">Memuat...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <p className="text-sm text-gray-400">
                  {search ? "Barang tidak ditemukan" : "Tidak ada barang tersedia"}
                </p>
              </div>
            ) : (
              <div className="p-1">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const isOutOfStock = item.stok_tersedia <= 0;
                  
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isOutOfStock}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-sm cursor-pointer text-sm flex items-center justify-between transition-colors",
                        isSelected 
                          ? "bg-blue-600/20 text-blue-300 border border-blue-700/50" 
                          : "text-gray-300 hover:bg-slate-800 hover:text-white",
                        isOutOfStock && "opacity-50 cursor-not-allowed hover:bg-transparent"
                      )}
                      onClick={() => !isOutOfStock && handleSelect(item)}
                    >
                      <div className="flex-1 truncate pr-2">
                        <div className="font-medium truncate">
                          {item.nama_barang}
                          {isOutOfStock && (
                            <span className="ml-2 text-xs text-red-400">(Habis)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {item.kode_barang} • Stok:{" "}
                          <span className={cn(
                            item.stok_tersedia > 0 ? "text-green-400" : "text-red-400"
                          )}>
                            {item.stok_tersedia}
                          </span>/{item.stok_total}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 ml-2 shrink-0 text-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedItem && (
            <div className="border-t border-slate-800 p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-gray-400 hover:text-white hover:bg-slate-800"
                onClick={handleClear}
              >
                <X className="mr-2 h-4 w-4" />
                Hapus Pilihan
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}