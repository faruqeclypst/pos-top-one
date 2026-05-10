"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db, { type Transaction } from "@/lib/db";
import TransactionDetailModal from "@/components/TransactionDetailModal";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import {
  TrendingUp, Download, Share2, Calendar,
  ShoppingCart, BarChart3, CreditCard, X, Banknote, QrCode, ChevronRight, Package
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
    const msg = `*Laporan ${profile?.name || "TokoKu"}*\n_Periode: ${rangeName}_\n\n📊 Total Transaksi: *${totalTrx}*\n💰 Pendapatan: *Rp ${totalSales.toLocaleString("id-ID")}*\n📈 Rata-rata: *Rp ${Math.round(avgOrder).toLocaleString("id-ID")}*\n\nDikirim via TokoKu POS ✅`;
    
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
    <div className="pb-32  min-h-screen bg-background">
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
      
      <div className="bg-card/50 backdrop-blur-md border-b border-border/50 sticky top-[73px] z-30 transition-all duration-300">
        <div className="max-w-[1600px] mx-auto w-full px-5 py-4">
          <CategoryBar 
            selectedCategory={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
        </div>
      </div>

      <div className="w-full px-5 pt-8 mx-auto space-y-8 max-w-[1600px] pb-32">
        {/* Bento Grid Layout for Tablet/PC */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Revenue Card - spans 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Card className="gradient-primary border-none p-8 relative overflow-hidden text-white shadow-2xl shadow-primary/30 rounded-[2.5rem] min-h-[300px] flex flex-col justify-between group hover:scale-[1.01] transition-all duration-500">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 blur-[80px] rounded-full -ml-32 -mb-32" />
              
              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="bg-white dark:bg-zinc-900 p-2 rounded-2xl w-12 h-12 flex items-center justify-center overflow-hidden shadow-lg group-hover:rotate-12 transition-transform">
                    <img src="/logo-default.png" alt="Logo" className="w-full h-full object-contain block dark:hidden" />
                    <img src="/logo-dark.png" alt="Logo" className="w-full h-full object-contain hidden dark:block" />
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md px-4 py-1.5 font-black text-[0.7rem] tracking-widest uppercase rounded-full">
                    {range.startsWith("date:") 
                      ? selectedDate 
                      : range.startsWith("range:")
                        ? range.split("range:")[1].replace("_", " - ")
                        : RANGES.find(r => r.id === range)?.label}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <p className="text-white/70 text-[11px] font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Total Pendapatan
                  </p>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter break-all">
                    Rp {totalSales.toLocaleString("id-ID")}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                  <div className="space-y-1">
                    <p className="text-white/60 text-[0.7rem] font-black uppercase tracking-widest flex items-center gap-2">
                      <ShoppingCart className="w-3 h-3" /> Transaksi
                    </p>
                    <p className="text-2xl font-black">{totalTrx.toLocaleString("id-ID")} <span className="text-[10px] opacity-60 font-medium">Trx</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white/60 text-[0.7rem] font-black uppercase tracking-widest flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" /> Rata-rata
                    </p>
                    <p className="text-2xl font-black">Rp {Math.round(avgOrder).toLocaleString("id-ID")}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Methods - spans 1 column on large screens */}
          <div className="lg:col-span-1 space-y-4 h-full">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 flex items-center gap-2">
              <CreditCard className="w-3 h-3" /> Breakdown Pembayaran
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(byMethod).map(([method, amount]) => (
                <Card key={method} className="p-5 border-none shadow-sm bg-card/40 backdrop-blur-md flex items-center justify-between group hover:bg-card/60 transition-all rounded-[1.5rem]">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", PAYMENT_COLORS[method])}>
                      {method === "CASH" ? <Banknote className="w-6 h-6" /> : method === "QRIS" ? <QrCode className="w-6 h-6" /> : <ShoppingCart className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">{method}</p>
                      <p className="text-sm font-black text-foreground">Rp {amount.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </Card>
              ))}
              {Object.keys(byMethod).length === 0 && (
                <div className="p-10 text-center space-y-2 bg-muted/20 rounded-[1.5rem] border border-dashed border-border/50">
                  <CreditCard className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Belum ada pembayaran</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300 delay-300 fill-mode-both pt-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
              <Package className="w-3 h-3" /> Riwayat Penjualan
            </h3>
            <Badge variant="outline" className="text-[9px] font-bold px-3 py-0.5 border-muted-foreground/20 text-muted-foreground">
              {transactions.length} Transaksi
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {transactions.length === 0 ? (
              <div className="py-20 text-center bg-muted/20 rounded-[2rem] border border-dashed border-muted-foreground/10">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Belum ada transaksi</p>
              </div>
            ) : (
              transactions.map((t) => (
                <Card 
                  key={t.id} 
                  onClick={() => setSelectedTransaction(t)}
                  className="p-4 border-none shadow-sm bg-card/40 backdrop-blur-sm flex items-center justify-between group hover:bg-card/60 transition-all duration-300 rounded-2xl cursor-pointer active:scale-[0.99] touchable"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-foreground">Trx #{String(t.id).slice(-4)}</p>
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
      <TransactionDetailModal 
        transaction={selectedTransaction} 
        onClose={() => setSelectedTransaction(null)} 
      />

      {/* Custom Range Modal */}
      {showCustomRangeModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Pilih Rentang Waktu</h3>
              <button onClick={() => setShowCustomRangeModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Tanggal Mulai</label>
                <input 
                  type="date" 
                  className="w-full h-12 bg-muted/50 border-none rounded-2xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Tanggal Selesai</label>
                <input 
                  type="date" 
                  className="w-full h-12 bg-muted/50 border-none rounded-2xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>

            <Button 
              className="w-full h-12 rounded-2xl gradient-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
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
