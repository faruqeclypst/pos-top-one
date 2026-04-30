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
    <div className="">
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
    <div className="pb-28 min-h-screen bg-background">
      <PageHeader
        title={profile?.name || "TokoKu POS"}
        subtitle={`${greeting} 👋`}
        leftAction={
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-border/50 flex items-center justify-center shadow-sm overflow-hidden p-1">
            <img src="/logo-default.png" alt="Logo" className="w-full h-full object-contain block dark:hidden" />
            <img src="/logo-dark.png" alt="Logo" className="w-full h-full object-contain hidden dark:block" />
          </div>
        }
        rightAction={
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center shadow-sm hover:bg-muted/50 transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        }
      />

      <div className="w-full px-5 pt-8 space-y-6 max-w-[1600px] mx-auto pb-32">
        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[180px]">
          
          {/* Tile 1: Revenue Overview (Large 2x2) */}
          <div className="md:col-span-2 md:row-span-2 rounded-[2.5rem] p-8 relative overflow-hidden bg-white dark:bg-zinc-900 border border-border/50 shadow-sm flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-all duration-700" />
            
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Revenue Summary</p>
              </div>
              <h2 className="text-5xl font-black tracking-tighter text-foreground">
                <span className="text-xl text-muted-foreground/40 font-bold mr-1">Rp</span>
                {totalSales.toLocaleString("id-ID")}
              </h2>
            </div>

            <div className="relative z-10 h-24 w-full opacity-40 group-hover:opacity-70 transition-opacity">
               <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                <path 
                  d="M0,35 Q15,5 30,30 T60,15 T90,32 T120,8 T150,25 T200,10" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
            </div>

            <div className="relative z-10 flex items-center justify-between border-t border-border/50 pt-6">
              <div className="flex gap-8">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Orders</p>
                  <p className="text-xl font-black text-foreground">{totalTrx}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Growth</p>
                  <p className="text-xl font-black text-emerald-500">+{totalTrx > 0 ? "12" : "0"}%</p>
                </div>
              </div>
              <Link href="/reports" className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Tile 2: Active POS (Wide 2x1) */}
          <Link href="/pos" className="md:col-span-2 rounded-[2.5rem] bg-primary p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10 flex h-full items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white tracking-tight">Kasir Pintar</h3>
                <p className="text-white/60 text-xs font-medium">Buka menu kasir sekarang</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Zap className="w-7 h-7 text-white fill-white/20" />
              </div>
            </div>
          </Link>

          {/* Tile 3: Inventory Stat (1x1) */}
          <div className="rounded-[2rem] bg-blue-500/5 border border-blue-500/10 p-6 flex flex-col justify-between group hover:bg-blue-500/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/60 mb-0.5">Products</p>
              <p className="text-2xl font-black text-blue-600">{productCount ?? 0}</p>
            </div>
          </div>

          {/* Tile 4: Supplier Stat (1x1) */}
          <div className="rounded-[2rem] bg-violet-500/5 border border-violet-500/10 p-6 flex flex-col justify-between group hover:bg-violet-500/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-600/60 mb-0.5">Suppliers</p>
              <p className="text-2xl font-black text-violet-600">{supplierCount ?? 0}</p>
            </div>
          </div>

        </div>

        {/* ── Section: Recent Activity ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-4">
          
          {/* Recent Transactions List (2/3 width) */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                <h2 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Transaksi Terakhir</h2>
              </div>
              <Link href="/reports" className="text-[10px] font-black text-primary hover:underline tracking-widest uppercase">Lihat Semua</Link>
            </div>

            <div className="space-y-3">
              {transactions && transactions.length > 0 ? (
                [...transactions].reverse().slice(0, 4).map((t) => (
                  <div key={t.id} className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-border/50 flex items-center gap-5 hover:border-primary/30 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-5 h-5 text-foreground/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">#{t.id.slice(-6).toUpperCase()}</p>
                      <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                        {new Date(t.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · {t.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground tracking-tight">Rp {t.total.toLocaleString("id-ID")}</p>
                      <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter mt-1 inline-block">Success</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 rounded-[2.5rem] border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-muted/30 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Belum ada transaksi hari ini</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts (1/3 width) */}
          <div className="space-y-4">
             <div className="flex items-center gap-3 px-2">
                <div className="w-1.5 h-6 bg-primary rounded-full opacity-30" />
                <h2 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Pintasan</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Produk", icon: Package, href: "/products", color: "text-blue-500 bg-blue-500/5" },
                  { label: "Supplier", icon: TrendingUp, href: "/suppliers", color: "text-violet-500 bg-violet-500/5" },
                  { label: "Laporan", icon: BarChart3, href: "/reports", color: "text-amber-500 bg-amber-500/5" },
                  { label: "Pengaturan", icon: Store, href: "/settings", color: "text-zinc-500 bg-zinc-500/5" },
                ].map((item) => (
                  <Link key={item.label} href={item.href} className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-border/50 flex flex-col items-center gap-3 hover:border-primary/30 transition-all group">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", item.color)}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{item.label}</p>
                  </Link>
                ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}


