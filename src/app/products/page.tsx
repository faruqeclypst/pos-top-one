"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { useLiveQuery } from "dexie-react-hooks";
import db, { type Product, type Supplier, type Category } from "@/lib/db";
import {
  Search, Plus, Edit2, Trash2, Package, ScanLine,
  X, ChevronRight, Tag, Layers, ArrowUpDown, Info, Building2,
  ArrowDownCircle, History, TrendingUp, CheckCircle2, Phone, MapPin
} from "lucide-react";
import { cn, playBeep } from "@/lib/utils";
import ImageUploader from "@/components/ImageUploader";
import PageHeader from "@/components/PageHeader";
import { useConfirm } from "@/hooks/useConfirm";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import { getTerminology } from "@/lib/terminology";
import { processStockIn, calculateWeightedAverage } from "@/lib/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="flex items-center gap-2 lg:gap-4 px-4 lg:px-6 py-4 mb-2 text-[0.625rem] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/5">
      <div className="w-6 lg:w-8 shrink-0 text-center">#</div>
      <div className="hidden lg:block w-14 shrink-0 text-center">Foto</div>
      <div className="flex-1 min-w-0">Produk</div>
      <div className="hidden lg:block w-32 shrink-0 text-left">Kategori</div>
      <div className="flex-1 lg:w-40 shrink-0 text-right pr-4 lg:pr-8">Harga & Stok</div>
      <div className="w-24 lg:w-36 shrink-0 text-right">Aksi</div>
    </div>
  );
}

// ── Product Bento Row ─────────────────────────────────────
function ProductBentoRow({ product, onEdit, onDelete, onRestock, onToggleActive, supplierName, index }: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onRestock: (p: Product) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
  supplierName?: string;
  index: number;
}) {
  const [imageUrl] = useState(() => product.image ? URL.createObjectURL(product.image) : null);
  const stockStatus = product.stock <= 0 ? "error" : product.stock <= 5 ? "warning" : "success";
  const isFNB = useStoreProfile()?.profile?.businessType === "FNB";
  const trackStock = product.trackStock ?? true;
  const isActive = product.isActive ?? true;

  return (
    <Card className={cn("group overflow-hidden border-none shadow-sm transition-colors duration-200 mb-1.5 rounded-2xl", isActive ? "bg-card/40 hover:bg-card/60" : "bg-muted/20 opacity-60 hover:bg-muted/30")}>
      <div className="flex items-center gap-4 px-4 lg:px-6 py-4 h-auto lg:h-24">
        {/* Box 0: Index */}
        <div className="w-6 lg:w-8 shrink-0 text-center">
          <span className="text-[8px] lg:text-[10px] font-black text-muted-foreground/40">{index + 1}</span>
        </div>
        {/* Box 1: Image */}
        <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-muted/30 overflow-hidden flex items-center justify-center border border-border/10 group-hover:border-primary/20 transition-colors duration-200 group-hover:scale-105 shadow-inner shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-contain p-1" />
          ) : (
            <Package className="w-6 h-6 text-muted-foreground/20" />
          )}
        </div>

        {/* Box 2: Name & Info */}
        <div className="flex-1 min-w-0">
          <h3 className={cn("text-xs lg:text-sm font-black truncate group-hover:text-primary transition-colors leading-tight", isActive ? "text-foreground" : "text-muted-foreground")}>{product.name}</h3>
          <p className="text-[8px] lg:text-[10px] font-mono text-muted-foreground/60 uppercase truncate tracking-wider">{product.sku || "NO-SKU"}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {isFNB && !trackStock && (
              <Badge variant="secondary" className="h-4 text-[8px] font-bold bg-amber-500/10 text-amber-600 border-none px-1.5 rounded-md">
                Tanpa Stok
              </Badge>
            )}
            {isFNB && !isActive && (
              <Badge variant="secondary" className="h-4 text-[8px] font-bold bg-rose-500/10 text-rose-600 border-none px-1.5 rounded-md">
                Habis
              </Badge>
            )}
          </div>
        </div>

        {/* Box 3: Category (Hidden on Mobile) */}
        <div className="hidden lg:block w-32 shrink-0">
          <Badge variant="outline" className="text-[9px] font-bold h-5 border-muted-foreground/20 text-muted-foreground bg-muted/10 px-2 rounded-lg">
            {product.category || "Umum"}
          </Badge>
        </div>

        {/* Box 4 & 5: Combined Price & Stock */}
        <div className="flex-1 lg:w-40 shrink-0 flex flex-col items-end gap-1 pr-4 lg:pr-8">
          <p className="text-[10px] lg:text-sm font-black text-foreground tracking-tighter truncate">
            Rp {(product.sellingPrice || 0).toLocaleString("id-ID")}
          </p>
          {trackStock ? (
            <Badge 
              variant={stockStatus === "error" ? "warning" : stockStatus === "warning" ? "warning" : "success"} 
              className="h-5 lg:h-6 font-black text-[8px] lg:text-[10px] px-1.5 lg:px-3 shadow-sm border-none rounded-lg"
            >
              {product.stock <= 0 ? "Habis" : `${product.stock} ${product.unit || "Pcs"}`}
            </Badge>
          ) : (
            <Badge variant="outline" className="h-5 lg:h-6 font-black text-[8px] lg:text-[10px] px-1.5 lg:px-3 border-muted-foreground/20 text-muted-foreground bg-muted/10 rounded-lg">
              Tidak Terbatas
            </Badge>
          )}
        </div>

        {/* Box 6: Actions */}
        <div className="w-32 lg:w-44 shrink-0 flex items-center justify-end gap-1 lg:gap-2.5">
          {/* Toggle Habis/Aktif - FNB only */}
          {isFNB && onToggleActive && (
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleActive(product.id, !isActive); }}
              className={cn("w-7 h-7 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center transition-colors duration-200", isActive ? "bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600" : "bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600")}
              title={isActive ? "Tandai Habis" : "Tandai Aktif"}
            >
              {isActive ? (
                <CheckCircle2 className="w-3.5 h-3.5 lg:w-5 lg:h-5" />
              ) : (
                <X className="w-3.5 h-3.5 lg:w-5 lg:h-5" />
              )}
            </button>
          )}

          {trackStock && (
            <button 
              onClick={(e) => { e.stopPropagation(); onRestock(product); }}
              className="w-7 h-7 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500 hover:text-white text-emerald-600 transition-colors duration-200"
              title="Tambah Stok"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 lg:w-5 lg:h-5" />
            </button>
          )}
          
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(product); }}
            className="w-7 h-7 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-blue-500/10 flex items-center justify-center hover:bg-blue-500 hover:text-white text-blue-600 transition-colors duration-200"
            title="Edit Produk"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
            className="w-7 h-7 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-rose-500/10 flex items-center justify-center hover:bg-rose-500 hover:text-white text-rose-600 transition-colors duration-200"
            title="Hapus Produk"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

// ── Main Products Page ─────────────────────────────────────
export default function ProductsPage() {
  const { profile } = useStoreProfile();
  const terms = getTerminology(profile?.businessType);
  const confirm = useConfirm();
  
  const products = useLiveQuery(() => db.products.orderBy("name").toArray());
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockData, setRestockData] = useState({ qty: 0, buyPrice: 0 });
  const [newSellingPrice, setNewSellingPrice] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // Supplier State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({ name: "", contact: "", address: "" });
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  
  const handleRestock = async () => {
    if (!restockProduct || restockData.qty <= 0) return;
    const newHPP = await processStockIn(restockProduct.id, restockData.qty, restockData.buyPrice);
    
    // Update selling price if changed
    if (newSellingPrice > 0 && newSellingPrice !== restockProduct.sellingPrice) {
      await db.products.update(restockProduct.id, { sellingPrice: newSellingPrice });
    }
    
    setIsRestockOpen(false);
    setRestockData({ qty: 0, buyPrice: 0 });
    setNewSellingPrice(0);
    setRestockProduct(null);
  };

  const isTransitioning = useRef(false);
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
    image: null as Blob | null,
    trackStock: true,
    isActive: true
  });

  const stopScanner = useCallback(async () => {
    if (isTransitioning.current) return;
    if (scannerRef.current) {
      isTransitioning.current = true;
      try {
        const state = scannerRef.current.getState();
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current = null;
      } catch (err) {
        if (!(err as string).toString().includes("transition")) {
          console.error("Stop scanner failed:", err);
        }
      } finally {
        isTransitioning.current = false;
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Camera.requestPermissions({ permissions: ['camera'] });
        if (status.camera !== 'granted') {
          alert("Izin kamera diperlukan untuk scan barcode.");
          setIsScannerOpen(false);
          return;
        }
      }

      const scanner = new Html5Qrcode("product-barcode-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          playBeep();
          setFormData(prev => ({ ...prev, barcode: decodedText }));
          setIsScannerOpen(false);
        },
        () => { }
      );
    } catch (err) {
      console.error("Scanner failed:", err);
    } finally {
      isTransitioning.current = false;
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

  const filtered = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "Semua" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        image: p.image || null,
        trackStock: p.trackStock ?? true,
        isActive: p.isActive ?? true
      });
    } else {
      setEditingId(null);
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randomNum = Math.floor(100 + Math.random() * 900);
      const skuPrefix = profile?.businessType === "FNB" ? "MENU-" : "SKU-";
      const generatedSku = `${skuPrefix}${randomStr}${randomNum}`;
      
      setFormData({
        name: "", sku: generatedSku, barcode: "", category: "", supplierId: "",
        cogs: 0, sellingPrice: 0, stock: 0, unit: "Pcs", image: null, trackStock: true, isActive: true
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
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

  // Supplier handlers
  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contact || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenSupplierForm = (s?: Supplier) => {
    if (s) {
      setEditingSupplierId(s.id);
      setSupplierFormData({ name: s.name, contact: s.contact, address: s.address });
    } else {
      setEditingSupplierId(null);
      setSupplierFormData({ name: "", contact: "", address: "" });
    }
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplierId) {
      await db.suppliers.update(editingSupplierId, { ...supplierFormData });
    } else {
      await db.suppliers.add({
        id: `SUPP-${Date.now()}`,
        ...supplierFormData,
        createdAt: Date.now()
      });
    }
    setIsSupplierModalOpen(false);
    setSupplierFormData({ name: "", contact: "", address: "" });
    setEditingSupplierId(null);
  };

  const handleDeleteSupplier = async (id: string) => {
    const ok = await confirm({
      title: "Hapus Supplier?",
      message: `Semua ${terms.product.toLowerCase()} terkait tetap ada tetapi tanpa relasi supplier. Lanjutkan?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger"
    });
    if (ok) {
      await db.suppliers.delete(id);
    }
  };

  if (!products) return <ProductsSkeleton />;

  return (
    <div className="pb-32 min-h-screen bg-background">
      <PageHeader
        title="Inventori & Mitra"
        subtitle="Manajemen Stok & Supplier"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                <Input
                  className="h-10 w-64 pl-9 bg-muted/40 border-none rounded-xl text-sm"
                  placeholder="Cari barang atau mitra..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
        }
      />

      <div className="w-full px-5 pt-8 mx-auto space-y-8 max-w-[1600px]">
        {/* Mobile Search */}
        <div className="relative group md:hidden">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <Input
            className="h-12 pl-12 bg-muted/40 border-none rounded-2xl text-sm"
            placeholder="Cari barang atau mitra..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Bento Stats - 4 Columns */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <Card className="p-6 border-none shadow-sm bg-blue-500/5 hover:bg-blue-500/10 transition-colors duration-200 rounded-[2rem] flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-200">
              <Package className="w-16 h-16 text-blue-500" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.2em] mb-1">Total Produk</p>
              <h3 className="text-3xl font-black text-blue-600 tracking-tight">{products.length}</h3>
            </div>
            <div className="relative z-10 flex items-center gap-2 mt-auto">
              <Badge className="bg-blue-600/10 text-blue-600 border-none text-[8px] font-bold h-5">{totalStock.toLocaleString("id-ID")} Item</Badge>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-amber-500/5 hover:bg-amber-500/10 transition-colors duration-200 rounded-[2rem] flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-200">
              <Info className="w-16 h-16 text-amber-500" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-[0.2em] mb-1">Stok Habis</p>
              <h3 className="text-3xl font-black text-amber-600 tracking-tight">{outOfStockCount}</h3>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="text-[8px] font-bold text-amber-600/40 uppercase tracking-widest">Perlu perhatian segera</p>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors duration-200 rounded-[2rem] flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-200">
              <TrendingUp className="w-16 h-16 text-emerald-500" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mb-1">Nilai Inventori</p>
              <h3 className="text-xl lg:text-2xl font-black text-emerald-600 tracking-tight truncate">Rp {totalValue.toLocaleString("id-ID")}</h3>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="text-[8px] font-bold text-emerald-600/40 uppercase tracking-widest">Estimasi nilai aset jual</p>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-primary/5 hover:bg-primary/10 transition-colors duration-200 rounded-[2rem] flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-200">
              <Building2 className="w-16 h-16 text-primary" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mb-1">Total Mitra</p>
              <h3 className="text-3xl font-black text-primary tracking-tight">{suppliers?.length || 0}</h3>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="text-[8px] font-bold text-primary/40 uppercase tracking-widest">Supplier Terdaftar</p>
            </div>
          </Card>
        </div>

        {/* Panel Grid */}
        <div className={cn("grid grid-cols-1 gap-8 items-start", profile?.businessType === "FNB" ? "xl:grid-cols-1" : "xl:grid-cols-3")}>
          {/* Panel 1: Products */}
          <div className={cn("space-y-4", profile?.businessType === "FNB" ? "" : "xl:col-span-2")}>
            <div className="flex items-center justify-between px-2 bg-card/50 p-3 rounded-[2rem] border border-border/50">
              <div className="flex items-center gap-3 ml-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Daftar {terms.product}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground">{filtered?.length || 0} Item Tersedia</p>
                </div>
              </div>
              <Button
                onClick={() => handleOpenForm()}
                className="h-10 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 px-5 shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah {terms.product}</span>
              </Button>
            </div>

            <div className="w-full">
              <ProductTableHeader />
              {filtered?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6 text-center bg-card/50 rounded-[3rem] border border-dashed border-border/50">
                  <div className="w-24 h-24 rounded-[3rem] bg-muted/30 flex items-center justify-center relative">
                    <Package className="w-12 h-12 text-muted-foreground/20" />
                    <div className="absolute inset-0 rounded-[3rem] border border-dashed border-muted-foreground/20 animate-pulse" />
                  </div>
                  <p className="text-base font-black text-foreground uppercase tracking-widest">Produk Tidak Ditemukan</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filtered?.map((p, idx) => (
                    <ProductBentoRow
                      key={p.id}
                      product={p}
                      index={idx}
                      supplierName={suppliers?.find(s => s.id === p.supplierId)?.name}
                      onEdit={handleOpenForm}
                      onDelete={handleDelete}
                      onToggleActive={profile?.businessType === "FNB" ? async (id, isActive) => {
                        await db.products.update(id, { isActive });
                      } : undefined}
                      onRestock={(prod) => {
                        setRestockProduct(prod);
                        setRestockData({ qty: 0, buyPrice: prod.cogs || 0 });
                        setNewSellingPrice(prod.sellingPrice);
                        setIsRestockOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel 2: Suppliers */}
          {profile?.businessType !== "FNB" ? (
            <div className="xl:col-span-1 space-y-4">
              <div className="flex items-center justify-between px-2 bg-card/50 p-3 rounded-[2rem] border border-border/50">
                <div className="flex items-center gap-3 ml-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Mitra Supplier</h3>
                  <p className="text-[10px] font-bold text-muted-foreground">{filteredSuppliers?.length || 0} Mitra</p>
                </div>
              </div>
              <Button
                onClick={() => handleOpenSupplierForm()}
                className="w-10 h-10 rounded-xl gradient-primary text-white font-bold flex items-center justify-center shadow-lg shadow-primary/20"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3">
              {filteredSuppliers?.length === 0 ? (
                <div className="py-16 text-center space-y-4 bg-card/50 rounded-[2.5rem] border border-dashed border-border/50">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                    <Building2 className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-tighter">Belum Ada Mitra</h3>
                </div>
              ) : (
                filteredSuppliers?.map(s => (
                  <Card key={s.id} className="card-elevated p-4 border-none bg-card rounded-3xl group transition-all hover:shadow-xl">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-[0.8rem] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black truncate">{s.name}</h4>
                            <p className="text-[10px] text-muted-foreground font-bold">{s.contact || "No Contact"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenSupplierForm(s); }} className="w-8 h-8 rounded-lg hover:bg-blue-500/10 text-blue-500 flex items-center justify-center transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteSupplier(s.id); }} className="w-8 h-8 rounded-lg hover:bg-rose-500/10 text-rose-500 flex items-center justify-center transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {s.address && (
                        <div className="px-3 py-2 bg-muted/40 rounded-xl text-[10px] text-muted-foreground line-clamp-2">
                          <MapPin className="w-3 h-3 inline mr-1" /> {s.address}
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
          ) : null}
        </div>
      </div>

      {/* ── Restock Modal ── */}
      <AnimatePresence>
        {isRestockOpen && restockProduct && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRestockOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-card border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 flex items-center justify-between bg-emerald-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <ArrowDownCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-foreground uppercase tracking-tighter">Restock Barang</h2>
                    <p className="text-[10px] font-bold text-muted-foreground truncate max-w-[150px]">{restockProduct.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsRestockOpen(false)} className="w-8 h-8 rounded-full hover:bg-muted/50 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground uppercase ml-1">Jumlah Masuk ({restockProduct.unit || "Pcs"})</label>
                    <Input
                      type="number"
                      value={restockData.qty || ""}
                      onChange={(e) => setRestockData({ ...restockData, qty: e.target.value === "" ? 0 : Number(e.target.value) })}
                      placeholder="0"
                      className="h-14 px-6 rounded-2xl bg-muted/30 border-none font-black text-lg text-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground uppercase ml-1">Harga Beli / Modal per {restockProduct.unit || "Pcs"}</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={restockData.buyPrice ? restockData.buyPrice.toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setRestockData({ ...restockData, buyPrice: val ? Number(val) : 0 });
                      }}
                      placeholder="0"
                      className="h-14 px-6 rounded-2xl bg-muted/30 border-none font-black text-lg text-emerald-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground uppercase ml-1">Harga Jual Baru (Opsional)</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={newSellingPrice ? newSellingPrice.toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setNewSellingPrice(val ? Number(val) : 0);
                      }}
                      placeholder="0"
                      className="h-14 px-6 rounded-2xl bg-primary/10 border-none font-black text-lg text-primary"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/10 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>HPP Saat Ini</span>
                    <span className="text-foreground">Rp {(restockProduct.cogs || 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-foreground uppercase tracking-widest pt-2 border-t border-border/10">
                    <span>Estimasi HPP Baru</span>
                    <span className="text-blue-600">
                      Rp {(() => {
                        const estimated = calculateWeightedAverage(
                          restockProduct.stock,
                          restockProduct.cogs || 0,
                          restockData.qty,
                          restockData.buyPrice
                        );
                        return estimated.toLocaleString("id-ID");
                      })()}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-border/10 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black text-foreground uppercase tracking-widest">
                      <span>Harga Jual</span>
                      <span>Rp {(newSellingPrice || restockProduct.sellingPrice).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estimasi Margin</span>
                      <Badge variant={(newSellingPrice || restockProduct.sellingPrice) - calculateWeightedAverage(restockProduct.stock, restockProduct.cogs || 0, restockData.qty, restockData.buyPrice) > 0 ? "success" : "destructive"} className="text-[9px] font-black">
                        {(() => {
                          const estimatedHPP = calculateWeightedAverage(
                            restockProduct.stock,
                            restockProduct.cogs || 0,
                            restockData.qty,
                            restockData.buyPrice
                          );
                          const sellPrice = newSellingPrice || restockProduct.sellingPrice;
                          const profit = sellPrice - estimatedHPP;
                          const marginPercent = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
                          return `Rp ${profit.toLocaleString("id-ID")} (${marginPercent.toFixed(1)}%)`;
                        })()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRestock}
                  disabled={restockData.qty <= 0}
                  className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  Konfirmasi Restock
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Form Modal ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[110] bg-background/95 backdrop-blur-sm flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="rounded-full -ml-2">
                <X className="w-5 h-5" />
              </Button>
              <h2 className="text-base font-bold text-foreground">
                {editingId ? "Edit" : "Baru"}
              </h2>
            </div>
            <Button onClick={handleSave} className="h-9 rounded-lg gradient-primary text-white font-bold text-xs px-4">
              SIMPAN
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 w-full max-w-5xl mx-auto">
            {/* Image - Full width on mobile, center on desktop */}
            <div className="flex justify-center mb-4 lg:mb-6">
              <ImageUploader 
                initialBlob={formData.image as Blob | undefined} 
                onChange={(blob) => setFormData({ ...formData, image: blob })} 
              />
            </div>

            {/* Desktop 3-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Column 1: Basic Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Informasi</h3>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground ml-1">NAMA</label>
                  <Input
                    className="h-10 px-3 rounded-lg bg-muted/40 border-none text-sm"
                    placeholder="Nama produk..."
                    value={formData.name ?? ""}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground ml-1">SKU</label>
                    <Input
                      className="h-10 px-3 rounded-lg bg-muted/40 border-none text-sm"
                      placeholder="SKU"
                      value={formData.sku ?? ""}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground ml-1">BARCODE</label>
                    <div className="flex gap-2">
                      <Input
                        className="h-10 px-3 rounded-lg bg-muted/40 border-none text-sm flex-1"
                        placeholder="Scan..."
                        value={formData.barcode ?? ""}
                        onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-lg bg-muted/40 border-none shrink-0"
                        onClick={() => setIsScannerOpen(true)}
                      >
                        <ScanLine className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground ml-1">KATEGORI</label>
                    <select
                      className="w-full h-10 px-3 rounded-lg bg-muted/40 border-none text-sm outline-none cursor-pointer"
                      value={formData.category ?? ""}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Pilih</option>
                      {categories?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground ml-1">SATUAN</label>
                    <Input
                      className="h-10 px-3 rounded-lg bg-muted/40 border-none text-sm"
                      placeholder="Pcs..."
                      value={formData.unit ?? ""}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Column 2: Prices */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Harga</h3>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground ml-1">BELI / MODAL (Rp)</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="h-10 px-3 rounded-lg bg-muted/40 border-none text-sm"
                    placeholder="0"
                    value={formData.cogs ? formData.cogs.toLocaleString("id-ID") : ""}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      setFormData({ ...formData, cogs: val ? Number(val) : 0 });
                    }}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground ml-1">JUAL (Rp)</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="h-10 px-3 rounded-lg bg-muted/40 border-none text-sm font-bold text-primary"
                    placeholder="0"
                    value={formData.sellingPrice ? formData.sellingPrice.toLocaleString("id-ID") : ""}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      setFormData({ ...formData, sellingPrice: val ? Number(val) : 0 });
                    }}
                  />
                </div>

                {/* Track Stock Toggle - FNB only */}
                {profile?.businessType === "FNB" && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/20">
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">Tracking Stok</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formData.trackStock ? "Stok akan berkurang" : "Stok tidak berkurang"}
                      </p>
                    </div>
                    <Switch
                      checked={formData.trackStock}
                      onCheckedChange={(checked) => setFormData({ ...formData, trackStock: checked })}
                    />
                  </div>
                )}

                {/* Habis/Aktif Toggle - FNB only */}
                {profile?.businessType === "FNB" && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/20">
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">Tandai Habis</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formData.isActive ? "Produk bisa dipesan" : "Produk tidak bisa dipesan"}
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                  </div>
                )}
              </div>

              {/* Column 3: Stock */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Stok</h3>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground ml-1">STOK SAAT INI</label>
                  <Input
                    type="number"
                    className="h-10 px-3 rounded-lg bg-muted/40 border-none text-sm"
                    placeholder="0"
                    value={formData.stock || ""}
                    onChange={e => setFormData({ ...formData, stock: e.target.value === "" ? 0 : Number(e.target.value) })}
                    disabled={profile?.businessType === "FNB" && !formData.trackStock}
                  />
                </div>

                {/* Quick stock actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg text-xs"
                    onClick={() => setFormData({ ...formData, stock: formData.stock + 1 })}
                  >
                    + Tambah
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg text-xs"
                    onClick={() => setFormData({ ...formData, stock: Math.max(0, formData.stock - 1) })}
                    disabled={formData.stock <= 0}
                  >
                    - Kurang
                  </Button>
                </div>

                {/* Stock info */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/10">
                  <p className="text-[10px] text-muted-foreground">
                    {formData.stock > 0 
                      ? `${formData.stock} ${formData.unit || 'item'} tersedia`
                      : 'Stok kosong'
                    }
                  </p>
                </div>
              </div>

            </div>

            <div className="h-4" />
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

      {/* Supplier Modal Form */}
      <AnimatePresence>
        {isSupplierModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 lg:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSupplierModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground uppercase tracking-tighter">
                      {editingSupplierId ? "Edit Mitra" : "Mitra Baru"}
                    </h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      Data Supplier
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsSupplierModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSupplier} className="p-6 lg:p-8 space-y-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nama Bisnis / PT</label>
                    <Input
                      required
                      value={supplierFormData.name}
                      onChange={e => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                      placeholder="Contoh: PT. Sumber Makmur"
                      className="h-14 px-6 rounded-2xl bg-muted/40 border-none font-bold text-base focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Kontak / No. WhatsApp</label>
                    <Input
                      value={supplierFormData.contact}
                      onChange={e => setSupplierFormData({ ...supplierFormData, contact: e.target.value })}
                      placeholder="08xx xxxx xxxx"
                      className="h-14 px-6 rounded-2xl bg-muted/40 border-none font-bold text-base focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Alamat Lengkap (Opsional)</label>
                    <textarea
                      value={supplierFormData.address}
                      onChange={e => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                      placeholder="Masukkan alamat lengkap..."
                      className="w-full min-h-[120px] p-6 rounded-2xl bg-muted/40 border-none font-bold text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-16 rounded-[2rem] gradient-primary text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {editingSupplierId ? "Simpan Perubahan" : "Simpan Mitra Baru"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
