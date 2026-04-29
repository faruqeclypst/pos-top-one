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

const RANGES = [
  { id: "today", label: "Hari Ini" },
  { id: "yesterday", label: "Kemarin" },
  { id: "week", label: "7 Hari Terakhir" },
  { id: "month", label: "Bulan Ini" },
  { id: "last_month", label: "Bulan Lalu" },
  { id: "year", label: "Tahun Ini" },
];

const PAYMENT_COLORS: Record<string, string> = {
  CASH: "bg-emerald-50 text-emerald-700",
  QRIS: "bg-blue-50 text-blue-700",
  TRANSFER: "bg-violet-50 text-violet-700",
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
    <div className="p-4 space-y-4 pt-20 max-w-4xl mx-auto w-full">
      <div className="h-36 rounded-3xl shimmer" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl shimmer" />)}
      </div>
      <div className="h-40 rounded-2xl shimmer" />
    </div>
  );
}

export default function ReportsPage() {
  const { profile } = useStoreProfile();
  const [range, setRange] = useState("today");
  const allTransactions = useLiveQuery(() => db.transactions.reverse().sortBy("date"));

  if (!allTransactions) return <ReportsSkeleton />;

  const transactions = filterByRange(allTransactions, range);
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
    <div className="flex flex-col bg-background min-h-full pb-24">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 bg-background/95 sticky top-0 z-10" style={{ backdropFilter: "blur(12px)" }}>
          <h1 className="text-lg font-bold text-foreground mb-3">Laporan Penjualan</h1>

          {/* Period Filter */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {RANGES.map(r => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0",
                  range === r.id
                    ? "bg-primary text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-2 space-y-4">
          {/* Revenue Card */}
          <div className="gradient-primary rounded-3xl p-5 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -bottom-8 left-8 w-24 h-24 rounded-full bg-white/8 blur-xl" />
            <div className="relative z-10">
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Total Pendapatan</p>
              <p className="text-white text-4xl font-bold tracking-tight mt-2">
                Rp {totalSales.toLocaleString("id-ID")}
              </p>
              <div className="flex gap-4 mt-4">
                <div>
                  <p className="text-white/60 text-[10px] uppercase tracking-wider">Transaksi</p>
                  <p className="text-white font-bold text-lg">{totalTrx}</p>
                </div>
                <div className="w-px bg-white/20" />
                <div>
                  <p className="text-white/60 text-[10px] uppercase tracking-wider">Rata-rata</p>
                  <p className="text-white font-bold text-lg">Rp {Math.round(avgOrder).toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card-premium p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-foreground">{totalTrx}</p>
              <p className="text-[10px] text-muted-foreground">Transaksi</p>
            </div>
            <div className="card-premium p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-foreground">Rp {(totalSales / 1000).toFixed(0)}K</p>
              <p className="text-[10px] text-muted-foreground">Revenue</p>
            </div>
            <div className="card-premium p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-lg font-bold text-foreground">Rp {(avgOrder / 1000).toFixed(0)}K</p>
              <p className="text-[10px] text-muted-foreground">Rata-rata</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl card-premium text-foreground font-semibold text-sm touchable"
            >
              <Download className="w-4 h-4 text-blue-600" />
              Ekspor CSV
            </button>
            <button
              onClick={handleShareWA}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl card-premium text-foreground font-semibold text-sm touchable"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              Bagikan WA
            </button>
          </div>

          {/* Payment Breakdown */}
          {Object.keys(byMethod).length > 0 && (
            <div className="card-premium p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Metode Pembayaran</p>
              {Object.entries(byMethod).map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg", PAYMENT_COLORS[method] || "bg-muted text-foreground")}>
                      {method}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">Rp {amount.toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
          )}

          {/* Transaction History */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Riwayat Transaksi</p>
            {transactions.length === 0 ? (
              <div className="card-premium p-10 flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Tidak ada transaksi</p>
                <p className="text-xs text-muted-foreground">Belum ada penjualan di periode ini</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {transactions.map(t => (
                  <div key={t.id} className="card-premium p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.id}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(t.date).toLocaleString("id-ID", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-sm font-bold text-foreground">Rp {t.total.toLocaleString("id-ID")}</p>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", PAYMENT_COLORS[t.paymentMethod] || "bg-muted")}>
                        {t.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
