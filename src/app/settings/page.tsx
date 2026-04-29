"use client";

import { useRef } from "react";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import { useTheme } from "@/components/ThemeProvider";
import {
  Store, Palette, Database, Download, Upload,
  Sun, Moon, ChevronRight, Info, Trash2, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import db from "@/lib/db";

const THEMES = [
  { id: "light", label: "Terang", icon: Sun, desc: "Mode siang hari" },
  { id: "dark", label: "Gelap", icon: Moon, desc: "Mode malam" },
];

function SettingsSection({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
      </div>
      <div className="card-premium overflow-hidden">{children}</div>
    </div>
  );
}

function SettingsRow({ label, desc, icon: Icon, iconColor, onClick, danger, last }: {
  label: string; desc?: string; icon: React.ElementType;
  iconColor: string; onClick?: () => void; danger?: boolean; last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 text-left touchable",
        !last && "border-b border-border/50",
        danger ? "hover:bg-red-50/50" : "hover:bg-muted/30"
      )}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconColor)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", danger ? "text-destructive" : "text-foreground")}>{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
    </button>
  );
}

export default function SettingsPage() {
  const { profile, saveProfile } = useStoreProfile();
  const { theme, setTheme } = useTheme();
  const restoreRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    try {
      const data = {
        timestamp: Date.now(), version: 1,
        products: await db.products.toArray(),
        suppliers: await db.suppliers.toArray(),
        transactions: await db.transactions.toArray(),
        transactionItems: await db.transactionItems.toArray(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `TokoKu-Backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
    } catch (e) {
      alert("Gagal backup: " + e);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Data saat ini akan diganti. Lanjutkan?")) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.products) await db.products.bulkPut(parsed.products);
      if (parsed.suppliers) await db.suppliers.bulkPut(parsed.suppliers);
      if (parsed.transactions) await db.transactions.bulkPut(parsed.transactions);
      if (parsed.transactionItems) await db.transactionItems.bulkPut(parsed.transactionItems);
      alert("Restore berhasil!");
    } catch {
      alert("File backup tidak valid.");
    }
  };

  const handleResetOnboarding = async () => {
    if (!confirm("Reset onboarding? Anda harus setup ulang toko.")) return;
    await saveProfile({ isOnboarded: false });
    window.location.reload();
  };

  return (
    <div className="flex flex-col bg-background min-h-full pb-28">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="px-4 pt-5 pb-4">
          <h1 className="text-lg font-bold text-foreground">Pengaturan</h1>
        </div>

        {/* Profile Card */}
        <div className="px-4 mb-5">
          <div className="gradient-primary rounded-3xl p-5 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Store className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg truncate">{profile?.name || "Nama Toko"}</p>
                <p className="text-white/70 text-sm truncate">{profile?.address || "Belum ada alamat"}</p>
                <p className="text-white/60 text-xs mt-1">{profile?.phone || "Belum ada telepon"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-5">
          {/* Theme */}
          <SettingsSection title="Tampilan" icon={Palette}>
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Pilih tema warna aplikasi</p>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as "light" | "dark")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150",
                      theme === t.id ? "border-primary bg-primary/5" : "border-border bg-background"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      t.id === "light" ? "bg-amber-50 text-amber-600" : "bg-slate-700 text-slate-300"
                    )}>
                      <t.icon className="w-5 h-5" />
                    </div>
                    <span className={cn("text-xs font-semibold", theme === t.id ? "text-primary" : "text-foreground")}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </SettingsSection>

          {/* UMKM Preferences */}
          <SettingsSection title="Preferensi Bisnis" icon={Store}>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Gunakan No. Meja</p>
                  <p className="text-xs text-muted-foreground">Aktifkan untuk bisnis F&B / Restoran</p>
                </div>
                <button
                  onClick={() => saveProfile({ useTable: !profile?.useTable })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all duration-200 relative",
                    profile?.useTable ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200",
                    profile?.useTable ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Gunakan No. HP / WA</p>
                  <p className="text-xs text-muted-foreground">Aktifkan untuk Retail / Pengiriman</p>
                </div>
                <button
                  onClick={() => saveProfile({ usePhoneNumber: !profile?.usePhoneNumber })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all duration-200 relative",
                    profile?.usePhoneNumber ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200",
                    profile?.usePhoneNumber ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </SettingsSection>

          {/* Data */}
          <SettingsSection title="Data & Backup" icon={Database}>
            <SettingsRow
              icon={Download} iconColor="bg-blue-50 text-blue-600"
              label="Backup Database" desc="Simpan semua data ke file JSON"
              onClick={handleBackup}
            />
            <input type="file" accept=".json" className="hidden" ref={restoreRef} onChange={handleRestore} />
            <SettingsRow
              icon={Upload} iconColor="bg-emerald-50 text-emerald-600"
              label="Restore Database" desc="Pulihkan dari file backup JSON"
              onClick={() => restoreRef.current?.click()}
              last
            />
          </SettingsSection>

          {/* About */}
          <SettingsSection title="Tentang Aplikasi" icon={Info}>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Versi</span>
                <span className="font-semibold text-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-semibold text-foreground">Next.js + Capacitor</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Database</span>
                <span className="font-semibold text-foreground">Dexie.js (Offline)</span>
              </div>
            </div>
          </SettingsSection>

          {/* Danger Zone */}
          <SettingsSection title="Zona Berbahaya" icon={Trash2}>
            <SettingsRow
              icon={RotateCcw} iconColor="bg-red-50 text-destructive"
              label="Reset Setup Toko"
              desc="Kembali ke layar onboarding awal"
              onClick={handleResetOnboarding}
              danger last
            />
          </SettingsSection>

          <p className="text-center text-xs text-muted-foreground/60 pb-4">
            TokoKu POS · Dibuat dengan ❤️ untuk UMKM Indonesia
          </p>
        </div>
      </div>
    </div>
  );
}
