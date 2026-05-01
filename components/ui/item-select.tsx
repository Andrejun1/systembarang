"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getAvailableItems, searchItems, Item } from "@/lib/items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown } from "lucide-react";
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
        const data = onlyAvailable ? await getAvailableItems() : items;
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
          !selectedItem && "text-muted-foreground",
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
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-input bg-popover shadow-md rounded-md">
          <div className="p-2">
            <Input
              ref={inputRef}
              placeholder="Cari barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <p className="text-sm text-muted-foreground">Memuat...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <p className="text-sm text-muted-foreground">
                  {search ? "Barang tidak ditemukan" : "Tidak ada barang tersedia"}
                </p>
              </div>
            ) : (
              <div className="p-1">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full text-left px-2 py-2 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm flex items-center justify-between"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex-1 truncate">
                      <div className="font-medium truncate">{item.nama_barang}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.kode_barang} • Stok: {item.stok_tersedia}/{item.stok_total}
                      </div>
                    </div>
                    {selectedItem?.id === item.id && (
                      <Check className="h-4 w-4 ml-2 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedItem && (
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleClear}
              >
                Hapus Pilihan
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
