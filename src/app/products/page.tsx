"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useLiveQuery } from "dexie-react-hooks";
import db, { type Product, type Supplier, type Category } from "@/lib/db";
import {
  Search, Plus, Edit2, Trash2, Package, ScanLine,
  X, ChevronRight, Tag, Layers, ArrowUpDown, Info, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ImageUploader from "@/components/ImageUploader";
import PageHeader from "@/components/PageHeader";
import { useConfirm } from "@/hooks/useConfirm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ── Skeleton ──────────────────────────────────────────────
function ProductsSkeleton() {
  return (
    <div className="">
      <div className="w-full h-48 shimmer mb-6" />
      <div className="px-4 space-y-4 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl shimmer" />)}
        </div>
      </div>
    </div>
  );
}

// ── Bento Table Header ─────────────────────────────────────
function ProductTableHeader() {
  return (
    <div className="hidden lg:grid grid-cols-[80px_1fr_180px_160px_120px] gap-4 px-6 py-3 mb-2 text-[0.625rem] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/5">
      <span>Gambar</span>
      <span>Produk</span>
      <span>Kategori</span>
      <span>Stok</span>
      <span className="text-right">Harga</span>
    </div>
  );
}

// ── Product Bento Row ─────────────────────────────────────
function ProductBentoRow({ product, onEdit, onDelete, supplierName }: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  supplierName?: string;
}) {
  const [imageUrl] = useState(() => product.image ? URL.createObjectURL(product.image) : null);
  const stockStatus = product.stock <= 0 ? "error" : product.stock <= 5 ? "warning" : "success";

  return (
    <Card className="group p-4 lg:p-0 overflow-hidden border-none shadow-sm bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-300 mb-3 rounded-2xl">
      <div className="flex flex-col lg:grid lg:grid-cols-[80px_1fr_180px_160px_120px] items-center gap-4 lg:gap-4 lg:h-20 lg:px-4">
        {/* Box 1: Image */}
        <div className="w-20 h-20 lg:w-14 lg:h-14 rounded-2xl bg-muted/30 overflow-hidden flex items-center justify-center border border-border/10 group-hover:border-primary/20 transition-colors">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-contain p-1.5" />
          ) : (
            <Package className="w-6 h-6 text-muted-foreground/20" />
          )}
        </div>

        {/* Box 2: Name & Info */}
        <div className="flex-1 w-full min-w-0 text-center lg:text-left">
          <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{product.name}</h3>
          <div className="flex items-center justify-center lg:justify-start gap-2 mt-1">
            <span className="text-[0.5625rem] font-mono text-muted-foreground/60 uppercase tracking-tighter">{product.sku || "NO-SKU"}</span>
            {supplierName && (
              <span className="text-[0.5625rem] text-muted-foreground/40 font-medium truncate max-w-[100px]">/ {supplierName}</span>
            )}
          </div>
        </div>

        {/* Box 3: Category */}
        <div className="hidden lg:flex items-center">
          <Badge variant="outline" className="text-[0.5625rem] font-bold h-5 border-muted-foreground/20 text-muted-foreground bg-muted/20">
            {product.category || "Umum"}
          </Badge>
        </div>

        {/* Box 4: Stock */}
        <div className="flex lg:flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start px-4 lg:px-0 py-2 lg:py-0 bg-muted/20 lg:bg-transparent rounded-xl">
          <span className="lg:hidden text-[0.625rem] font-black text-muted-foreground uppercase tracking-widest">Stok</span>
          <Badge 
            variant={stockStatus === "error" ? "destructive" : stockStatus === "warning" ? "warning" : "success"} 
            className="h-6 font-black text-[0.625rem] px-3 shadow-sm border-none"
          >
            {product.stock <= 0 ? "HABIS" : `${product.stock} ${product.unit || "Pcs"}`}
          </Badge>
        </div>

        {/* Box 5: Price & Actions */}
        <div className="flex lg:grid items-center justify-between lg:justify-end w-full lg:w-auto gap-4 px-4 lg:px-0 pb-2 lg:pb-0">
          <div className="text-right lg:pr-2">
            <span className="lg:hidden text-[0.625rem] font-black text-muted-foreground uppercase tracking-widest block mb-1">Harga</span>
            <p className="text-base font-black text-primary tracking-tighter">
              Rp {(product.sellingPrice || 0).toLocaleString("id-ID")}
            </p>
          </div>
          
          <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 lg:translate-x-2 lg:group-hover:translate-x-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(product)}
              className="w-9 h-9 rounded-xl hover:bg-blue-500/10 hover:text-blue-500"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(product.id)}
              className="w-9 h-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Main Products Page ─────────────────────────────────────
export default function ProductsPage() {
  const products = useLiveQuery(() => db.products.orderBy("name").toArray());
  const confirm = useConfirm();
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    supplierId: "",
    cogs: 0,
    sellingPrice: 0,
    stock: 0,
    unit: "Pcs",
    image: null as Blob | null
  });

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current = null;
      } catch (err) {
        console.error("Stop scanner failed:", err);
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    try {
      // Small delay to ensure the div is mounted
      setTimeout(async () => {
        const scanner = new Html5Qrcode("product-barcode-reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText) => {
            setFormData(prev => ({ ...prev, barcode: decodedText }));
            setIsScannerOpen(false);
          },
          () => { }
        );
      }, 100);
    } catch (err) {
      console.error("Scanner failed:", err);
    }
  }, []);

  useEffect(() => {
    if (isScannerOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [isScannerOpen, startScanner, stopScanner]);

  const filtered = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  // Stats logic
  const totalStock = products?.reduce((acc, p) => acc + p.stock, 0) || 0;
  const outOfStockCount = products?.filter(p => p.stock <= 0).length || 0;
  const totalValue = products?.reduce((acc, p) => acc + (p.sellingPrice * p.stock), 0) || 0;

  const handleOpenForm = (p?: Product) => {
    if (p) {
      setEditingId(p.id);
      setFormData({
        name: p.name,
        sku: p.sku || "",
        barcode: p.barcode || "",
        category: p.category || "",
        supplierId: p.supplierId || "",
        cogs: p.cogs || 0,
        sellingPrice: p.sellingPrice,
        stock: p.stock,
        unit: p.unit,
        image: p.image || null
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "", sku: "", barcode: "", category: "", supplierId: "",
        cogs: 0, sellingPrice: 0, stock: 0, unit: "Pcs", image: null
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    // Ensure all required fields from Product interface are present
    const productData: any = {
      ...formData,
      createdAt: Date.now()
    };

    if (editingId) {
      const { id, ...updateData } = productData;
      await db.products.update(editingId, updateData);
    } else {
      await db.products.add({ 
        ...productData, 
        id: `PROD-${Date.now()}`
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Hapus Produk?",
      message: "Produk ini akan dihapus permanen dari katalog. Lanjutkan?",
      type: "danger"
    });
    if (isConfirmed) {
      await db.products.delete(id);
    }
  };

  if (!products) return <ProductsSkeleton />;

  return (
    <div className="pb-32  min-h-screen bg-background">
      <PageHeader
        title="Katalog Barang"
        subtitle="Manajemen Stok"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
              <Input
                className="h-10 w-64 pl-9 bg-muted/40 border-none rounded-xl text-sm"
                placeholder="Cari barang..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button
              onClick={() => handleOpenForm()}
              className="h-10 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 px-4 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah</span>
            </Button>
          </div>
        }
      />

      <div className="w-full px-5 pt-8 mx-auto space-y-8 max-w-[1600px]">
        {/* Bento Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border-none shadow-sm bg-blue-500/5 backdrop-blur-sm relative overflow-hidden group hover:bg-blue-500/10 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Package className="w-16 h-16 text-blue-500" />
            </div>
            <div className="relative z-10">
              <p className="text-[0.625rem] font-black text-blue-600/60 uppercase tracking-[0.2em] mb-1">Total Produk</p>
              <h3 className="text-3xl font-black text-blue-600 tracking-tight">{products.length}</h3>
              <p className="text-[0.625rem] font-bold text-blue-600/40 mt-1">{totalStock} Total Item</p>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-rose-500/5 backdrop-blur-sm relative overflow-hidden group hover:bg-rose-500/10 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Info className="w-16 h-16 text-rose-500" />
            </div>
            <div className="relative z-10">
              <p className="text-[0.625rem] font-black text-rose-600/60 uppercase tracking-[0.2em] mb-1">Stok Habis</p>
              <h3 className="text-3xl font-black text-rose-600 tracking-tight">{outOfStockCount}</h3>
              <p className="text-[0.625rem] font-bold text-rose-600/40 mt-1">Perlu restok segera</p>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-emerald-500/5 backdrop-blur-sm relative overflow-hidden group hover:bg-emerald-500/10 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Tag className="w-16 h-16 text-emerald-500" />
            </div>
            <div className="relative z-10">
              <p className="text-[0.625rem] font-black text-emerald-600/60 uppercase tracking-[0.2em] mb-1">Nilai Inventori</p>
              <h3 className="text-2xl font-black text-emerald-600 tracking-tight">Rp {totalValue.toLocaleString("id-ID")}</h3>
              <p className="text-[0.625rem] font-bold text-emerald-600/40 mt-1">Estimasi nilai jual</p>
            </div>
          </Card>
        </div>

        {/* Bento Table */}
        <div className="space-y-1">
          <ProductTableHeader />
          {filtered?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
              <div className="w-24 h-24 rounded-[3rem] bg-muted/30 flex items-center justify-center relative">
                <Package className="w-12 h-12 text-muted-foreground/20" />
                <div className="absolute inset-0 rounded-[3rem] border border-dashed border-muted-foreground/20 animate-pulse" />
              </div>
              <p className="text-base font-black text-foreground uppercase tracking-widest">Produk Tidak Ditemukan</p>
            </div>
          ) : (
            filtered?.map((p, idx) => (
              <div 
                key={p.id} 
                className=""
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <ProductBentoRow
                  product={p}
                  supplierName={suppliers?.find(s => s.id === p.supplierId)?.name}
                  onEdit={handleOpenForm}
                  onDelete={handleDelete}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Form Modal ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[110] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-5 pt-10 pb-4 border-b border-border/50 bg-background/95 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-bold text-foreground">
                {editingId ? "Ubah Detail Produk" : "Tambah Produk Baru"}
              </h2>
            </div>
            <Button onClick={handleSave} className="h-10 rounded-xl gradient-primary text-white font-bold text-xs tracking-wider px-6">
              SIMPAN
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto scroll-area px-5 py-6 space-y-8 max-w-2xl mx-auto w-full pb-32">
            {/* Image Section */}
            <div className="space-y-3">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Foto Produk</p>
              <ImageUploader 
                initialBlob={formData.image as Blob | undefined} 
                onChange={(blob) => setFormData({ ...formData, image: blob })} 
              />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Informasi Dasar</p>
                <div className="space-y-4">
                  <div className="space-y-1.5 flex-1">
                    <p className="text-[0.625rem] font-bold text-foreground/60 ml-1">Nama Produk</p>
                    <Input
                      className="h-12 px-4 rounded-xl bg-muted/30 border-none font-bold"
                      placeholder="Masukkan nama produk..."
                      value={formData.name ?? ""}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[0.625rem] font-bold text-foreground/60 ml-1">SKU / Kode Barang</p>
                      <Input
                        className="h-12 px-4 rounded-xl bg-muted/30 border-none"
                        placeholder="BRS-001"
                        value={formData.sku ?? ""}
                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[0.625rem] font-bold text-foreground/60 ml-1">Barcode (Opsional)</p>
                      <div className="flex gap-2">
                        <Input
                          className="h-12 px-4 rounded-xl bg-muted/30 border-none flex-1"
                          placeholder="Scan atau ketik..."
                          value={formData.barcode ?? ""}
                          onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 rounded-xl bg-muted/30 border-none shrink-0"
                          onClick={() => setIsScannerOpen(true)}
                        >
                          <ScanLine className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[0.625rem] font-bold text-foreground/60 ml-1">Satuan</p>
                    <Input
                      className="h-12 px-4 rounded-xl bg-muted/30 border-none"
                      placeholder="Pcs, Kg, Box..."
                      value={formData.unit ?? ""}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Kategori & Pemasok</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-foreground/60 ml-1">Kategori</p>
                    <select
                      className="w-full h-12 px-4 rounded-xl bg-muted/30 border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                      value={formData.category ?? "Umum"}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Pilih Kategori</option>
                      {categories?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-foreground/60 ml-1">Pemasok</p>
                    <select
                      className="w-full h-12 px-4 rounded-xl bg-muted/30 border-none outline-none text-sm appearance-none"
                      value={formData.supplierId}
                      onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                    >
                      <option value="">Pilih Pemasok</option>
                      {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Harga & Stok</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-foreground/60 ml-1">Harga Beli (Rp)</p>
                    <Input
                      type="number"
                      className="h-12 px-4 rounded-xl bg-muted/30 border-none"
                      value={formData.cogs ?? ""}
                      onChange={e => setFormData({ ...formData, cogs: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-foreground/60 ml-1">Harga Jual (Rp)</p>
                    <Input
                      type="number"
                      className="h-12 px-4 rounded-xl bg-muted/30 border-none text-primary font-bold"
                      value={formData.sellingPrice ?? ""}
                      onChange={e => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-foreground/60 ml-1">Stok Saat Ini</p>
                    <Input
                      type="number"
                      className="h-12 px-4 rounded-xl bg-muted/30 border-none"
                      value={formData.stock ?? ""}
                      onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Scanner Overlay ── */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 ">
          <div className="w-full max-w-md bg-background rounded-3xl overflow-hidden relative shadow-2xl">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-bold text-sm">Scan Barcode Produk</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsScannerOpen(false)} className="rounded-full h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div id="product-barcode-reader" className="w-full aspect-square bg-black" />
            <div className="p-6 text-center space-y-2">
              <p className="text-xs font-bold text-foreground uppercase tracking-widest">Scanning...</p>
              <p className="text-[10px] text-muted-foreground">Posisikan barcode di dalam kotak kamera</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
