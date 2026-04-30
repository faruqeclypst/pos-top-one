"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db, { type Transaction } from "@/lib/db";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import {
  TrendingUp, Download, Share2, Calendar,
  ShoppingCart, BarChart3, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CategoryBar from "@/components/CategoryBar";

const RANGES = [
  { id: "today", label: "Hari Ini" },
  { id: "yesterday", label: "Kemarin" },
  { id: "week", label: "7 Hari" },
  { id: "month", label: "Bulan Ini" },
  { id: "last_month", label: "Bulan Lalu" },
  { id: "year", label: "Tahun Ini" },
];

const PAYMENT_COLORS: Record<string, string> = {
  CASH: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  QRIS: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  TRANSFER: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
};

function filterByRange(all: Transaction[], range: string): Transaction[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDay = 86400000;

  return all.filter(t => {
    const d = t.date;
    const dt = new Date(d);
    
    if (range === "today") return dt.toDateString() === now.toDateString();
    
    if (range === "yesterday") {
      const yesterday = new Date(startOfToday - oneDay);
      return dt.toDateString() === yesterday.toDateString();
    }
    
    if (range === "week") return d >= startOfToday - (7 * oneDay);
    
    if (range === "month") {
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }
    
    if (range === "last_month") {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return dt.getMonth() === lastMonth && dt.getFullYear() === lastMonthYear;
    }
    
    if (range === "year") return dt.getFullYear() === now.getFullYear();
    
    return true;
  });
}

function ReportsSkeleton() {
  return (
    <div className="">
      <div className="w-full h-48 shimmer mb-6" />
      <div className="px-4 space-y-4 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl shimmer" />)}
        </div>
        <div className="h-40 rounded-2xl shimmer" />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { profile } = useStoreProfile();
  const [range, setRange] = useState("today");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const allTransactions = useLiveQuery(() => db.transactions.reverse().toArray());
  const allItems = useLiveQuery(() => db.transactionItems.toArray());
  const products = useLiveQuery(() => db.products.toArray());

  if (!allTransactions || !allItems || !products) return <ReportsSkeleton />;

  // Filter logic
  const filteredByRange = filterByRange(allTransactions, range);
  
  // Filter by category
  let transactions = filteredByRange;
  if (selectedCategory !== "All") {
    // Find product IDs in this category
    const categoryProductIds = products
      .filter(p => p.category === selectedCategory)
      .map(p => p.id);
    
    // Find transaction IDs that contain these products
    const validTxIds = new Set(
      allItems
        .filter(item => categoryProductIds.includes(item.productId))
        .map(item => item.transactionId)
    );
    
    transactions = filteredByRange.filter(t => validTxIds.has(t.id));
  }

  const totalSales = transactions.reduce((s, t) => s + t.total, 0);
  const totalTrx = transactions.length;
  const avgOrder = totalTrx > 0 ? totalSales / totalTrx : 0;

  // Payment breakdown
  const byMethod: Record<string, number> = {};
  transactions.forEach(t => {
    byMethod[t.paymentMethod] = (byMethod[t.paymentMethod] || 0) + t.total;
  });

  const handleExport = () => {
    if (!transactions.length) return alert("Tidak ada data untuk diekspor");
    const csv = ["ID,Tanggal,Total,Metode,Status", ...transactions.map(t =>
      `${t.id},${new Date(t.date).toLocaleString("id-ID")},${t.total},${t.paymentMethod},${t.status}`
    )].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Laporan-${range}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleShareWA = () => {
    const rangeName = RANGES.find(r => r.id === range)?.label;
    const msg = `*Laporan ${profile?.name || "TokoKu"}*\n_Periode: ${rangeName}_\n\n📊 Total Transaksi: *${totalTrx}*\n💰 Pendapatan: *Rp ${totalSales.toLocaleString("id-ID")}*\n📈 Rata-rata: *Rp ${Math.round(avgOrder).toLocaleString("id-ID")}*\n\nDikirim via TokoKu POS ✅`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="pb-32  min-h-screen bg-background">
      <PageHeader
        title="Laporan Bisnis"
        subtitle="Analisis Performa"
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl bg-card border-border/50 shadow-sm"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleShareWA}
              className="h-10 rounded-xl gradient-primary text-white shadow-lg shadow-primary/20 gap-2 font-bold text-xs"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">BAGIKAN</span>
            </Button>
          </div>
        }
      />
      
      <div className="bg-card/50 backdrop-blur-md border-b border-border/50 sticky top-[73px] z-30 transition-all duration-300">
        <div className="max-w-[1600px] mx-auto w-full px-5 py-4 space-y-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {RANGES.map(r => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  range === r.id 
                    ? "bg-primary text-white" 
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <CategoryBar 
            selectedCategory={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
        </div>
      </div>

      <div className="w-full px-5 pt-8 mx-auto space-y-8 max-w-[1600px] pb-32">
        {/* Main Revenue Card */}
        <div className="">
          <Card className="gradient-primary border-none p-8 relative overflow-hidden text-white shadow-2xl shadow-primary/30 rounded-[2rem]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-20 -mt-20 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 blur-[60px] rounded-full -ml-20 -mb-20" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-2xl w-11 h-11 flex items-center justify-center overflow-hidden shadow-sm">
                  <img src="/logo-default.png" alt="Logo" className="w-full h-full object-contain block dark:hidden" />
                  <img src="/logo-dark.png" alt="Logo" className="w-full h-full object-contain hidden dark:block" />
                </div>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md px-3 py-1 font-black text-[0.625rem] tracking-widest uppercase">
                  {RANGES.find(r => r.id === range)?.label}
                </Badge>
              </div>
              
              <div>
                <p className="text-white/70 text-xs font-bold uppercase tracking-[0.2em] mb-2">Total Pendapatan</p>
                <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">
                  Rp {totalSales.toLocaleString("id-ID")}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div>
                  <p className="text-white/60 text-[0.625rem] font-bold uppercase tracking-widest mb-1">Transaksi</p>
                  <p className="text-xl font-black">{totalTrx} Trx</p>
                </div>
                <div>
                  <p className="text-white/60 text-[0.625rem] font-bold uppercase tracking-widest mb-1">Rata-rata</p>
                  <p className="text-xl font-black">Rp {Math.round(avgOrder).toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-300 delay-150 fill-mode-both">
          {Object.entries(byMethod).map(([method, amount]) => (
            <Card key={method} className="p-4 border-none shadow-sm bg-card/40 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl", 
                  method === "CASH" ? "bg-emerald-500/10 text-emerald-500" :
                  method === "QRIS" ? "bg-blue-500/10 text-blue-500" : 
                  "bg-violet-500/10 text-violet-500"
                )}>
                  {method === "CASH" ? <CreditCard className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-[0.625rem] font-bold text-muted-foreground uppercase tracking-widest">{method}</p>
                  <p className="text-sm font-black text-foreground">Rp {amount.toLocaleString("id-ID")}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Transaction History */}
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300 delay-300 fill-mode-both">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Riwayat Penjualan</h3>
            <Badge variant="outline" className="text-[0.5625rem] font-bold border-muted-foreground/20 text-muted-foreground uppercase">
              {transactions.length} Transaksi
            </Badge>
          </div>
          
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="py-20 text-center bg-muted/20 rounded-[2rem] border border-dashed border-muted-foreground/10">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Belum ada transaksi</p>
              </div>
            ) : (
              transactions.map((t) => (
                <Card key={t.id} className="p-4 border-none shadow-sm bg-card/40 backdrop-blur-sm flex items-center justify-between group hover:bg-card/60 transition-all duration-300 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-foreground">Trx #{t.id.slice(-4)}</p>
                        <Badge className={cn("text-[0.5625rem] font-bold px-1.5 h-4 border-none", PAYMENT_COLORS[t.paymentMethod])}>
                          {t.paymentMethod}
                        </Badge>
                      </div>
                      <p className="text-[0.625rem] text-muted-foreground">
                        {new Date(t.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-foreground">Rp {t.total.toLocaleString("id-ID")}</p>
                    <p className="text-[0.5625rem] font-bold text-emerald-500 uppercase tracking-widest">Sukses</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
