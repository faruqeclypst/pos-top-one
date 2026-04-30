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
import { cn } from "@/lib/utils";
import { getTerminology } from "@/lib/terminology";

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
  const terms = getTerminology(profile?.businessType);

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

      <div className="w-full px-5 pt-4 space-y-5 max-w-[1600px] mx-auto pb-32">
        
        {/* ── Section: Quick Actions (Now on Top) ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest">Pintasan</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/products" className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-border/50 flex flex-col items-center gap-2 group hover:bg-primary/5 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-foreground">{terms.products}</span>
            </Link>
            <Link href="/suppliers" className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-border/50 flex flex-col items-center gap-2 group hover:bg-primary/5 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Supplier</span>
            </Link>
            <Link href="/reports" className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-border/50 flex flex-col items-center gap-2 group hover:bg-primary/5 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Laporan</span>
            </Link>
            <Link href="/settings" className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-border/50 flex flex-col items-center gap-2 group hover:bg-primary/5 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-zinc-500/10 text-zinc-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Toko</span>
            </Link>
          </div>
        </div>

        {/* ── Section: Recent Activity ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest">Transaksi</h2>
            </div>
            <Link href="/reports" className="text-[9px] font-black text-primary hover:underline tracking-widest uppercase">Lihat Semua</Link>
          </div>

          <div className="space-y-2">
            {transactions && transactions.length > 0 ? (
              [...transactions].reverse().slice(0, 3).map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-border/50 flex items-center gap-4 hover:border-primary/30 transition-all group shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingCart className="w-4 h-4 text-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">#{t.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[8px] font-medium text-muted-foreground">
                      {new Date(t.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · {t.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary">Rp {t.total.toLocaleString("id-ID")}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-border/50">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tidak ada transaksi hari ini</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


