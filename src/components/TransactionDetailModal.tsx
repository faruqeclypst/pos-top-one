"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db, { Transaction, TransactionItem, Product } from "@/lib/db";
import { 
  X, ShoppingCart, Calendar, CreditCard, 
  User, MapPin, Package, Receipt, Printer, Download, Phone, ChevronRight, Share2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { useRef } from "react";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import { createPortal } from "react-dom";
import ReceiptView from "./ReceiptView";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  const { profile } = useStoreProfile();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  const items = useLiveQuery(async () => {
    if (!transaction) return [];
    return db.transactionItems.where("transactionId").equals(transaction.id).toArray();
  }, [transaction]);

  const products = useLiveQuery(() => db.products.toArray());

  if (!transaction || !mounted) return null;

  const PAYMENT_COLORS: Record<string, string> = {
    CASH: "bg-emerald-500/10 text-emerald-600",
    TRANSFER: "bg-blue-500/10 text-blue-600",
    QRIS: "bg-violet-500/10 text-violet-600",
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ zIndex: 99999 }}>
      <div className="bg-background w-full max-w-md rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-5 border-b border-border/50 flex items-center justify-between bg-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Detail Transaksi</h2>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">#{String(transaction.id).slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scroll-area">
          {/* Status & Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-muted/30 space-y-1">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-2.5 h-2.5" /> Waktu
              </p>
              <p className="text-[10px] font-bold text-foreground">
                {new Date(transaction.date).toLocaleString("id-ID", { 
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/30 space-y-1">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <CreditCard className="w-2.5 h-2.5" /> Metode
              </p>
              <Badge className={cn("text-[9px] font-black px-2 h-5 border-none", PAYMENT_COLORS[transaction.paymentMethod] || "bg-muted text-muted-foreground")}>
                {transaction.paymentMethod}
              </Badge>
            </div>
          </div>

          {/* Customer Info (If exists) */}
          {(transaction.customerName || transaction.tableNumber) && (
            <div className="p-4 rounded-2xl border border-dashed border-border/50 space-y-3">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Informasi Pelanggan</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold">{transaction.customerName || "Pelanggan"}</span>
                </div>
                {transaction.tableNumber && (
                  <Badge variant="outline" className="text-[9px] font-bold">Meja {transaction.tableNumber}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-3">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Daftar Belanja</p>
            <div className="space-y-2">
              {items?.map((item) => {
                const product = products?.find(p => p.id === item.productId);
                return (
                  <div key={item.id} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
                      {product?.image ? (
                        <img 
                          src={URL.createObjectURL(product.image)} 
                          alt="" 
                          className="w-full h-full object-contain p-1" 
                        />
                      ) : (
                        <Package className="w-4 h-4 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{product?.name || "Produk dihapus"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.qty} {product?.unit || "Pcs"} × Rp {item.priceAtTransaction.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-foreground">Rp {item.subtotal.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="pt-4 border-t border-border/50 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="font-bold text-foreground">Rp {transaction.total.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-black pt-1">
              <span className="text-foreground">Total Akhir</span>
              <span className="text-primary">Rp {transaction.total.toLocaleString("id-ID")}</span>
            </div>
            
            {transaction.paymentMethod === "CASH" && transaction.cashTendered !== undefined && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-emerald-600 font-bold uppercase tracking-wider">Bayar (Tunai)</span>
                  <span className="font-black text-emerald-700">Rp {transaction.cashTendered.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-600 font-bold uppercase tracking-wider">Kembali</span>
                  <span className="font-black text-emerald-700">Rp {(transaction.cashChange || 0).toLocaleString("id-ID")}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-card border-t border-border/50 grid grid-cols-3 gap-2">
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
            className="h-11 rounded-xl bg-muted/40 border border-border/10 flex flex-col items-center justify-center gap-1 text-[8px] font-black uppercase tracking-widest text-foreground hover:bg-muted/60 transition-all touchable"
          >
            <Printer className="w-4 h-4 text-primary" />
            Cetak
          </button>
          <button 
            onClick={async () => {
              try {
                if (!receiptRef.current) return;
                const canvas = await html2canvas(receiptRef.current, {
                  scale: 3, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", logging: false,
                });
                const image = canvas.toDataURL("image/png", 1.0);
                const link = document.createElement("a");
                link.download = `Struk-${transaction.id}.png`;
                link.href = image;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } catch (err) {
                console.error("Export failed:", err);
              }
            }}
            className="h-11 rounded-xl bg-muted/40 border border-border/10 flex flex-col items-center justify-center gap-1 text-[8px] font-black uppercase tracking-widest text-foreground hover:bg-muted/60 transition-all touchable"
          >
            <Download className="w-4 h-4 text-primary" />
            Gambar
          </button>
          <button 
            onClick={async () => {
              const receiptItems = items?.map(item => {
                const product = products?.find(p => p.id === item.productId);
                return `- ${product?.name || "Produk"} x${item.qty} : Rp ${item.subtotal.toLocaleString("id-ID")}`;
              }).join("\n");
              const text = `*${profile?.name}*\n------------------\n${receiptItems}\n------------------\n*Total: Rp ${transaction.total.toLocaleString("id-ID")}*\nID: ${transaction.id}\n\nTerima kasih telah berbelanja!`;

              if (!receiptRef.current) return;

              try {
                const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: "#ffffff" });
                
                if (Capacitor.isNativePlatform()) {
                  const base64Data = canvas.toDataURL("image/png").split(",")[1];
                  const fileName = `Struk-${transaction.id}.png`;
                  const result = await Filesystem.writeFile({
                    path: fileName, data: base64Data, directory: Directory.Cache,
                  });
                  await Share.share({
                    title: 'Struk Belanja', text: text, url: result.uri, dialogTitle: 'Bagikan Struk',
                  });
                } else {
                  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                  if (blob && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'struk.png', { type: 'image/png' })] })) {
                    const file = new File([blob], `Struk-${transaction.id}.png`, { type: 'image/png' });
                    await navigator.share({ files: [file], title: 'Struk Belanja', text: text });
                  } else {
                    window.open(`https://wa.me/${transaction.customerPhone || ""}?text=${encodeURIComponent(text)}`, "_blank");
                  }
                }
              } catch (err) {
                console.error("Share failed:", err);
                window.open(`https://wa.me/${transaction.customerPhone || ""}?text=${encodeURIComponent(text)}`, "_blank");
              }
            }}
            className="h-11 rounded-xl bg-muted/40 border border-border/10 flex flex-col items-center justify-center gap-1 text-[8px] font-black uppercase tracking-widest text-foreground hover:bg-muted/60 transition-all touchable"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            WhatsApp
          </button>
        </div>

        {/* Hidden Receipt for Capturing */}
        <div className="absolute opacity-0 pointer-events-none -z-50 left-[-9999px]">
           <ReceiptView 
             transaction={transaction} 
             profile={profile} 
             receiptRef={receiptRef}
             items={items?.map(item => ({
               name: products?.find(p => p.id === item.productId)?.name || "Produk",
               qty: item.qty,
               unit: products?.find(p => p.id === item.productId)?.unit || "Pcs",
               price: item.priceAtTransaction,
               subtotal: item.subtotal
             })) || []}
           />
        </div>
      </div>
    </div>,
    document.body
  );
}
