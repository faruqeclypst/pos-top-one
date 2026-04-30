"use client";

import { useLiveQuery } from "dexie-react-hooks";
import db from "@/lib/db";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import Link from "next/link";
import {
  TrendingUp, ShoppingCart, Package, ChevronRight,
  ArrowUpRight, Zap, BarChart3, Bell, Store
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Skeleton ─────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="w-full h-48 shimmer mb-6" />
      <div className="px-4 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-2xl shimmer" />
          <div className="h-24 rounded-2xl shimmer" />
        </div>
        <div className="h-40 rounded-2xl shimmer" />
        <div className="h-60 rounded-2xl shimmer" />
      </div>
    </div>
  );
}

// ── Mini Stat Card ────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <Card className="p-4 border-none shadow-sm bg-surface-raised overflow-hidden relative">
      <div className={cn("absolute -right-2 -bottom-2 w-16 h-16 opacity-5", color)}>
        <Icon className="w-full h-full" />
      </div>
      <div className="relative z-10 flex flex-col gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{label}</p>
          <p className="text-[10px] font-medium text-primary mt-1">{sub}</p>
        </div>
      </div>
    </Card>
  );
}

// ── Quick Action ──────────────────────────────────────────
function QuickAction({ href, icon: Icon, label, desc, color }: {
  href: string; icon: React.ElementType; label: string; desc: string; color: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-4 p-4 touchable border-none shadow-sm hover:bg-muted/50 transition-colors">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm">{label}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{desc}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </Card>
    </Link>
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

  const isLoading = profileLoading || transactions === undefined || productCount === undefined;

  if (isLoading) return <DashboardSkeleton />;

  const totalSales = transactions?.reduce((s, t) => s + t.total, 0) ?? 0;
  const totalTrx = transactions?.length ?? 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Selamat Pagi" : hour < 17 ? "Selamat Siang" : "Selamat Malam";

  return (
    <div className="pb-28 animate-in fade-in duration-500 min-h-screen bg-background">
      <PageHeader
        title={profile?.name || "TokoKu POS"}
        subtitle={`${greeting} 👋`}
        leftAction={
          <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Store className="w-5 h-5" />
          </div>
        }
        rightAction={
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center shadow-sm hover:bg-muted/50 transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center shadow-sm hover:bg-muted/50 transition-colors lg:hidden">
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        }
      />

      <div className="w-full px-5 pt-8 relative z-20 space-y-8 max-w-[1600px] mx-auto">
        {/* ── Top Row: Revenue & Quick Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Card (Redesigned Bento) */}
          <Card className="lg:col-span-2 gradient-primary border-none p-0 text-white shadow-2xl shadow-primary/20 overflow-hidden relative rounded-[2.5rem] group min-h-[320px] flex flex-col md:flex-row">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-white/20 transition-all duration-700 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" />
            
            {/* Left Content: Data */}
            <div className="flex-1 p-8 md:p-10 flex flex-col justify-center relative z-10">
              <div className="space-y-1">
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em]">Penjualan Hari Ini</p>
                <h2 className="text-6xl font-black tracking-tighter flex items-baseline gap-2">
                  <span className="text-2xl text-white/40 font-bold">Rp</span>
                  {totalSales.toLocaleString("id-ID")}
                </h2>
              </div>

              {/* Decorative Sparkline to fill the "empty" space */}
              <div className="h-16 w-full max-w-[300px] mt-6 opacity-30 relative group-hover:opacity-50 transition-opacity">
                <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                  <path 
                    d="M0,35 Q20,5 40,25 T80,15 T120,30 T160,10 T200,20" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  />
                  <circle cx="200" cy="20" r="3" fill="white" className="animate-pulse" />
                </svg>
              </div>
              
              <div className="flex gap-10 mt-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 opacity-60">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <p className="text-[9px] font-black uppercase tracking-widest">Transaksi</p>
                  </div>
                  <p className="text-2xl font-black leading-none">{totalTrx}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 opacity-60">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <p className="text-[9px] font-black uppercase tracking-widest">Pertumbuhan</p>
                  </div>
                  <p className="text-2xl font-black leading-none text-white">
                    +{totalTrx > 0 ? "100" : "0"}<span className="text-lg opacity-40">%</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Content: Action */}
            <div className="w-full md:w-72 bg-white/10 backdrop-blur-2xl p-8 md:p-10 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-white/10 relative z-10 group-hover:bg-white/15 transition-all duration-500">
              <div className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center shadow-2xl shadow-primary/30 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Zap className="w-10 h-10 text-primary fill-primary/20" />
              </div>
              <div className="w-full space-y-3">
                <Link href="/pos" className="w-full h-14 rounded-2xl bg-white text-primary font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                  BUKA KASIR
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <p className="text-[9px] text-center text-white/50 font-bold uppercase tracking-tighter">Mulai mencatat pesanan baru</p>
              </div>
            </div>
          </Card>

          {/* Side Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <StatCard
              label="Total Produk"
              value={String(productCount ?? 0)}
              sub="Stok Aktif"
              icon={Package}
              color="bg-blue-500/10 text-blue-500"
            />
            <StatCard
              label="Total Pemasok"
              value={String(supplierCount ?? 0)}
              sub="Mitra Bisnis"
              icon={TrendingUp}
              color="bg-violet-500/10 text-violet-500"
            />
          </div>
        </div>

        {/* ── Middle Row: Quick Actions (Now more compact) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Aksi Cepat</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <QuickActionTile
              href="/pos"
              icon={Zap}
              label="Kasir"
              color="gradient-primary text-white"
            />
            <QuickActionTile
              href="/products"
              icon={Package}
              label="Produk"
              color="bg-blue-500 text-white"
            />
            <QuickActionTile
              href="/reports"
              icon={BarChart3}
              label="Laporan"
              color="bg-violet-500 text-white"
            />
          </div>
        </div>

        {/* ── Bottom Row: Recent Transactions ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Transaksi Terakhir</h2>
              <Link href="/reports" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                Lihat Semua
              </Link>
            </div>

            {transactions && transactions.length > 0 ? (
              <div className="space-y-2.5">
                {[...transactions].reverse().slice(0, 5).map((t) => (
                  <Card key={t.id} className="p-3.5 flex items-center gap-4 border-none shadow-sm bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all group rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-foreground truncate">{t.id}</p>
                      <p className="text-[9px] font-bold text-muted-foreground mt-0.5 uppercase tracking-tighter opacity-60">
                        {new Date(t.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · {t.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-black text-foreground tracking-tight">Rp {t.total.toLocaleString("id-ID")}</p>
                      <Badge variant="success" className="mt-0.5 font-black text-[8px] px-1.5 h-4 border-none bg-emerald-500/10 text-emerald-500 uppercase">
                        {t.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 flex flex-col items-center text-center gap-5 border-dashed border-2 bg-transparent rounded-[2rem]">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-foreground uppercase tracking-wider">Belum Ada Transaksi</p>
                  <p className="text-[10px] text-muted-foreground max-w-[200px]">Mulai operasikan kasir untuk mencatat penjualan hari ini.</p>
                </div>
                <Link href="/pos" className="h-10 px-6 rounded-xl gradient-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  Buka Kasir Sekarang
                </Link>
              </Card>
            )}
          </div>

          {/* Business Insights Bento */}
          <div className="hidden xl:block">
            <Card className="h-full border-none bg-card/30 backdrop-blur-sm rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
              <TrendingUp className="w-12 h-12 mb-4 text-primary/40" />
              <p className="text-xs font-black uppercase tracking-[0.3em] text-foreground/60">Wawasan Bisnis</p>
              <p className="text-[10px] mt-2 text-muted-foreground max-w-[200px]">Analisis mendalam akan segera hadir untuk membantu Anda tumbuh.</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quick Action Tile ─────────────────────────────────────
function QuickActionTile({ href, icon: Icon, label, color }: {
  href: string; icon: React.ElementType; label: string; color: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex flex-col items-center justify-center gap-2.5 p-4 touchable border-none shadow-sm bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-300 rounded-3xl group">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-all duration-500", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="font-black text-foreground text-[10px] uppercase tracking-widest text-center">{label}</p>
      </Card>
    </Link>
  );
}
