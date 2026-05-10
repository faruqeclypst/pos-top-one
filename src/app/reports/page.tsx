"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db, { type Transaction } from "@/lib/db";
import TransactionDetailModal from "@/components/TransactionDetailModal";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import {
  TrendingUp, Download, Share2, Calendar,
  ShoppingCart, BarChart3, CreditCard, X, Banknote, QrCode, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CategoryBar from "@/components/CategoryBar";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";

const RANGES = [
  { id: "today", label: "Hari Ini" },
  { id: "yesterday", label: "Kemarin" },
  { id: "week", label: "7 Hari" },
  { id: "month", label: "Bulan Ini" },
  { id: "last_month", label: "Bulan Lalu" },
  { id: "year", label: "Tahun Ini" },
  { id: "custom", label: "Pilih Tanggal" },
  { id: "range", label: "Rentang Tanggal" },
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
    
    if (range.startsWith("date:")) {
      const targetDate = range.split("date:")[1];
      return dt.toISOString().split("T")[0] === targetDate;
    }

    if (range.startsWith("range:")) {
      const [start, end] = range.split("range:")[1].split("_");
      const st = new Date(start).getTime();
      const et = new Date(end).getTime() + 86399999; // End of day
      return d >= st && d <= et;
    }
    
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showRangeSelector, setShowRangeSelector] = useState(false);
  const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
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
    const categoryProductIds = products
      .filter(p => p.category === selectedCategory)
      .map(p => p.id);
    const validTxIds = new Set(
      allItems
        .filter(item => categoryProductIds.includes(item.productId))
        .map(item => item.transactionId)
    );
    transactions = filteredByRange.filter(t => validTxIds.has(t.id));
  }

  // ── Basic Stats ──
  const totalSales = transactions.reduce((s, t) => s + t.total, 0);
  const totalTrx = transactions.length;
  const avgOrder = totalTrx > 0 ? totalSales / totalTrx : 0;

  // ── Profit / Loss Calculations ──
  const productMap = new Map(products.map(p => [p.id, p]));
  
  // Build a map of transactionId -> items for fast lookup
  const itemsByTxId = new Map<string, typeof allItems>();
  allItems.forEach(item => {
    const existing = itemsByTxId.get(item.transactionId);
    if (existing) existing.push(item);
    else itemsByTxId.set(item.transactionId, [item]);
  });

  let totalCOGS = 0;
  let totalSoldQty = 0;
  const productSales: Record<string, { qty: number; revenue: number; cogs: number; name: string }> = {};

  transactions.forEach(tx => {
    const txItems = itemsByTxId.get(tx.id) || [];
    txItems.forEach(item => {
      const prod = productMap.get(item.productId);
      const itemCOGS = prod ? (prod.cogs || 0) * item.qty : 0;
      totalCOGS += itemCOGS;
      totalSoldQty += item.qty;

      if (!productSales[item.productId]) {
        productSales[item.productId] = { qty: 0, revenue: 0, cogs: 0, name: prod?.name || "Produk Dihapus" };
      }
      productSales[item.productId].qty += item.qty;
      productSales[item.productId].revenue += item.subtotal;
      productSales[item.productId].cogs += itemCOGS;
    });
  });

  const grossProfit = totalSales - totalCOGS;
  const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

  // ── Cancelled Transactions ──
  const cancelledTx = transactions.filter(t => t.status === "CANCELLED");
  const cancelledRevenue = cancelledTx.reduce((s, t) => s + t.total, 0);

  // ── Top Products (sorted by revenue) ──
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10);

  // Payment breakdown
  const byMethod: Record<string, number> = {};
  transactions.forEach(t => {
    byMethod[t.paymentMethod] = (byMethod[t.paymentMethod] || 0) + t.total;
  });

  // ── Hourly Breakdown ──
  const hourlySales: Record<string, number> = {};
  transactions.forEach(t => {
    const hour = new Date(t.date).getHours().toString().padStart(2, "0") + ":00";
    hourlySales[hour] = (hourlySales[hour] || 0) + t.total;
  });

  const handleExport = async () => {
    if (!transactions.length) return alert("Tidak ada data untuk diekspor");
    const csv = ["ID,Tanggal,Total,Metode,Status", ...transactions.map(t =>
      `${t.id},${new Date(t.date).toLocaleString("id-ID")},${t.total},${t.paymentMethod},${t.status}`
    )].join("\n");

    const fileName = `Laporan-${range}-${new Date().toISOString().split("T")[0]}.csv`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: csv,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: 'Ekspor Laporan',
          url: result.uri,
          dialogTitle: 'Simpan atau Bagikan Laporan',
        });
      } catch (err) {
        console.error("Export failed:", err);
        alert("Gagal mengekspor laporan.");
      }
    } else {
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
    }
  };

  const handleShareWA = async () => {
    const rangeName = RANGES.find(r => r.id === range)?.label;
    const msg = `*Laporan ${profile?.name || "TokoKu"}*\n_Periode: ${rangeName}_\n\n📊 Total Transaksi: *${totalTrx}*\n💰 Pendapatan: *Rp ${totalSales.toLocaleString("id-ID")}*\n📈 Rata-rata: *Rp ${Math.round(avgOrder).toLocaleString("id-ID")}*\n💵 HPP: *Rp ${totalCOGS.toLocaleString("id-ID")}*\n✅ Laba Kotor: *Rp ${grossProfit.toLocaleString("id-ID")}* (${grossMargin.toFixed(1)}%)\n\nDikirim via TokoKu POS ✅`;
    
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: 'Bagi Laporan',
        text: msg,
        dialogTitle: 'Bagikan via WhatsApp atau Aplikasi Lain',
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-background">
      <PageHeader
        title="Laporan Bisnis"
        subtitle="Analisis Performa"
        actions={
          <div className="flex items-center gap-2">
            {/* New Compact Filter Button */}
            <div className="relative">
              <Button
                onClick={() => setShowRangeSelector(!showRangeSelector)}
                variant="outline"
                className="h-10 rounded-xl bg-card border-border/50 shadow-sm gap-2 text-[10px] font-black uppercase tracking-wider px-3"
              >
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {range.startsWith("date:") 
                  ? selectedDate 
                  : range.startsWith("range:") 
                    ? "Rentang Tanggal"
                    : RANGES.find(r => r.id === range)?.label}
              </Button>

              {showRangeSelector && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border shadow-2xl rounded-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-1.5 grid grid-cols-1 gap-1">
                    {RANGES.map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          if (r.id === "custom") {
                            // Trigger date picker
                            const dateInput = document.getElementById("date-picker-hidden") as HTMLInputElement;
                            dateInput?.showPicker();
                          } else if (r.id === "range") {
                            setShowCustomRangeModal(true);
                            setShowRangeSelector(false);
                          } else {
                            setRange(r.id);
                            setShowRangeSelector(false);
                          }
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all",
                          (range === r.id || 
                           (r.id === "custom" && range.startsWith("date:")) ||
                           (r.id === "range" && range.startsWith("range:")))
                            ? "bg-primary text-white" 
                            : "hover:bg-muted text-muted-foreground"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Range Text for header */}
            {range.startsWith("range:") && (
              <div className="hidden md:block px-3 py-1.5 bg-muted/30 rounded-xl border border-border/50 text-[10px] font-bold text-muted-foreground">
                {range.split("range:")[1].replace("_", " s/d ")}
              </div>
            )}

            {/* Hidden Date Picker */}
            <input 
              type="date" 
              id="date-picker-hidden" 
              className="absolute opacity-0 pointer-events-none"
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setRange(`date:${val}`);
                  setSelectedDate(val);
                  setShowRangeSelector(false);
                }
              }}
            />

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
              className="h-10 rounded-xl gradient-primary text-white shadow-lg shadow-primary/20 gap-2 font-bold text-xs px-4"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">BAGIKAN</span>
            </Button>
          </div>
        }
      />
      
      <div className="bg-card/50 border-b border-border/50 sticky top-[73px] z-30">
        <div className="max-w-[1600px] mx-auto w-full px-5 py-3">
          <CategoryBar 
            selectedCategory={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
        </div>
      </div>

      <div className="w-full px-5 pt-6 mx-auto space-y-5 max-w-[1600px] pb-20">

        {/* ── Row 1: Revenue Hero + Profit Summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Hero - 2 cols */}
          <div className="lg:col-span-2">
            <Card className="gradient-primary border-none p-6 relative overflow-hidden text-white shadow-xl shadow-primary/30 rounded-[2rem]">
              <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 blur-[80px] rounded-full -mr-24 -mt-24" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 blur-[60px] rounded-full -ml-24 -mb-24" />
              <div className="relative z-10 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl w-10 h-10 flex items-center justify-center overflow-hidden shadow-md">
                    <img src="/logo-default.png" alt="" className="w-full h-full object-contain block dark:hidden" />
                    <img src="/logo-dark.png" alt="" className="w-full h-full object-contain hidden dark:block" />
                  </div>
                  <Badge className="bg-white/20 text-white border-none px-3 py-1 font-black text-[0.6rem] tracking-widest uppercase rounded-full">
                    {range.startsWith("date:") ? selectedDate : range.startsWith("range:") ? range.split("range:")[1].replace("_", " - ") : RANGES.find(r => r.id === range)?.label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Total Pendapatan
                  </p>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-tight">Rp {totalSales.toLocaleString("id-ID")}</h2>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-white/60 text-[0.55rem] font-black uppercase tracking-widest">Transaksi</p>
                    <p className="text-lg font-black">{totalTrx.toLocaleString("id-ID")}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-[0.55rem] font-black uppercase tracking-widest">Rata-rata</p>
                    <p className="text-lg font-black">Rp {Math.round(avgOrder).toLocaleString("id-ID")}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-[0.55rem] font-black uppercase tracking-widest">Item Terjual</p>
                    <p className="text-lg font-black">{totalSoldQty.toLocaleString("id-ID")}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Profit Summary - 1 col */}
          <div className="lg:col-span-1 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-4 border-none shadow-sm bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl flex flex-col justify-between min-h-[95px]">
                <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Laba Kotor</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">Rp {grossProfit.toLocaleString("id-ID")}</p>
                <div className="h-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-emerald-400 dark:bg-emerald-500 rounded-full" style={{ width: `${Math.min(grossMargin, 100)}%` }} />
                </div>
              </Card>
              <Card className="p-4 border-none shadow-sm bg-blue-500/5 dark:bg-blue-500/10 rounded-xl flex flex-col justify-between min-h-[95px]">
                <p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Margin Laba</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">{grossMargin.toFixed(1)}%</p>
                <p className="text-[7px] font-bold text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest mt-auto">dari Rp {totalSales.toLocaleString("id-ID")}</p>
              </Card>
            </div>
            <Card className="p-4 border-none shadow-sm bg-rose-500/5 dark:bg-rose-500/10 rounded-xl flex items-center justify-between min-h-[60px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-500 dark:text-rose-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Total Biaya (HPP)</p>
                  <p className="text-sm font-black text-rose-600 dark:text-rose-400">Rp {totalCOGS.toLocaleString("id-ID")}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-rose-600/40 uppercase tracking-widest">{totalSoldQty.toLocaleString("id-ID")} Item</p>
              </div>
            </Card>
            {cancelledRevenue > 0 && (
              <Card className="p-4 border-none shadow-sm bg-amber-500/5 rounded-xl flex items-center gap-3 min-h-[60px]">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-amber-600/60 uppercase tracking-widest">Transaksi Dibatalkan</p>
                  <p className="text-sm font-black text-amber-600">Rp {cancelledRevenue.toLocaleString("id-ID")}</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* ── Row 2: Payment Methods + Top Products ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Payment Breakdown - 1 col */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5 px-1">
              <CreditCard className="w-3 h-3" /> Metode Pembayaran
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {(() => {
                const allMethods = ["CASH", "QRIS", "TRANSFER"];
                const methodLabels: Record<string, string> = { CASH: "Tunai", QRIS: "QRIS", TRANSFER: "Transfer" };
                const methodIcons: Record<string, any> = { CASH: Banknote, QRIS: QrCode, TRANSFER: ShoppingCart };
                const methodColors: Record<string, string> = {
                  CASH: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
                  QRIS: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
                  TRANSFER: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
                };
                const barColors: Record<string, string> = {
                  CASH: "bg-emerald-400", QRIS: "bg-blue-400", TRANSFER: "bg-violet-400",
                };

                return allMethods.map(method => {
                  const amount = byMethod[method];
                  const hasData = amount && amount > 0;
                  const Icon = methodIcons[method];
                  return (
                    <Card key={method} className={cn("p-3.5 border-none shadow-sm rounded-xl transition-colors duration-200", hasData ? "bg-card/40" : "bg-muted/10")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", hasData ? methodColors[method] : "bg-muted/30 text-muted-foreground/30")}>
                            <Icon className={cn("w-5 h-5", hasData ? "" : "opacity-40")} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{methodLabels[method]}</p>
                            {hasData ? (
                              <p className="text-xs font-black text-foreground">Rp {amount.toLocaleString("id-ID")}</p>
                            ) : (
                              <p className="text-[9px] font-bold text-muted-foreground/40 italic">Belum digunakan</p>
                            )}
                          </div>
                        </div>
                        {hasData && (
                          <div className="text-right">
                            <p className="text-[10px] font-black text-foreground">{((amount / totalSales) * 100).toFixed(1)}%</p>
                          </div>
                        )}
                      </div>
                      {hasData ? (
                        <div className="mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", barColors[method])}
                            style={{ width: `${(amount / totalSales) * 100}%` }} />
                        </div>
                      ) : (
                        <div className="mt-2 h-1.5 bg-muted/10 rounded-full overflow-hidden">
                          <div className="h-full bg-muted/20 rounded-full" style={{ width: "100%" }} />
                        </div>
                      )}
                    </Card>
                  );
                });
              })()}
            </div>
          </div>

          {/* Top Products - 2 cols */}
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Produk Terlaris
              </h3>
              <Badge variant="outline" className="text-[7px] font-bold px-2 py-0.5 border-muted-foreground/20 text-muted-foreground">
                {totalSoldQty} Terjual
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {topProducts.length > 0 ? topProducts.map(([id, data], i) => {
                const profit = data.revenue - data.cogs;
                const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
                return (
                  <Card key={id} className="p-3 border-none shadow-sm bg-card/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-foreground truncate">{data.name}</p>
                        <p className="text-[8px] text-muted-foreground">{data.qty}x terjual</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-black text-foreground">Rp {data.revenue.toLocaleString("id-ID")}</p>
                        <p className={cn("text-[7px] font-black uppercase tracking-wider", profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          {profit >= 0 ? "+" : ""}Rp {profit.toLocaleString("id-ID")} ({margin.toFixed(0)}%)
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/50 rounded-full" style={{ width: `${(data.revenue / totalSales) * 100}%` }} />
                    </div>
                  </Card>
                );
              }) : (
                <div className="col-span-full py-12 text-center bg-muted/20 rounded-xl border border-dashed border-border/50">
                  <Package className="w-6 h-6 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Belum ada penjualan</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 3: Hourly Sales + Transaction List ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hourly Sales - 1 col */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5 px-1">
              <BarChart3 className="w-3 h-3" /> Jam Sibuk
            </h3>
            <Card className="p-3.5 border-none shadow-sm bg-card/40 rounded-xl space-y-1.5">
              {Object.keys(hourlySales).length > 0 ? (
                Object.entries(hourlySales).sort().map(([hour, amount]) => {
                  const maxSale = Math.max(...Object.values(hourlySales));
                  const barWidth = maxSale > 0 ? (amount / maxSale) * 100 : 0;
                  return (
                    <div key={hour} className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-muted-foreground w-9 shrink-0">{hour}</span>
                      <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-400/70 rounded-full" style={{ width: `${barWidth}%` }} />
                      </div>
                      <span className="text-[8px] font-black text-foreground w-20 text-right shrink-0">Rp {amount.toLocaleString("id-ID")}</span>
                    </div>
                  );
                })
              ) : (
                // Show all 24 hours as empty bars when no data
                Array.from({ length: 24 }, (_, i) => {
                  const hour = String(i).padStart(2, "0") + ":00";
                  return (
                    <div key={hour} className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-muted-foreground/40 w-9 shrink-0">{hour}</span>
                      <div className="flex-1 h-3 bg-muted/10 rounded-full overflow-hidden">
                        <div className="h-full bg-muted/20 rounded-full" style={{ width: "0%" }} />
                      </div>
                      <span className="text-[8px] font-bold text-muted-foreground/30 w-20 text-right shrink-0">—</span>
                    </div>
                  );
                })
              )}
            </Card>
          </div>

          {/* Transaction List - 2 cols */}
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-1.5">
                <Package className="w-3 h-3" /> Riwayat Penjualan
              </h3>
              <Badge variant="outline" className="text-[8px] font-bold px-2 py-0.5 border-muted-foreground/20 text-muted-foreground">
                {transactions.length} Transaksi
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {transactions.length > 0 ? (
                transactions.slice(0, 20).map((t) => (
                  <Card key={t.id} onClick={() => setSelectedTransaction(t)}
                    className="p-3 border-none shadow-sm bg-card/40 hover:bg-card/60 transition-colors duration-200 rounded-xl cursor-pointer active:scale-[0.99]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-xs font-bold text-foreground">#{String(t.id).slice(-4)}</p>
                            <Badge className={cn("text-[0.5rem] font-bold px-1 h-3.5 border-none", PAYMENT_COLORS[t.paymentMethod])}>
                              {t.paymentMethod}
                            </Badge>
                          </div>
                          <p className="text-[0.55rem] text-muted-foreground">
                            {new Date(t.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-foreground">Rp {t.total.toLocaleString("id-ID")}</p>
                        <p className={cn("text-[0.5rem] font-bold uppercase tracking-widest", t.status === "CANCELLED" ? "text-rose-500" : "text-emerald-500")}>
                          {t.status === "CANCELLED" ? "Batal" : "Sukses"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-16 text-center bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/10">
                  <ShoppingCart className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Belum ada transaksi</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Profit/Loss Detail Table ── */}
        {topProducts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3" /> Detail Laba/Rugi Per Produk
              </h3>
            </div>
            <Card className="p-0 border-none shadow-sm bg-card/40 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-border/10 text-[7px] font-black text-muted-foreground uppercase tracking-widest">
                      <th className="text-left px-4 py-3">Produk</th>
                      <th className="text-right px-3 py-3">Terjual</th>
                      <th className="text-right px-3 py-3">Pendapatan</th>
                      <th className="text-right px-3 py-3">HPP</th>
                      <th className="text-right px-3 py-3">Laba</th>
                      <th className="text-right px-3 py-3">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map(([id, data]) => {
                      const profit = data.revenue - data.cogs;
                      const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
                      return (
                        <tr key={id} className="border-b border-border/5 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-foreground">{data.name}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-muted-foreground">{data.qty}</td>
                          <td className="px-3 py-2.5 text-right font-black text-foreground">Rp {data.revenue.toLocaleString("id-ID")}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-rose-500">Rp {data.cogs.toLocaleString("id-ID")}</td>
                          <td className={cn("px-3 py-2.5 text-right font-black", profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {profit >= 0 ? "+" : ""}Rp {profit.toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Badge className={cn("text-[7px] font-black px-1.5 border-none", margin >= 30 ? "bg-emerald-500/10 text-emerald-600" : margin >= 0 ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600")}>
                              {margin.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Totals row */}
                    <tr className="bg-muted/10 font-black">
                      <td className="px-4 py-3 text-foreground text-[10px]">TOTAL</td>
                      <td className="px-3 py-3 text-right text-foreground">{totalSoldQty}</td>
                      <td className="px-3 py-3 text-right text-foreground">Rp {totalSales.toLocaleString("id-ID")}</td>
                      <td className="px-3 py-3 text-right text-rose-600">Rp {totalCOGS.toLocaleString("id-ID")}</td>
                      <td className={cn("px-3 py-3 text-right text-[10px]", grossProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {grossProfit >= 0 ? "+" : ""}Rp {grossProfit.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge className={cn("text-[8px] font-black px-2 border-none", grossMargin >= 30 ? "bg-emerald-500/10 text-emerald-600" : grossMargin >= 0 ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600")}>
                          {grossMargin.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
      <TransactionDetailModal 
        transaction={selectedTransaction} 
        onClose={() => setSelectedTransaction(null)} 
      />

      {showCustomRangeModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl p-5 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Pilih Rentang Waktu</h3>
              <button onClick={() => setShowCustomRangeModal(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-1">Tanggal Mulai</label>
                <input 
                  type="date" 
                  className="w-full h-11 bg-muted/50 border-none rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-1">Tanggal Selesai</label>
                <input 
                  type="date" 
                  className="w-full h-11 bg-muted/50 border-none rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>

            <Button 
              className="w-full h-11 rounded-xl gradient-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
              disabled={!dateRange.start || !dateRange.end}
              onClick={() => {
                setRange(`range:${dateRange.start}_${dateRange.end}`);
                setShowCustomRangeModal(false);
              }}
            >
              Terapkan Filter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
