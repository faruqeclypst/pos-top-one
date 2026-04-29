"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db, { type Product, type Supplier } from "@/lib/db";
import {
  Search, Plus, Edit2, Trash2, Package, ScanLine,
  X, ChevronRight, Tag, Layers, ArrowUpDown, Info, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ImageUploader from "@/components/ImageUploader";

// ── Skeleton ──────────────────────────────────────────────
function ProductsSkeleton() {
  return (
    <div className="p-4 space-y-3 pt-20 max-w-5xl mx-auto w-full">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-2xl shimmer h-24" />
      ))}
    </div>
  );
}

// ── Product List Item ─────────────────────────────────────
function ProductItem({ product, onEdit, onDelete, supplierName }: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  supplierName?: string;
}) {
  const [imageUrl] = useState(() => product.image ? URL.createObjectURL(product.image) : null);
  const stockStatus = product.stock <= 0 ? "error" : product.stock <= 5 ? "warning" : "success";

  return (
    <div className="card-premium p-4 flex items-center gap-4 group hover:border-primary/20 transition-colors">
      {/* Image */}
      <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden shrink-0 flex items-center justify-center border border-border/50">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-7 h-7 text-muted-foreground/30" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-bold text-foreground truncate">{product.name}</p>
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground font-medium shrink-0">
            {product.category || "Umum"}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">
            {product.sku || "NO-SKU"}
          </span>
          {supplierName && (
            <div className="flex items-center gap-1 text-[10px] text-primary/70 font-medium">
              <Building2 className="w-2.5 h-2.5" />
              <span className="truncate max-w-[80px]">{supplierName}</span>
            </div>
          )}
          <span className="text-[10px] text-muted-foreground">{product.unit}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-primary">Rp {(product.sellingPrice || 0).toLocaleString("id-ID")}</p>
            <p className="text-[10px] text-muted-foreground">HPP: Rp {product.cogs?.toLocaleString("id-ID") || 0}</p>
          </div>
          <span className={cn(
            "text-[10px] font-bold px-2.5 py-1 rounded-lg",
            stockStatus === "success" && "bg-emerald-50 text-emerald-600 border border-emerald-100",
            stockStatus === "warning" && "bg-amber-50 text-amber-600 border border-amber-100",
            stockStatus === "error" && "bg-rose-50 text-rose-600 border border-rose-100"
          )}>
            {product.stock <= 0 ? "Habis" : `Stok: ${product.stock}`}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(product)}
          className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center touchable"
        >
          <Edit2 className="w-4 h-4 text-primary" />
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center touchable"
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
        </button>
      </div>
    </div>
  );
}

// ── Main Products Page ────────────────────────────────────
export default function ProductsPage() {
  const products = useLiveQuery(() => db.products.orderBy("name").toArray());
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    id: "", sku: "", barcode: "", name: "", sellingPrice: 0, cogs: 0, stock: 0, category: "", unit: "Pcs", supplierId: "", image: null
  });

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenForm = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData(product);
    } else {
      const newId = `PRD-${Date.now()}`;
      setEditingId(null);
      setFormData({ 
        id: newId, sku: "", barcode: "", name: "", 
        sellingPrice: 0, cogs: 0, stock: 0, category: "", 
        unit: "Pcs", supplierId: "", image: null 
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return alert("Nama barang wajib diisi");
    if (!formData.sku) return alert("SKU wajib diisi");

    try {
      if (!editingId || (editingId && formData.sku !== (products?.find(p => p.id === editingId)?.sku))) {
        const existing = await db.products.where("sku").equals(formData.sku!).first();
        if (existing) return alert("SKU sudah digunakan oleh barang lain");
      }

      const idToUse = formData.id || `PRD-${Date.now()}`;

      await db.products.put({
        id: idToUse,
        sku: formData.sku!,
        barcode: formData.barcode || formData.sku!,
        name: formData.name!,
        sellingPrice: Number(formData.sellingPrice) || 0,
        cogs: Number(formData.cogs) || 0,
        stock: Number(formData.stock) || 0,
        unit: formData.unit || "Pcs",
        category: formData.category || "Umum",
        supplierId: formData.supplierId || "",
        image: formData.image || null,
        createdAt: formData.createdAt || Date.now(),
      });
      setIsFormOpen(false);
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan data barang.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus barang ini?")) return;
    await db.products.delete(id);
  };

  if (!products) return <ProductsSkeleton />;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto">
        {/* ── Header ── */}
        <div className="bg-background/95 px-4 pt-5 pb-3 space-y-4" style={{ backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Katalog Barang</h1>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {products.length} Item
            </span>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full h-12 pl-10 pr-4 bg-muted/50 rounded-2xl text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-sm shadow-black/[0.02]"
                placeholder="Cari nama, SKU, atau barcode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="w-12 h-12 rounded-2xl bg-card border border-border/50 flex items-center justify-center touchable shadow-sm">
              <ScanLine className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* ── List ── */}
        <div className="flex-1 overflow-y-auto scroll-area px-4 pb-32 pt-2 space-y-3">
          {filtered?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-20 h-20 rounded-[2.5rem] bg-muted/50 flex items-center justify-center">
                <Package className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Tidak ada barang</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Coba cari dengan kata kunci lain atau tambah barang baru</p>
              </div>
            </div>
          ) : filtered?.map(p => {
            const sName = suppliers?.find(s => s.id === p.supplierId)?.name;
            return <ProductItem key={p.id} product={p} onEdit={handleOpenForm} onDelete={handleDelete} supplierName={sName} />;
          })}
        </div>

        {/* ── FAB ── */}
        <button
          onClick={() => handleOpenForm()}
          className="fixed bottom-[88px] right-6 xl:right-[calc(50%-612px+24px)] w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-primary/30 touchable z-20"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* ── Form Sheet ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-border/50 bg-background/95 sticky top-0 z-10 backdrop-blur-md">
            <button onClick={() => setIsFormOpen(false)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold text-foreground">
              {editingId ? "Ubah Detail Barang" : "Tambah Barang Baru"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto scroll-area px-5 py-6 space-y-8 max-w-2xl mx-auto w-full">
            {/* Image Section */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1">
                Foto Produk
              </label>
              <ImageUploader
                initialBlob={formData.image as Blob | undefined}
                onChange={blob => setFormData({ ...formData, image: blob })}
              />
            </div>

            {/* Identity Section */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1 flex items-center gap-2">
                Identitas Produk
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground px-1">Nama Barang</p>
                  <input
                    className="w-full h-12 px-4 bg-muted/40 rounded-2xl text-sm border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-inner-sm"
                    placeholder="Contoh: Kopi Gula Aren"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground px-1 flex items-center justify-between">
                    SKU 
                    <span className="text-[10px] font-normal text-rose-500 italic">Wajib</span>
                  </p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 h-12 px-4 bg-muted/40 rounded-2xl text-sm font-mono border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-inner-sm"
                      placeholder="KOPI-001"
                      value={formData.sku}
                      onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    />
                    <button className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center touchable border border-border/50">
                      <ScanLine className="w-5 h-5 text-foreground" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground px-1">Kategori</p>
                  <input
                    className="w-full h-12 px-4 bg-muted/40 rounded-2xl text-sm border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Minuman, Makanan..."
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground px-1">Pemasok (Supplier)</p>
                  <select
                    className="w-full h-12 px-4 bg-muted/40 rounded-2xl text-sm border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    value={formData.supplierId}
                    onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                  >
                    <option value="">Pilih Supplier...</option>
                    {suppliers?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1">
                Harga & Inventori
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground px-1">Harga Jual</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">Rp</span>
                    <input
                      type="number"
                      className="w-full h-12 pl-10 pr-4 bg-muted/40 rounded-2xl text-sm font-bold text-primary border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={formData.sellingPrice || ""}
                      onChange={e => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground px-1">HPP (Modal)</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">Rp</span>
                    <input
                      type="number"
                      className="w-full h-12 pl-10 pr-4 bg-muted/40 rounded-2xl text-sm font-medium border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={formData.cogs || ""}
                      onChange={e => setFormData({ ...formData, cogs: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <p className="text-xs font-semibold text-foreground px-1">Stok Saat Ini</p>
                  <input
                    type="number"
                    className="w-full h-12 px-4 bg-muted/40 rounded-2xl text-sm font-bold border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={formData.stock || ""}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="px-5 pb-10 pt-4 border-t border-border/50 bg-background/95 backdrop-blur-md sticky bottom-0">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={handleSave}
                className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                {editingId ? "Simpan Perubahan" : "Simpan Barang Baru"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
