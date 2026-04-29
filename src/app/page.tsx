"use client";

import { useLiveQuery } from "dexie-react-hooks";
import db from "@/lib/db";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import Link from "next/link";
import {
  TrendingUp, ShoppingCart, Package, ChevronRight,
  ArrowUpRight, Zap, BarChart3, Bell
} from "lucide-react";

// ── Skeleton ─────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-5 animate-in fade-in duration-300">
      <div className="w-40 h-6 rounded-full shimmer" />
      <div className="w-full h-36 rounded-3xl shimmer" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl shimmer" />
        <div className="h-24 rounded-2xl shimmer" />
      </div>
      <div className="h-40 rounded-2xl shimmer" />
    </div>
  );
}

// ── Mini Stat Card ────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="card-premium p-4 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        <p className="text-xs font-medium text-primary mt-1">{sub}</p>
      </div>
    </div>
  );
}

// ── Quick Action ──────────────────────────────────────────
function QuickAction({ href, icon: Icon, label, desc, color }: {
  href: string; icon: React.ElementType; label: string; desc: string; color: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-4 p-4 card-premium touchable">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm">{label}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
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

  const isLoading = profileLoading || transactions === undefined || productCount === undefined;

  if (isLoading) return <DashboardSkeleton />;

  const totalSales = transactions?.reduce((s, t) => s + t.total, 0) ?? 0;
  const totalTrx = transactions?.length ?? 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Selamat Pagi" : hour < 17 ? "Selamat Siang" : "Selamat Malam";

  return (
    <div className="pb-6 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="gradient-primary px-5 pt-14 pb-8 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-12 -left-4 w-32 h-32 rounded-full bg-white/8 blur-xl" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">{greeting} 👋</p>
            <h1 className="text-white text-2xl font-bold tracking-tight mt-1">
              {profile?.name || "TokoKu POS"}
            </h1>
          </div>
          <button className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Revenue Banner */}
        <div className="relative z-10 mt-6 bg-white/15 rounded-2xl p-4 backdrop-blur-sm">
          <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Pendapatan Hari Ini</p>
          <p className="text-white text-3xl font-bold tracking-tight mt-1">
            Rp {totalSales.toLocaleString("id-ID")}
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <ShoppingCart className="w-3 h-3 text-white" />
              </div>
              <span className="text-white/80 text-xs">{totalTrx} transaksi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-white" />
              </div>
              <span className="text-white/80 text-xs">Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="px-4 -mt-1 pt-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total Barang"
            value={String(productCount ?? 0)}
            sub="Produk tersedia"
            icon={Package}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Transaksi Hari Ini"
            value={String(totalTrx)}
            sub={totalTrx > 0 ? "Berjalan lancar" : "Belum ada"}
            icon={TrendingUp}
            color="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Aksi Cepat</h2>
          </div>
          <div className="space-y-2.5">
            <QuickAction
              href="/pos"
              icon={Zap}
              label="Buka Kasir"
              desc="Mulai transaksi penjualan baru"
              color="bg-primary text-white"
            />
            <QuickAction
              href="/products"
              icon={Package}
              label="Kelola Barang"
              desc={`${productCount} produk terdaftar`}
              color="bg-blue-50 text-blue-600"
            />
            <QuickAction
              href="/reports"
              icon={BarChart3}
              label="Lihat Laporan"
              desc="Analisis penjualan & pendapatan"
              color="bg-violet-50 text-violet-600"
            />
          </div>
        </div>

        {/* ── Recent Transactions ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Transaksi Terakhir</h2>
            <Link href="/reports" className="text-xs text-primary font-medium flex items-center gap-1">
              Lihat semua <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {[...transactions].reverse().slice(0, 5).map((t) => (
                <div key={t.id} className="card-premium p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{t.id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(t.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · {t.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">Rp {t.total.toLocaleString("id-ID")}</p>
                    <span className="badge-success">{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-premium p-8 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <ShoppingCart className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Belum ada transaksi</p>
                <p className="text-xs text-muted-foreground mt-1">Mulai kasir untuk mencatat penjualan pertama hari ini</p>
              </div>
              <Link href="/pos" className="text-xs text-primary font-semibold mt-1">
                Buka Kasir →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
