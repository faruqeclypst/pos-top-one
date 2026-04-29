"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db, { type Product } from "@/lib/db";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import {
  Search, ScanLine, Plus, Package, Minus, X, ChevronRight,
  ShoppingBag, CheckCircle2, Bluetooth, CreditCard, Banknote, QrCode,
  Trash2, User, Save, Share2, Download, Printer, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { Html5Qrcode } from "html5-qrcode";

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

// ── Product Card ──────────────────────────────────────────
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
    <button
      onClick={() => !outOfStock && onAdd(product)}
      disabled={outOfStock}
      className={cn(
        "relative flex flex-col rounded-2xl overflow-hidden text-left transition-all duration-150 active:scale-[0.97]",
        "bg-card border border-border/60",
        outOfStock ? "opacity-50" : "hover:border-primary/30 hover:shadow-md"
      )}
      style={{ boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)" }}
    >
      <div className="aspect-[1/1] w-full bg-muted/60 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-12 h-12 text-muted-foreground/30" />
        )}
      </div>

      <div className="p-2 space-y-0.5">
        <p className="text-[10px] font-bold text-foreground truncate">{product.name}</p>
        <p className="text-xs font-black text-primary">Rp {(product.sellingPrice || 0).toLocaleString("id-ID")}</p>
        <p className="text-[9px] text-muted-foreground">Stok: {product.stock} {product.unit}</p>
      </div>

      {!outOfStock && (
        <div className="absolute bottom-3 right-3 w-7 h-7 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Plus className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
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
    <div className={cn("flex items-center gap-3 py-3.5 border-b border-border/50 last:border-0", isCompact && "py-2.5")}>
      <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-5 h-5 text-muted-foreground/40" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
        <p className="text-xs text-primary font-medium mt-0.5">Rp {(item.sellingPrice || 0).toLocaleString("id-ID")}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0 bg-muted/40 rounded-xl p-1">
        <button
          onClick={() => onUpdate(item.id, -1)}
          className="w-7 h-7 rounded-lg bg-background border border-border/60 flex items-center justify-center touchable"
        >
          {item.cartQty === 1 ? <Trash2 className="w-3.5 h-3.5 text-destructive" /> : <Minus className="w-3.5 h-3.5 text-foreground" />}
        </button>
        <span className="w-6 text-center text-sm font-bold text-foreground">{item.cartQty}</span>
        <button
          onClick={() => onUpdate(item.id, 1)}
          className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center touchable shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
      
      {!isCompact && (
        <p className="text-sm font-bold text-foreground w-20 text-right shrink-0">
          Rp {((item.sellingPrice || 0) * item.cartQty).toLocaleString("id-ID")}
        </p>
      )}
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
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTxId, setLastTxId] = useState("");
  const receiptRef = useRef<HTMLDivElement>(null);
  const { profile } = useStoreProfile();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          const product = products?.find(p => p.sku === decodedText || p.id.toString() === decodedText || p.barcode === decodedText);
          if (product) {
            addToCart(product);
            setIsScannerOpen(false);
          }
        },
        () => {}
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

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  );

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
      await db.transactions.put({ 
        id: txId, 
        date: Date.now(), 
        total: totalPrice, 
        paymentMethod, 
        status: "SETTLEMENT",
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        tableNumber: tableNumber || undefined
      });
      for (const item of cart) {
        await db.transactionItems.put({
          transactionId: txId, productId: item.id,
          qty: item.cartQty, priceAtTransaction: item.sellingPrice || 0, subtotal: (item.sellingPrice || 0) * item.cartQty
        });
        await db.products.update(item.id, { stock: item.stock - item.cartQty });
        await db.stockMutations.put({ productId: item.id, type: "OUT", quantity: item.cartQty, referenceId: txId, createdAt: Date.now() });
      }
      setLastTxId(txId);
      // We don't reset cart immediately so receipt can show it
      // But we prevent further edits
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setIsSuccessOpen(true);
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
      const txId = `OPEN-${Date.now()}`;
      await db.transactions.put({
        id: txId,
        date: Date.now(),
        total: totalPrice,
        paymentMethod: "CASH",
        status: "OPEN",
        customerName: customerName || "Pelanggan",
        tableNumber: tableNumber || undefined
      });
      for (const item of cart) {
        await db.transactionItems.put({
          transactionId: txId, productId: item.id,
          qty: item.cartQty, priceAtTransaction: item.sellingPrice || 0, subtotal: (item.sellingPrice || 0) * item.cartQty
        });
      }
      alert("Bill berhasil disimpan.");
      setCart([]);
      setCustomerName("");
      setTableNumber("");
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan bill.");
    }
  };

  if (!products) return <POSSkeleton />;

  return (
    <div className="flex flex-col lg:flex-row h-full bg-background relative overflow-hidden">
      {/* ── Left Side: Products ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Search Bar */}
        <div className="px-4 pt-5 pb-3 bg-background/95 sticky top-0 z-10 lg:static" style={{ backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-foreground">Kasir</h1>
            <div className="lg:hidden flex gap-2">
               {/* Mobile icons could go here */}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full h-11 pl-10 pr-4 bg-muted/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                placeholder="Cari barang atau scan barcode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center touchable shrink-0"
              onClick={handleScanBarcode}
            >
              <ScanLine className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto scroll-area px-4 pb-32 lg:pb-8">
          {filtered?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Barang tidak ditemukan</p>
              <p className="text-xs text-muted-foreground">Coba kata kunci lain</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3 lg:gap-4">
              {filtered?.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Side: Sidebar Cart (Desktop Only) ── */}
      <div className="hidden lg:flex flex-col w-[380px] border-l border-border bg-card/30 backdrop-blur-md">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-border/50">
          <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Pesanan Baru
          </h2>
          
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
          </div>
        </div>

        {/* Sidebar Items */}
        <div className="flex-1 overflow-y-auto scroll-area px-5 py-2">
          {cart.length === 0 ? (
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
        <div className="p-5 bg-card border-t border-border/50 space-y-4">
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

          <div className="grid grid-cols-2 gap-2">
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
          </div>
        </div>
      </div>

      {/* ── Mobile Cart FAB ── */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed lg:hidden bottom-[72px] left-0 right-0 px-4 z-20">
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-background rounded-t-3xl max-h-[82vh] flex flex-col animate-in slide-in-from-bottom duration-300" style={{ boxShadow: "0 -8px 40px rgb(0 0 0 / 0.15)" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
              <h2 className="text-base font-bold text-foreground">Keranjang ({totalItems})</h2>
              <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scroll-area px-5">
              {cart.map(item => <CartRow key={item.id} item={item} onUpdate={updateCartQty} />)}
            </div>

            <div className="px-5 pt-4 pb-[88px] space-y-3 bg-background" style={{ borderTop: "1px solid rgba(0,0,0,0.1)" }}>
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
            </div>
          </div>
        </div>
      )}

      {/* ── Checkout Screen (Universal) ── */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-3 px-5 pt-4 pb-2 border-b border-border/50">
            <button onClick={() => setIsCheckoutOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
            <h2 className="text-sm font-bold text-foreground">Konfirmasi Pembayaran</h2>
          </div>

          <div className="flex-1 overflow-y-auto scroll-area p-4 space-y-4 max-w-2xl mx-auto w-full">
            <div className="text-center py-2">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Total Tagihan</p>
              <p className="text-3xl font-black text-foreground tracking-tight mt-1">
                Rp {totalPrice.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{totalItems} barang</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Metode Pembayaran</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all duration-150 text-center",
                      paymentMethod === m.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", m.color)}>
                      <m.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[10px] text-foreground leading-tight">{m.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card-premium p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Ringkasan</p>
              {customerName && (
                <div className="flex justify-between text-[11px] mb-1 pb-1 border-b border-border/30">
                  <span className="text-muted-foreground">Pelanggan</span>
                  <span className="font-medium">{customerName} {tableNumber ? `(Meja ${tableNumber})` : ""}</span>
                </div>
              )}
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-[11px]">
                  <span className="text-foreground truncate flex-1 pr-4">{item.name} ×{item.cartQty}</span>
                  <span className="font-medium text-foreground shrink-0">Rp {((item.sellingPrice || 0) * item.cartQty).toLocaleString("id-ID")}</span>
                </div>
              ))}
              <div className="border-t border-border/50 mt-2 pt-2 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span className="text-primary">Rp {totalPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <button className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-border text-muted-foreground hover:bg-muted/30 transition-colors">
              <Bluetooth className="w-4 h-4" />
              <span className="text-[10px] font-medium text-left flex-1">Printer Bluetooth</span>
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="px-5 pt-3 pb-[88px] bg-background border-t border-border/50 max-w-2xl mx-auto w-full">
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full h-12 rounded-xl gradient-primary text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg"
            >
              {isProcessing ? (
                <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              {isProcessing ? "Memproses..." : "Selesaikan Transaksi"}
            </button>
          </div>
        </div>
      )}

      {/* ── Success Overlay ── */}
      {isSuccessOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-background w-full max-w-sm rounded-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="flex-1 overflow-y-auto p-6 scroll-area">
              {/* Actual Receipt to Capture */}
                <div id="receipt-print" ref={receiptRef} style={{ backgroundColor: "#ffffff", color: "#333333", padding: "24px", borderRadius: "12px", border: "1px dashed #e5e7eb", fontFamily: "monospace", fontSize: "11px", lineHeight: "1.6" }}>
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <p style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4px 0" }}>{profile?.name}</p>
                    <p style={{ opacity: 0.7, margin: "0" }}>{profile?.address}</p>
                    <p style={{ opacity: 0.7, margin: "0" }}>Telp: {profile?.phone}</p>
                  </div>
                  
                  <div style={{ borderBottom: "1px dashed #cccccc", margin: "12px 0" }} />
                  
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>No: {lastTxId}</span>
                      <span>{new Date().toLocaleDateString("id-ID")}</span>
                    </div>
                    {customerName && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Plg: {customerName}</span>
                        {tableNumber && <span>Meja: {tableNumber}</span>}
                      </div>
                    )}
                    {customerPhone && <div>HP: {customerPhone}</div>}
                  </div>

                  <div style={{ borderBottom: "1px dashed #cccccc", margin: "12px 0" }} />

                  <div style={{ marginBottom: "12px" }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                          <span>{item.name}</span>
                          <span>{((item.sellingPrice || 0) * item.cartQty).toLocaleString("id-ID")}</span>
                        </div>
                        <div style={{ opacity: 0.7 }}>
                          {item.cartQty} {item.unit} x {(item.sellingPrice || 0).toLocaleString("id-ID")}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderBottom: "1px dashed #cccccc", margin: "12px 0" }} />

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "bold" }}>
                      <span>TOTAL</span>
                      <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.7 }}>
                      <span>Metode</span>
                      <span>{paymentMethod}</span>
                    </div>
                  </div>

                  <div style={{ borderBottom: "1px dashed #cccccc", margin: "12px 0" }} />

                  <div style={{ textAlign: "center", opacity: 0.7, marginTop: "16px", fontStyle: "italic" }}>
                    <p style={{ margin: "0" }}>Terima Kasih Telah Berbelanja</p>
                    <p style={{ margin: "0" }}>Di {profile?.name}</p>
                  </div>
                </div>
            </div>

            <div className="p-6 bg-muted/30 border-t border-border grid grid-cols-2 gap-2">
              <button 
                onClick={() => window.print()}
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
                  const itemsList = cart.map(item => `- ${item.name} x${item.cartQty} : Rp ${((item.sellingPrice || 0) * item.cartQty).toLocaleString("id-ID")}`).join("\n");
                  const text = `*${profile?.name}*\n------------------\n${itemsList}\n------------------\n*Total: Rp ${totalPrice.toLocaleString("id-ID")}*\nID: ${lastTxId}\n\nTerima kasih telah berbelanja!`;
                  
                  if (!receiptRef.current) return;

                  try {
                    const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: "#ffffff" });
                    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                    
                    // Check if browser supports sharing files
                    if (blob && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'struk.png', { type: 'image/png' })] })) {
                      const file = new File([blob], `Struk-${lastTxId}.png`, { type: 'image/png' });
                      await navigator.share({
                        files: [file],
                        title: 'Struk Belanja',
                        text: text
                      });
                    } else {
                      // Fallback to text-only WhatsApp if file share not supported
                      window.open(`https://wa.me/${customerPhone || ""}?text=${encodeURIComponent(text)}`, "_blank");
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
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
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
            <p className="text-[10px] mt-2 opacity-50 uppercase tracking-widest">Powered by TokoKu Scanner</p>
          </div>
        </div>
      )}
    </div>
  );
}
