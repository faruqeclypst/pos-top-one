"use client";

import { useLiveQuery } from "dexie-react-hooks";
import db from "@/lib/db";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import Link from "next/link";
import {
  TrendingUp, ShoppingCart, Package, ChevronRight,
  ArrowUpRight, Zap, BarChart3, Bell, Store, Users
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTerminology } from "@/lib/terminology";
import { useState } from "react";
import TransactionDetailModal from "@/components/TransactionDetailModal";
import { Transaction } from "@/lib/db";

// ── Skeleton ─────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="">
      <div className="w-full h-48 shimmer mb-6" />
      <div className="px-4 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-[2rem] shimmer" />
          <div className="h-24 rounded-[2rem] shimmer" />
        </div>
        <div className="h-40 rounded-[2rem] shimmer" />
        <div className="h-60 rounded-[2rem] shimmer" />
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function DashboardPage() {
  const { profile, isLoading: profileLoading } = useStoreProfile();
  const transactions = useLiveQuery(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return db.transactions.where("date").aboveOrEqual(today.getTime()).toArray();
  });
  const productCount = useLiveQuery(() => db.products.count());
  const supplierCount = useLiveQuery(() => db.suppliers.count());

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const isLoading = profileLoading || transactions === undefined || productCount === undefined;

  if (isLoading) return <DashboardSkeleton />;

  const totalSales = transactions?.reduce((s, t) => s + t.total, 0) ?? 0;
  const totalTrx = transactions?.length ?? 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Selamat Pagi" : hour < 17 ? "Selamat Siang" : "Selamat Malam";
  const terms = getTerminology(profile?.businessType);

  return (
    <div className="pb-32 min-h-screen bg-background">
      <PageHeader
        title={profile?.name || "TokoKu POS"}
        subtitle={`${greeting} 👋`}
        actions={
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center shadow-sm hover:bg-muted/50 transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        }
      />

      <div className="w-full px-5 pt-8 mx-auto space-y-8 max-w-[1600px]">

        {/* Top Bento Row: Hero Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Sales Card */}
          <Card className="lg:col-span-2 gradient-primary border-none p-6 relative overflow-hidden shadow-xl shadow-primary/10 text-white rounded-[2rem] group flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[60px] rounded-full -mr-16 -mt-16" />
            <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12 transition-transform group-hover:rotate-0">
              <TrendingUp className="w-32 h-32" />
            </div>

            <div className="relative z-10 w-full space-y-4">
              <div className="flex items-center gap-2 opacity-80">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <p className="text-[0.625rem] font-bold uppercase tracking-widest">Penjualan Hari Ini</p>
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tighter">Rp {totalSales.toLocaleString("id-ID")}</h2>
                <p className="text-sm font-medium mt-1 opacity-90">{totalTrx} Transaksi Berhasil</p>
              </div>
            </div>
          </Card>

          {/* Quick Stats Bento */}
          <Card className="lg:col-span-2 p-4 border-none shadow-sm bg-card/40 backdrop-blur-sm grid grid-cols-2 gap-3 rounded-[2rem]">
            <div className="bg-blue-500/5 hover:bg-blue-500/10 transition-colors p-4 rounded-2xl flex flex-col justify-center items-center text-center group">
              <Package className="w-6 h-6 text-blue-500 mb-2 opacity-40 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-2xl font-black text-blue-600 leading-none">{productCount || 0}</h3>
              <p className="text-[0.625rem] font-bold text-blue-600/60 uppercase tracking-widest mt-2">{terms.products}</p>
            </div>
            <div className="bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors p-4 rounded-2xl flex flex-col justify-center items-center text-center group">
              <Users className="w-6 h-6 text-emerald-500 mb-2 opacity-40 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-2xl font-black text-emerald-600 leading-none">{supplierCount || 0}</h3>
              <p className="text-[0.625rem] font-bold text-emerald-600/60 uppercase tracking-widest mt-2">Supplier</p>
            </div>
          </Card>
        </div>

        {/* Action Grid Bento */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <Zap className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-none">Pintasan Cepat</h3>
              <p className="text-[0.625rem] text-muted-foreground mt-1 uppercase tracking-widest">Akses Menu Utama</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/pos" className="bg-card/60 backdrop-blur-sm p-4 rounded-[1.5rem] border-none flex flex-col items-center justify-center gap-3 group hover:bg-primary/5 transition-all shadow-sm h-32 active:scale-95 touchable">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Buka Kasir</span>
            </Link>
            <Link href="/products" className="bg-card/60 backdrop-blur-sm p-4 rounded-[1.5rem] border-none flex flex-col items-center justify-center gap-3 group hover:bg-blue-500/5 transition-all shadow-sm h-32 active:scale-95 touchable">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{terms.products}</span>
            </Link>
            <Link href="/reports" className="bg-card/60 backdrop-blur-sm p-4 rounded-[1.5rem] border-none flex flex-col items-center justify-center gap-3 group hover:bg-orange-500/5 transition-all shadow-sm h-32 active:scale-95 touchable">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Laporan</span>
            </Link>
            <Link href="/settings" className="bg-card/60 backdrop-blur-sm p-4 rounded-[1.5rem] border-none flex flex-col items-center justify-center gap-3 group hover:bg-zinc-500/5 transition-all shadow-sm h-32 active:scale-95 touchable">
              <div className="w-12 h-12 rounded-2xl bg-zinc-500/10 text-zinc-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Toko</span>
            </Link>
          </div>
        </div>

        {/* Recent Transactions Bento */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground leading-none">Aktivitas Hari Ini</h3>
                <p className="text-[0.625rem] text-muted-foreground mt-1 uppercase tracking-widest">Transaksi Terbaru</p>
              </div>
            </div>
            <Link href="/reports" className="text-[10px] font-black text-primary hover:underline tracking-widest uppercase px-3 py-1.5 bg-primary/10 rounded-lg">
              Lihat Semua
            </Link>
          </div>

          <Card className="overflow-hidden border-none shadow-sm bg-card/60 backdrop-blur-sm rounded-[2rem] p-6">
            {transactions && transactions.length > 0 ? (
              <div className="divide-y divide-border/20">
                {[...transactions].reverse().slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTransaction(t)}
                    className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer active:scale-[0.99] touchable rounded-2xl"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">#{String(t.id).slice(-6).toUpperCase()}</p>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">
                        {new Date(t.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • {t.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-primary">Rp {t.total.toLocaleString("id-ID")}</p>
                      <Badge variant="outline" className="text-[8px] uppercase tracking-widest mt-1 border-primary/20 text-primary">
                        Selesai
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mb-8 relative group transition-all duration-500 hover:bg-primary/10">
                  <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <ShoppingCart className="w-10 h-10 text-primary/30 relative z-10 group-hover:scale-110 group-hover:text-primary/50 transition-all duration-500" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-background border-2 border-primary/10 rounded-full flex items-center justify-center shadow-sm">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <h3 className="text-lg font-black text-foreground tracking-tight">Belum Ada Transaksi</h3>
                  <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mx-auto">
                    Mulai jualan hari ini untuk melihat aktivitas transaksi dan laporan pendapatan Anda di sini.
                  </p>
                </div>

                <Link href="/pos" className="mt-8 w-full flex justify-center px-6">
                  <Button className="w-full max-w-[340px] h-16 rounded-[1.5rem] text-lg font-black px-8 shadow-2xl shadow-primary/30 group relative overflow-hidden tracking-tight">
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <ShoppingCart className="w-6 h-6 mr-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="relative z-10">Buka Kasir</span>
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
}


