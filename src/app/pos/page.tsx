"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db, { type Product, type Transaction } from "@/lib/db";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import { Search, ScanLine, Plus, Package, Minus, X, ChevronRight,
  ShoppingBag, CheckCircle2, Bluetooth, CreditCard, Banknote, QrCode,
  Trash2, User, Save, Share2, Download, Printer, Phone, FileText, Info,
  Utensils, Clock
} from "lucide-react";
import { cn, playBeep } from "@/lib/utils";
import html2canvas from "html2canvas";
import { Html5Qrcode } from "html5-qrcode";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Camera } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/hooks/useConfirm";
import { motion } from "framer-motion";

import CategoryBar from "@/components/CategoryBar";
import ReceiptView from "@/components/ReceiptView";

// ── Types ─────────────────────────────────────────────────
interface CartItem extends Product { cartQty: number; }

// ── Skeleton ──────────────────────────────────────────────
function POSSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 space-y-3">
        <div className="h-12 rounded-2xl shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const outOfStock = product.stock <= 0;

  useEffect(() => {
    if (product.image) {
      const url = URL.createObjectURL(product.image);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [product.image]);

  return (
    <Card
      onClick={() => !outOfStock && onAdd(product)}
      className={cn(
        "relative flex flex-col rounded-2xl overflow-hidden text-left transition-all duration-200 cursor-pointer group border border-transparent shadow-sm bg-card hover:bg-muted/30 hover:border-primary/20 hover:shadow-md",
        outOfStock && "opacity-50 grayscale pointer-events-none"
      )}
    >
      {/* Top Image Area (More compact aspect) */}
      <div className="aspect-[5/4] w-full bg-muted/20 flex items-center justify-center overflow-hidden relative">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={product.name} 
            className="w-full h-full object-contain p-3 transition-opacity duration-300" 
          />
        ) : (
          <Package className="w-10 h-10 text-muted-foreground/10 transition-opacity duration-300" />
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
            <Badge variant="destructive" className="font-bold text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">Habis</Badge>
          </div>
        )}
      </div>

      {/* Bottom Info Section (Compact padding & fonts) */}
      <div className="p-2.5 pb-3 flex flex-col gap-0.5 relative bg-white dark:bg-card">
        <p className="text-[0.6875rem] font-bold text-foreground leading-tight line-clamp-1 pr-7">
          {product.name}
        </p>
        <p className="text-[0.8125rem] font-black text-primary tracking-tight">
          Rp {(product.sellingPrice || 0).toLocaleString("id-ID")}
        </p>
        <p className="text-[0.5625rem] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5 opacity-60">
          {product.stock} {product.unit}
        </p>

        {/* Floating Add Button (Compact size) */}
        {!outOfStock && (
          <div className="absolute right-2 bottom-2.5 w-7 h-7 rounded-lg gradient-primary text-white flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-110 active:scale-90 transition-all duration-300">
            <Plus className="w-4 h-4" />
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Cart Item Row ─────────────────────────────────────────
function CartRow({ item, onUpdate, isCompact = false }: { item: CartItem; onUpdate: (id: string, delta: number) => void; isCompact?: boolean }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (item.image) {
      const url = URL.createObjectURL(item.image);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [item.image]);

  return (
    <div className={cn("flex items-center gap-4 py-4 border-b border-border/10 last:border-0", isCompact && "py-3")}>
      <div className="w-14 h-14 rounded-xl bg-muted/30 overflow-hidden shrink-0 border border-border/10 relative">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="w-full h-full object-contain p-1" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-muted-foreground/20" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground leading-tight line-clamp-2">{item.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs font-black text-primary">Rp {(item.sellingPrice || 0).toLocaleString("id-ID")}</p>
          <span className="text-[0.625rem] text-muted-foreground">× {item.cartQty}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        {!isCompact && (
          <p className="text-sm font-black text-foreground">
            Rp {((item.sellingPrice || 0) * item.cartQty).toLocaleString("id-ID")}
          </p>
        )}
        <div className="flex items-center gap-2 bg-muted/40 rounded-xl p-1 border border-border/10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUpdate(item.id, -1)}
            className="h-8 w-8 rounded-lg bg-background hover:bg-muted text-foreground border border-border/20 shadow-sm"
          >
            {item.cartQty === 1 ? <Trash2 className="w-4 h-4 text-destructive" /> : <Minus className="w-4 h-4" />}
          </Button>
          <span className="w-8 text-center text-sm font-black text-foreground">{item.cartQty}</span>
          <Button
            variant="default"
            size="icon"
            onClick={() => onUpdate(item.id, 1)}
            className="h-8 w-8 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Payment Methods ───────────────────────────────────────
const PAYMENT_METHODS = [
  { id: "CASH", label: "Tunai", desc: "Uang fisik", icon: Banknote, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { id: "QRIS", label: "QRIS", desc: "Scan bayar", icon: QrCode, color: "bg-blue-50 text-blue-600 border-blue-200" },
  { id: "TRANSFER", label: "Bank", desc: "Transfer", icon: CreditCard, color: "bg-violet-50 text-violet-600 border-violet-200" },
];

// ── Main POS Page ─────────────────────────────────────────
export default function POSPage() {
  const products = useLiveQuery(() => db.products.orderBy("name").toArray());
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isBillsOpen, setIsBillsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTxId, setLastTxId] = useState("");
  const [activeBillId, setActiveBillId] = useState<string | null>(null);
  const openBills = useLiveQuery(() => db.transactions.where("status").equals("OPEN").toArray());
  const openBillItems = useLiveQuery(
    async () => {
      const bills = await db.transactions.where("status").equals("OPEN").toArray();
      if (bills.length === 0) return [];
      const billIds = bills.map(b => b.id);
      return db.transactionItems.where("transactionId").anyOf(billIds).toArray();
    },
    []
  );
  const categories = useLiveQuery(() => db.categories.toArray());
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [activeTab, setActiveTab] = useState<"MENU" | "MEJA">("MENU");
  const receiptRef = useRef<HTMLDivElement>(null);
  const { profile } = useStoreProfile();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const [cashTendered, setCashTendered] = useState<number>(0);

  const confirm = useConfirm();

  // ── Scanner Logic ─────────────────────────────────────────
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
      if (Capacitor.isNativePlatform()) {
        const status = await Camera.requestPermissions({ permissions: ['camera'] });
        if (status.camera !== 'granted') {
          alert("Izin kamera diperlukan untuk scan barcode.");
          setIsScannerOpen(false);
          return;
        }
      }

      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          const now = Date.now();
          if (now - lastScanTimeRef.current < 1500) return; // Debounce 1.5s
          
          const product = products?.find(p => p.sku === decodedText || p.id.toString() === decodedText || p.barcode === decodedText);
          if (product) {
            lastScanTimeRef.current = now;
            playBeep();
            addToCart(product);
            setIsScannerOpen(false);
          }
        },
        () => { }
      );
    } catch (err) {
      console.error("Scanner failed:", err);
    }
  }, [products]);

  useEffect(() => {
    if (isScannerOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [isScannerOpen, startScanner, stopScanner]);

  const handleScanBarcode = () => {
    setIsScannerOpen(true);
  };

  const filtered = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.barcode?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.cartQty >= product.stock) return prev;
        return prev.map(i => i.id === product.id ? { ...i, cartQty: i.cartQty + 1 } : i);
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
  }, []);

  const updateCartQty = useCallback((id: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, cartQty: Math.min(i.cartQty + delta, i.stock) } : i)
      .filter(i => i.cartQty > 0)
    );
  }, []);

  const totalItems = useMemo(() => cart.reduce((s, i) => s + i.cartQty, 0), [cart]);
  const totalPrice = useMemo(() => cart.reduce((s, i) => s + (i.sellingPrice || 0) * i.cartQty, 0), [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const txId = `TRX-${Date.now()}`;
      
      await db.transaction('rw', [db.transactions, db.transactionItems, db.products, db.stockMutations], async () => {
        await db.transactions.put({
          id: txId,
          date: Date.now(),
          total: totalPrice,
          paymentMethod,
          status: "SETTLEMENT",
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          tableNumber: tableNumber || undefined,
          orderType: profile?.businessType === "FNB" ? orderType : undefined,
          cashTendered: paymentMethod === 'CASH' ? cashTendered : totalPrice,
          cashChange: paymentMethod === 'CASH' ? Math.max(0, cashTendered - totalPrice) : 0
        });

        for (const item of cart) {
          await db.transactionItems.put({
            transactionId: txId, 
            productId: item.id,
            qty: item.cartQty, 
            priceAtTransaction: item.sellingPrice || 0, 
            subtotal: (item.sellingPrice || 0) * item.cartQty
          });
          await db.products.update(item.id, { stock: item.stock - item.cartQty });
          await db.stockMutations.put({ 
            productId: item.id, 
            type: "OUT", 
            quantity: item.cartQty, 
            referenceId: txId, 
            createdAt: Date.now() 
          });
        }

        // If this was a restored bill, delete the draft now that it's paid
        if (activeBillId) {
          await db.transactions.delete(activeBillId);
          await db.transactionItems.where("transactionId").equals(activeBillId).delete();
        }
      });

      setLastTxId(txId);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setIsSuccessOpen(true);
      
      // Auto-sync
      if (profile?.isGoogleConnected && profile?.spreadsheetId) {
        import("@/lib/google-sheets").then(async (m) => {
          try {
            await m.initGoogleApi();
            await m.loginGoogle(true); 
            await m.syncAllToCloud(profile.spreadsheetId!);
            console.log("Auto-sync completed");
          } catch (err) {
            console.warn("Auto-sync skipped/failed (silent):", err);
          }
        });
      }

    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan transaksi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveOpenBill = async () => {
    if (cart.length === 0) return;
    try {
      const txId = activeBillId || `OPEN-${Date.now()}`;
      
      await db.transaction('rw', [db.transactions, db.transactionItems], async () => {
        await db.transactions.put({
          id: txId,
          date: Date.now(),
          total: totalPrice,
          paymentMethod: "CASH",
          status: "OPEN",
          customerName: customerName || "Pelanggan",
          customerPhone: customerPhone || undefined,
          tableNumber: tableNumber || undefined,
          orderType: profile?.businessType === "FNB" ? orderType : undefined
        });
        
        // Refresh items for this bill
        await db.transactionItems.where("transactionId").equals(txId).delete();
        
        for (const item of cart) {
          await db.transactionItems.put({
            transactionId: txId, 
            productId: item.id,
            qty: item.cartQty, 
            priceAtTransaction: item.sellingPrice || 0, 
            subtotal: (item.sellingPrice || 0) * item.cartQty
          });
        }
      });
      
      alert("Bill berhasil disimpan!");
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setTableNumber("");
      setOrderType("DINE_IN");
      setActiveBillId(null);
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan bill.");
    }
  };


  const handleRestoreBill = async (tx: any) => {
    const items = await db.transactionItems.where("transactionId").equals(tx.id).toArray();
    const newCart = items.map(item => {
      const p = products?.find(prod => prod.id === item.productId);
      return {
        ...p,
        cartQty: item.qty,
        sellingPrice: item.priceAtTransaction
      };
    });
    setCart(newCart as any);
    setCustomerName(tx.customerName || "");
    setCustomerPhone(tx.customerPhone || "");
    setTableNumber(tx.tableNumber || "");
    setOrderType(tx.orderType || "DINE_IN");
    setActiveBillId(tx.id);
    setIsBillsOpen(false);
  };

  const handleDeleteBill = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Hapus Bill?",
      message: "Bill ini akan dihapus secara permanen dari daftar draft.",
      type: "danger"
    });
    if (isConfirmed) {
      await db.transactions.delete(id);
      await db.transactionItems.where("transactionId").equals(id).delete();
      if (activeBillId === id) {
        setActiveBillId(null);
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setTableNumber("");
      }
    }
  };

  const handleTableClick = (tableNum: string) => {
    const bill = openBills?.find(b => b.tableNumber === tableNum);
    if (bill) {
      handleRestoreBill(bill);
    } else {
      setTableNumber(tableNum);
      if (!activeBillId && cart.length === 0) {
        // Start fresh for new table
        setCustomerName("");
      }
    }
    setActiveTab("MENU");
  };

  const handleClearCart = async () => {
    if (cart.length === 0) return;
    const isConfirmed = await confirm({
      title: "Kosongkan Keranjang?",
      message: "Semua barang yang sudah dipilih akan dihapus dari daftar pesanan.",
      type: "danger"
    });
    if (isConfirmed) {
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setTableNumber("");
      setActiveBillId(null);
    }
  };

  if (!products) return <POSSkeleton />;

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1600px] mx-auto w-full">
        {/* ── Left Side: Products ── */}
        <div className="flex flex-col flex-1 min-w-0 h-full border-r border-border/50">
          <PageHeader
            title="Kasir"
            subtitle="Pesanan Baru"
            sticky={false}
            actions={
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsBillsOpen(true)}
                className="relative h-10 w-10 rounded-xl bg-muted/40"
              >
                <FileText className="w-5 h-5" />
                {openBills && openBills.length > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center bg-primary text-white border-2 border-background font-black text-[9px]"
                  >
                    {openBills.length}
                  </Badge>
                )}
              </Button>
            }
          />
        
        <div className="w-full px-5 py-2 space-y-4">
            {profile?.businessType === 'FNB' && profile?.useTable && (
              <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
                <button 
                  onClick={() => setActiveTab("MENU")}
                  className={cn("px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all", activeTab === "MENU" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted")}
                >
                  Menu
                </button>
                <button 
                  onClick={() => setActiveTab("MEJA")}
                  className={cn("px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all", activeTab === "MEJA" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted")}
                >
                  Data Meja
                </button>
              </div>
            )}

            {activeTab === "MENU" && (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      className="h-11 pl-10 bg-muted/40 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                      placeholder="Cari produk..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl bg-muted/40 border-none shrink-0"
                    onClick={handleScanBarcode}
                  >
                    <ScanLine className="w-5 h-5" />
                  </Button>
                </div>

                {/* Categories Bar */}
                <CategoryBar 
                  selectedCategory={selectedCategory} 
                  onSelect={setSelectedCategory} 
                />
              </>
            )}
          </div>

          {/* Product/Table Grid */}
          <div className="flex-1 overflow-y-auto scroll-area px-5 py-6 pb-52 lg:pb-28">
            {activeTab === "MENU" ? (
              filtered?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Barang tidak ditemukan</p>
                  <p className="text-xs text-muted-foreground">Coba kata kunci lain</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3 lg:gap-4 pb-10">
                  {filtered?.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
                </div>
              )
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6 pb-10">
                {Array.from({ length: 20 }, (_, i) => {
                  const num = (i + 1).toString();
                  const bill = openBills?.find(b => b.tableNumber === num);
                  const isOccupied = !!bill;
                  const isActive = num === tableNumber;
                  
                  const elapsedMinutes = isOccupied ? Math.floor((Date.now() - bill.date) / 60000) : 0;
                  const timeString = elapsedMinutes > 60 ? `${Math.floor(elapsedMinutes / 60)}j ${elapsedMinutes % 60}m` : `${elapsedMinutes}m`;

                  // Get items for this bill to show a summary preview
                  const itemsForBill = openBillItems?.filter(i => i.transactionId === bill?.id) || [];
                  const firstItem = itemsForBill.length > 0 ? itemsForBill[0] : null;
                  const firstItemProduct = firstItem ? products?.find(p => p.id === firstItem.productId) : null;

                  return (
                    <div
                      key={num}
                      onClick={() => handleTableClick(num)}
                      className={cn(
                        "relative flex flex-col p-4 rounded-xl cursor-pointer transition-all duration-200 border-2",
                        isOccupied
                          ? "bg-primary/10 border-primary/30 hover:border-primary/50 shadow-sm"
                          : "bg-background border-border border-dashed hover:border-primary/40 hover:bg-primary/5",
                        isActive && "border-solid border-primary bg-primary/15 shadow-md scale-[1.02]"
                      )}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg",
                            isOccupied || isActive ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                          )}>
                            {num}
                          </div>
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-widest leading-tight transition-colors",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}>Meja</span>
                            {isActive ? (
                              <span className="text-[9px] font-black text-primary leading-tight animate-pulse">AKTIF</span>
                            ) : (
                              <span className={cn("text-[9px] font-bold uppercase tracking-widest leading-tight", isOccupied ? "text-primary/80" : "text-muted-foreground/60")}>
                                {isOccupied ? "Terisi" : "Kosong"}
                              </span>
                            )}
                          </div>
                        </div>

                        {isOccupied && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-background shadow-sm border border-border/50 text-[10px] font-bold text-muted-foreground">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {timeString}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      {isOccupied ? (
                        <div className="mt-auto space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80 bg-background/50 p-1.5 rounded-md">
                            <User className="w-3.5 h-3.5 text-primary opacity-70 shrink-0" />
                            <span className="truncate">{bill?.customerName || "Tamu Reguler"}</span>
                          </div>
                          
                          {/* First Item Summary Preview */}
                          {firstItemProduct && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-medium px-1 truncate">
                              <Package className="w-3 h-3 shrink-0" />
                              <span className="truncate">{firstItemProduct.name}</span>
                              {itemsForBill.length > 1 && (
                                <span className="shrink-0 font-bold bg-muted px-1.5 py-0.5 rounded-md">+{itemsForBill.length - 1}</span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tagihan</span>
                            <span className="text-sm font-black text-primary">Rp {(bill?.total || 0).toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-auto pt-3 flex items-center justify-center">
                          <span className={cn(
                            "text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                          )}>
                            <Plus className="w-3.5 h-3.5" /> Buka Meja
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Side: Sidebar Cart (Desktop Only) ── */}
      <div className="hidden lg:flex flex-col w-[420px] border-l border-border bg-card/30 backdrop-blur-md">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              {isCheckoutOpen ? (
                <>
                  <button onClick={() => setIsCheckoutOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  Pembayaran
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  Pesanan Baru
                </>
              )}
            </h2>
            {!isCheckoutOpen && cart.length > 0 && (
              <button 
                onClick={handleClearCart}
                className="text-[0.625rem] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg uppercase tracking-wider"
              >
                Batal
              </button>
            )}
          </div>

          {!isCheckoutOpen && (
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  className="w-full h-9 pl-8 pr-3 bg-muted/40 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Nama Pelanggan"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {profile?.usePhoneNumber && (
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      className="w-full h-9 pl-8 pr-3 bg-muted/40 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary/30"
                      placeholder="No. HP / WA"
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                    />
                  </div>
                )}
                {profile?.useTable && (
                  <input
                    className="w-16 h-9 px-2 bg-muted/40 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary/30 text-center"
                    placeholder="Meja"
                    value={tableNumber}
                    onChange={e => setTableNumber(e.target.value)}
                  />
                )}
              </div>
              {profile?.businessType === "FNB" && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-xl">
                  <button
                    onClick={() => setOrderType("DINE_IN")}
                    className={cn(
                      "py-2 text-[10px] font-bold rounded-lg transition-all",
                      orderType === "DINE_IN" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Dine In
                  </button>
                  <button
                    onClick={() => setOrderType("TAKEAWAY")}
                    className={cn(
                      "py-2 text-[10px] font-bold rounded-lg transition-all",
                      orderType === "TAKEAWAY" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Takeaway
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Items / Checkout Content */}
        <div className="flex-1 overflow-y-auto scroll-area px-5 py-2">
          {isCheckoutOpen ? (
            <div className="space-y-6 py-4">
              <div className="text-center py-2">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Total Tagihan</p>
                <p className="text-3xl font-black text-foreground tracking-tight mt-1">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </p>
                <p className="text-[0.625rem] text-muted-foreground mt-1">{totalItems} barang</p>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Metode Pembayaran</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all duration-150 text-center",
                        paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border bg-card"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", m.color)}>
                        <m.icon className="w-4 h-4" />
                      </div>
                      <p className="font-bold text-[9px] text-foreground leading-tight">{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "CASH" && (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Nominal Uang</p>
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                    {[1000, 2000, 5000, 10000, 20000, 50000, 100000].map(val => (
                      <button
                        key={val}
                        onClick={() => setCashTendered(prev => prev + val)}
                        className="h-10 rounded-xl border border-border bg-card text-[11px] font-bold hover:bg-muted active:scale-95 transition-all flex items-center justify-center"
                      >
                        +{val >= 1000 ? `${val/1000}k` : val}
                      </button>
                    ))}
                    <button
                      onClick={() => setCashTendered(totalPrice)}
                      className="h-10 rounded-xl border border-primary/20 bg-primary/5 text-primary text-[11px] font-bold hover:bg-primary/10 active:scale-95 transition-all flex items-center justify-center"
                    >
                      Pas
                    </button>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      className="h-10 pl-8 pr-4 bg-muted/40 border-none rounded-xl font-black text-base"
                      placeholder="Masukkan nominal..."
                      value={cashTendered || ""}
                      onChange={e => setCashTendered(e.target.value === "" ? 0 : Number(e.target.value))}
                    />
                  </div>
                  {cashTendered >= totalPrice && (
                    <div className="flex justify-between items-center px-3 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Kembalian</span>
                      <span className="text-sm font-black text-emerald-600">Rp {(cashTendered - totalPrice).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-muted/30 space-y-2 border border-border/10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Ringkasan</p>
                {customerName && (
                  <div className="flex justify-between text-[10px] pb-1.5 border-b border-border/20">
                    <span className="text-muted-foreground">Pelanggan</span>
                    <span className="font-bold text-foreground">{customerName} {tableNumber ? `(Meja ${tableNumber})` : ""}</span>
                  </div>
                )}
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-[10px]">
                      <span className="text-foreground/70 truncate flex-1 mr-4">{item.name} ×{item.cartQty}</span>
                      <span className="font-bold text-foreground shrink-0">Rp {((item.sellingPrice || 0) * item.cartQty).toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border/50 flex justify-between font-black text-sm text-primary">
                  <span>TOTAL</span>
                  <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <ShoppingBag className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">Keranjang Kosong</p>
              <p className="text-xs">Klik barang untuk menambahkan</p>
            </div>
          ) : (
            cart.map(item => <CartRow key={item.id} item={item} onUpdate={updateCartQty} />)
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 pb-28 bg-card border-t border-border/50 space-y-4">
          {!isCheckoutOpen && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({totalItems} item)</span>
                <span className="font-medium">Rp {totalPrice.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total Tagihan</span>
                <span className="text-primary">Rp {totalPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {isCheckoutOpen ? (
              <>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="h-12 rounded-xl bg-muted text-foreground text-xs font-bold flex items-center justify-center gap-2 touchable"
                >
                  Kembali
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="h-12 rounded-xl gradient-primary text-white text-xs font-bold flex items-center justify-center gap-2 touchable shadow-lg disabled:opacity-60"
                >
                  {isProcessing ? (
                    <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Bayar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveOpenBill}
                  disabled={cart.length === 0}
                  className="h-11 rounded-xl bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-2 touchable disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Simpan Bill
                </button>
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  disabled={cart.length === 0}
                  className="h-11 rounded-xl bg-primary text-white text-xs font-semibold flex items-center justify-center gap-2 touchable shadow-md disabled:opacity-50"
                >
                  Bayar Sekarang <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        </div>
      </div>

      {cart.length > 0 && !isCartOpen && (
        <div className="fixed lg:hidden bottom-[130px] left-0 right-0 px-4 z-20 animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full h-14 rounded-2xl gradient-primary flex items-center justify-between px-5 shadow-lg transition-all active:scale-[0.98]"
            style={{ boxShadow: "0 8px 24px -4px rgba(80, 70, 230, 0.4)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">{totalItems} item</span>
            </div>
            <span className="text-white font-bold text-lg">Rp {totalPrice.toLocaleString("id-ID")}</span>
          </button>
        </div>
      )}

      {/* ── Mobile Cart Sheet ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end lg:hidden" onClick={e => e.target === e.currentTarget && setIsCartOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm " onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-background rounded-t-3xl max-h-[95vh] flex flex-col animate-in slide-in-from-bottom duration-300" style={{ boxShadow: "0 -8px 40px rgb(0 0 0 / 0.15)" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
              <h2 className="text-base font-bold text-foreground">
                {isCheckoutOpen ? "Konfirmasi Pembayaran" : `Keranjang (${totalItems})`}
              </h2>
              <div className="flex items-center gap-2">
                {!isCheckoutOpen && cart.length > 0 && (
                  <button 
                    onClick={handleClearCart}
                    className="text-xs font-bold text-rose-500 px-3 py-1 bg-rose-50 rounded-lg"
                  >
                    Batal
                  </button>
                )}
                <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scroll-area px-5">
              {isCheckoutOpen ? (
                <div className="space-y-8 py-6">
                  <div className="text-center py-1">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Tagihan</p>
                    <p className="text-2xl font-black text-foreground tracking-tight mt-0.5">
                      Rp {totalPrice.toLocaleString("id-ID")}
                    </p>
                    <p className="text-[0.625rem] text-muted-foreground">{totalItems} barang</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Metode Pembayaran</p>
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-150 text-center",
                            paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border bg-card"
                          )}
                        >
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", m.color)}>
                            <m.icon className="w-4 h-4" />
                          </div>
                          <p className="font-bold text-[9px] text-foreground leading-tight">{m.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod === "CASH" && (
                    <div className="space-y-4">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Nominal Uang</p>
                    <div className="flex flex-wrap gap-1.5">
                        {[1000, 2000, 5000, 10000, 20000, 50000, 100000].map(val => (
                          <button
                            key={val}
                            onClick={() => setCashTendered(prev => prev + val)}
                            className="w-[calc(25%-6px)] h-9 rounded-xl border border-border bg-card text-[9px] font-bold active:scale-95 transition-all flex items-center justify-center shrink-0"
                          >
                            +{val >= 1000 ? `${val/1000}k` : val}
                          </button>
                        ))}
                        <button
                          onClick={() => setCashTendered(totalPrice)}
                          className="w-[calc(25%-6px)] h-9 rounded-xl border border-primary/20 bg-primary/5 text-primary text-[9px] font-bold active:scale-95 transition-all flex items-center justify-center shrink-0"
                        >
                          Pas
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rp</span>
                        <Input
                          type="number"
                          className="h-12 pl-10 pr-4 bg-muted/40 border-none rounded-xl font-black text-lg"
                          placeholder="0"
                          value={cashTendered || ""}
                          onChange={e => setCashTendered(e.target.value === "" ? 0 : Number(e.target.value))}
                        />
                      </div>
                      <div className="flex justify-between items-center px-4 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Kembalian</span>
                        <span className="text-sm font-black text-emerald-600">
                          {cashTendered > totalPrice 
                            ? `Rp ${(cashTendered - totalPrice).toLocaleString("id-ID")}` 
                            : "-"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                cart.map(item => <CartRow key={item.id} item={item} onUpdate={updateCartQty} />)
              )}
            </div>

            <div className="px-5 pt-4 pb-[150px] space-y-3 bg-background" style={{ borderTop: "1px solid rgba(0,0,0,0.1)" }}>
              {isCheckoutOpen ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsCheckoutOpen(false)}
                    className="h-14 rounded-2xl bg-muted text-foreground font-bold text-sm transition-all active:scale-[0.98]"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="h-14 rounded-2xl gradient-primary text-white font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {isProcessing ? "Memproses..." : "Bayar Sekarang"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">Total Tagihan</span>
                    <span className="text-2xl font-bold text-foreground">Rp {totalPrice.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleSaveOpenBill}
                      className="h-13 rounded-2xl bg-muted text-foreground font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      Simpan Bill
                    </button>
                    <button
                      onClick={() => setIsCheckoutOpen(true)}
                      className="h-13 rounded-2xl gradient-primary text-white font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      Pembayaran
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ── Success Overlay ── */}
      {isSuccessOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="bg-background w-full max-w-sm rounded-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="bg-emerald-500 p-6 flex flex-col items-center text-white text-center">
              <motion.div 
                initial={{ scale: 0, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center mb-3 shadow-inner"
              >
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </motion.div>
              </motion.div>
              <h2 className="text-xl font-black tracking-tight mb-1">Pembayaran Berhasil!</h2>
              <p className="text-emerald-50 text-xs font-medium bg-black/10 px-3 py-1 rounded-full">
                Kembalian: Rp {Math.max(0, cashTendered - totalPrice).toLocaleString("id-ID")}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scroll-area">
              <ReceiptView 
                transaction={{
                  id: lastTxId || "baru",
                  date: Date.now(),
                  total: totalPrice,
                  paymentMethod: paymentMethod,
                  customerName: customerName,
                  customerPhone: customerPhone,
                  tableNumber: tableNumber,
                  cashTendered: cashTendered,
                  cashChange: Math.max(0, cashTendered - totalPrice),
                  status: "SETTLEMENT"
                }}
                profile={profile}
                receiptRef={receiptRef}
                items={cart.map((item: CartItem) => ({
                  name: item.name,
                  qty: item.cartQty,
                  unit: item.unit,
                  price: item.sellingPrice || 0,
                  subtotal: (item.sellingPrice || 0) * item.cartQty
                }))}
              />
            </div>

            <div className="p-6 bg-muted/30 border-t border-border grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  try {
                    if (!receiptRef.current) return;
                    const receiptHTML = receiptRef.current.outerHTML;
                    const printWindow = window.open('', '_blank', 'width=400,height=600');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Cetak Struk</title>
                          <style>
                            @page { margin: 0; size: 58mm auto; }
                            body { 
                              margin: 0; 
                              padding: 10px; 
                              width: 58mm; 
                              color: #000; 
                              font-family: monospace, sans-serif; 
                              background: #fff;
                            }
                            #receipt-print { 
                              border: none !important; 
                              border-radius: 0 !important; 
                              padding: 0 !important; 
                              width: 100% !important; 
                              margin: 0 !important; 
                              box-shadow: none !important;
                              background: transparent !important;
                            }
                            /* Ensure text is black and crisp for thermal */
                            * { color: #000 !important; }
                          </style>
                        </head>
                        <body>
                          ${receiptHTML}
                          <script>
                            window.onload = () => {
                              setTimeout(() => {
                                window.print();
                                window.close();
                              }, 500);
                            };
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  } catch (err) {
                    console.error("Print failed:", err);
                    alert("Gagal mencetak struk.");
                  }
                }}
                className="h-11 rounded-xl bg-white border border-border text-foreground text-xs font-bold flex items-center justify-center gap-2 touchable"
              >
                <Printer className="w-4 h-4 text-primary" /> Cetak
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!receiptRef.current) return;
                    // Add a small delay to ensure rendering is complete
                    const canvas = await html2canvas(receiptRef.current, {
                      scale: 3, // Higher quality
                      useCORS: true,
                      allowTaint: true,
                      backgroundColor: "#ffffff",
                      logging: false,
                    });

                    const image = canvas.toDataURL("image/png", 1.0);
                    const link = document.createElement("a");
                    link.download = `Struk-${lastTxId || "baru"}.png`;
                    link.href = image;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (err) {
                    console.error("Export failed:", err);
                    alert("Gagal mengekspor gambar. Silakan coba lagi.");
                  }
                }}
                className="h-11 rounded-xl bg-white border border-border text-foreground text-xs font-bold flex items-center justify-center gap-2 touchable"
              >
                <Download className="w-4 h-4 text-primary" /> Gambar
              </button>
              <button
                onClick={async () => {
                  const itemsList = cart.map((item: CartItem) => `- ${item.name} x${item.cartQty} : Rp ${((item.sellingPrice || 0) * item.cartQty).toLocaleString("id-ID")}`).join("\n");
                  const text = `*${profile?.name}*\n------------------\n${itemsList}\n------------------\n*Total: Rp ${totalPrice.toLocaleString("id-ID")}*\nID: ${lastTxId}\n\nTerima kasih telah berbelanja!`;

                  if (!receiptRef.current) return;

                  try {
                    const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: "#ffffff" });
                    
                    if (Capacitor.isNativePlatform()) {
                      const base64Data = canvas.toDataURL("image/png").split(",")[1];
                      const fileName = `Struk-${lastTxId}.png`;
                      
                      const result = await Filesystem.writeFile({
                        path: fileName,
                        data: base64Data,
                        directory: Directory.Cache,
                      });

                      await Share.share({
                        title: 'Struk Belanja',
                        text: text,
                        url: result.uri,
                        dialogTitle: 'Bagikan Struk',
                      });
                    } else {
                      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                      if (blob && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'struk.png', { type: 'image/png' })] })) {
                        const file = new File([blob], `Struk-${lastTxId}.png`, { type: 'image/png' });
                        await navigator.share({
                          files: [file],
                          title: 'Struk Belanja',
                          text: text
                        });
                      } else {
                        window.open(`https://wa.me/${customerPhone || ""}?text=${encodeURIComponent(text)}`, "_blank");
                      }
                    }
                  } catch (err) {
                    console.error("Share failed:", err);
                    window.open(`https://wa.me/${customerPhone || ""}?text=${encodeURIComponent(text)}`, "_blank");
                  }
                }}
                className="h-11 rounded-xl bg-white border border-border text-foreground text-xs font-bold flex items-center justify-center gap-2 touchable"
              >
                <Phone className="w-4 h-4 text-emerald-600" /> WhatsApp
              </button>
              <button
                onClick={() => {
                  setIsSuccessOpen(false);
                  setCart([]);
                  setCustomerName("");
                  setCustomerPhone("");
                  setTableNumber("");
                  setCashTendered(0);
                  setActiveBillId(null);
                }}
                className="h-11 rounded-xl gradient-primary text-white text-xs font-bold flex items-center justify-center gap-2 touchable shadow-lg"
              >
                Selesai <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Barcode Scanner Overlay ── */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col ">
          <div className="flex items-center justify-between px-5 pt-12 pb-4 text-white">
            <h2 className="text-base font-bold">Scan Barcode</h2>
            <button
              onClick={() => setIsScannerOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center">
            <div id="barcode-reader" className="w-full h-full max-h-[60vh]" />
            <div className="absolute inset-0 border-[2px] border-primary/50 pointer-events-none">
              <div className="absolute inset-0 bg-black/40" style={{ clipPath: "polygon(0% 0%, 0% 100%, 15% 100%, 15% 35%, 85% 35%, 85% 65%, 15% 65%, 15% 100%, 100% 100%, 100% 0%)" }} />
              <div className="absolute left-[15%] top-[35%] right-[15%] bottom-[35%] border-2 border-primary rounded-xl shadow-[0_0_20px_rgba(80,70,230,0.5)]" />
              <div className="absolute left-[15%] top-[50%] right-[15%] h-0.5 bg-primary animate-pulse" />
            </div>
          </div>

          <div className="p-8 text-center text-white/70">
            <p className="text-sm">Arahkan kamera ke barcode produk</p>
            <p className="text-[0.625rem] mt-2 opacity-50 uppercase tracking-widest">Powered by TokoKu Scanner</p>
          </div>
        </div>
      )}
      {/* ── Draft Bills Modal ── */}
      {isBillsOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 ">
          <div className="bg-background w-full max-w-md rounded-3xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Daftar Bill Tersimpan
              </h2>
              <button onClick={() => setIsBillsOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-area">
              {(!openBills || openBills.length === 0) ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-muted mx-auto flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Tidak ada bill tersimpan</p>
                </div>
              ) : (
                openBills?.map((tx: Transaction) => (
                  <div key={tx.id} className="flex items-stretch bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm group">
                    <button
                      onClick={() => handleRestoreBill(tx)}
                      className="flex-1 p-4 flex items-center justify-between touchable transition-colors hover:bg-muted/30"
                    >
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground leading-tight break-words">{tx.customerName || "Tanpa Nama"}</p>
                        <p className="text-[0.625rem] text-muted-foreground mt-0.5">
                          {new Date(tx.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · ID: {tx.id}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-bold text-primary">Rp {tx.total.toLocaleString("id-ID")}</p>
                        <span className="text-[0.625rem] font-bold text-muted-foreground flex items-center justify-end gap-1">
                          Buka <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBill(tx.id);
                      }}
                      className="w-12 border-l border-border/50 flex items-center justify-center bg-rose-50/30 text-rose-500 hover:bg-rose-50 transition-colors touchable"
                      title="Hapus Bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-5 bg-muted/30 border-t border-border">
              <p className="text-[0.625rem] text-center text-muted-foreground leading-relaxed">
                Bill tersimpan (draft) akan muncul di sini. Anda dapat melanjutkannya kapan saja sebelum diselesaikan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
