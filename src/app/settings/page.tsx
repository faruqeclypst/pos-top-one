"use client";

import { useRef, useState } from "react";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import { useTheme } from "@/components/ThemeProvider";
import { useFontSize } from "@/components/FontSizeProvider";
import { useConfirm } from "@/hooks/useConfirm";
import { 
  Store, Palette, Database, Download, Upload, Sun, Moon, 
  ChevronRight, Info, Trash2, RotateCcw, Tag, Plus, X, Globe, Bell,
  MapPin, Package, Building2, Type
} from "lucide-react";
import { cn } from "@/lib/utils";
import db from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";

const THEMES = [
  { id: "light", label: "Terang", icon: Sun, color: "text-amber-500 bg-amber-500/10" },
  { id: "dark", label: "Gelap", icon: Moon, color: "text-indigo-400 bg-indigo-400/10" },
];

function SettingsSection({ title, subtitle, icon: Icon, children, className }: {
  title: string; subtitle?: string; icon: any; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground leading-none">{title}</h3>
          {subtitle && <p className="text-[0.625rem] text-muted-foreground mt-1 uppercase tracking-widest">{subtitle}</p>}
        </div>
      </div>
      <Card className="overflow-hidden border-none shadow-sm bg-card/60 backdrop-blur-sm">
        {children}
      </Card>
    </div>
  );
}

function SettingsRow({ label, desc, icon: Icon, iconColor, onClick, danger, children, last }: {
  label: string; desc?: string; icon: any;
  iconColor: string; onClick?: () => void; danger?: boolean; children?: React.ReactNode; last?: boolean;
}) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 text-left transition-colors",
        onClick && "hover:bg-muted/30 active:scale-[0.99] touchable",
        !last && "border-b border-border/20"
      )}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconColor)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold", danger ? "text-destructive" : "text-foreground")}>{label}</p>
        {desc && <p className="text-[0.6875rem] text-muted-foreground mt-0.5 line-clamp-1">{desc}</p>}
      </div>
      {children ? (
        <div className="shrink-0">{children}</div>
      ) : (
        onClick && <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
      )}
    </Component>
  );
}

export default function SettingsPage() {
  const { profile, saveProfile } = useStoreProfile();
  const { theme, setTheme, accent, setAccent } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const confirm = useConfirm();
  const restoreRef = useRef<HTMLInputElement>(null);
  const categories = useLiveQuery(() => db.categories.toArray());
  const products = useLiveQuery(() => db.products.count());
  const suppliers = useLiveQuery(() => db.suppliers.count());
  const transactions = useLiveQuery(() => db.transactions.count());
  
  const [newCat, setNewCat] = useState("");

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const base64ToBlob = (base64: string): Blob => {
    const [header, data] = base64.split(",");
    const mime = header.match(/:(.*?);/)?.[1];
    const binary = atob(data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    return new Blob([array], { type: mime });
  };

  const handleBackup = async () => {
    try {
      const products = await db.products.toArray();
      const storeProfile = await db.storeProfile.toArray();

      // Convert blobs to base64
      const productsWithBase64 = await Promise.all(products.map(async p => ({
        ...p,
        image: p.image ? await blobToBase64(p.image) : null
      })));

      const profileWithBase64 = await Promise.all(storeProfile.map(async p => ({
        ...p,
        logo: p.logo ? await blobToBase64(p.logo) : null
      })));

      const data = {
        timestamp: Date.now(),
        version: 2,
        storeProfile: profileWithBase64,
        categories: await db.categories.toArray(),
        products: productsWithBase64,
        suppliers: await db.suppliers.toArray(),
        transactions: await db.transactions.toArray(),
        transactionItems: await db.transactionItems.toArray(),
        stockMutations: await db.stockMutations.toArray(),
        hppHistory: await db.hppHistory.toArray(),
      };

      const jsonString = JSON.stringify(data);
      const fileName = `TokoKu-Backup-${new Date().toISOString().split("T")[0]}.json`;

      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: 'Backup Data TokoKu',
          url: result.uri,
          dialogTitle: 'Simpan File Backup',
        });
      } else {
        const blob = new Blob([jsonString], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
      }
    } catch (e) {
      console.error(e);
      alert("Gagal backup: " + e);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isConfirmed = await confirm({
      title: "Restore Data?",
      message: "Data saat ini akan diganti dengan data dari file backup. Seluruh data transaksi, produk, dan pengaturan akan diperbarui. Lanjutkan?",
      type: "warning"
    });
    if (!isConfirmed) return;
    
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      
      // Validation
      if (!parsed.products || !parsed.transactions) {
        throw new Error("File backup tidak valid.");
      }

      await db.transaction( 'rw', [
        db.storeProfile, db.categories, db.products, db.suppliers, 
        db.transactions, db.transactionItems, db.stockMutations, db.hppHistory
      ], async () => {
        // Clear existing
        await Promise.all([
          db.storeProfile.clear(),
          db.categories.clear(),
          db.products.clear(),
          db.suppliers.clear(),
          db.transactions.clear(),
          db.transactionItems.clear(),
          db.stockMutations.clear(),
          db.hppHistory.clear(),
        ]);

        // Restore with blob conversion
        if (parsed.storeProfile) {
          const profileWithBlobs = parsed.storeProfile.map((p: any) => ({
            ...p,
            logo: p.logo ? base64ToBlob(p.logo) : null
          }));
          await db.storeProfile.bulkAdd(profileWithBlobs);
        }
        
        if (parsed.categories) await db.categories.bulkAdd(parsed.categories);
        
        if (parsed.products) {
          const productsWithBlobs = parsed.products.map((p: any) => ({
            ...p,
            image: p.image ? base64ToBlob(p.image) : null
          }));
          await db.products.bulkAdd(productsWithBlobs);
        }
        
        if (parsed.suppliers) await db.suppliers.bulkAdd(parsed.suppliers);
        if (parsed.transactions) await db.transactions.bulkAdd(parsed.transactions);
        if (parsed.transactionItems) await db.transactionItems.bulkAdd(parsed.transactionItems);
        if (parsed.stockMutations) await db.stockMutations.bulkAdd(parsed.stockMutations);
        if (parsed.hppHistory) await db.hppHistory.bulkAdd(parsed.hppHistory);
      });

      alert("Restore berhasil! Aplikasi akan memuat ulang.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Gagal restore: " + (err instanceof Error ? err.message : "File tidak valid"));
    } finally {
      if (restoreRef.current) restoreRef.current.value = "";
    }
  };

  const handleResetOnboarding = async () => {
    const isConfirmed = await confirm({
      title: "Reset Toko?",
      message: "Semua data profil akan direset. Anda harus melakukan setup ulang toko.",
      type: "danger"
    });
    if (!isConfirmed) return;
    await saveProfile({ isOnboarded: false });
    window.location.reload();
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    await db.categories.add({ name: newCat.trim() });
    setNewCat("");
  };

  const handleDeleteCategory = async (id: number) => {
    const isConfirmed = await confirm({
      title: "Hapus Kategori?",
      message: "Kategori ini akan dihapus permanen.",
      type: "danger"
    });
    if (!isConfirmed) return;
    await db.categories.delete(id);
  };

  return (
    <div className="pb-32  min-h-screen bg-background">
      <PageHeader
        title="Pengaturan"
        subtitle="Konfigurasi"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-8 border-primary/20 text-primary font-bold px-3">v1.0.0</Badge>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Palette className="w-5 h-5" />
            </div>
          </div>
        }
      />

      <div className="w-full px-5 pt-8 mx-auto space-y-8 max-w-[1600px]">
        {/* Top Bento Row: Profile & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Profile Card (Compact Bento) */}
          <Card className="lg:col-span-2 gradient-primary border-none p-6 relative overflow-hidden shadow-xl shadow-primary/10 text-white rounded-[2rem] group flex items-center min-h-[140px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[60px] rounded-full -mr-16 -mt-16" />
            
            <div className="relative z-10 flex items-center gap-6 w-full">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0 border border-border shadow-sm overflow-hidden p-2">
                <img src="/logo-default.png" alt="Logo" className="w-full h-full object-contain block dark:hidden" />
                <img src="/logo-dark.png" alt="Logo" className="w-full h-full object-contain hidden dark:block" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <h2 className="text-xl font-black tracking-tight">{profile?.name || "Nama Toko"}</h2>
                  <div className="flex items-center gap-2 mt-1 opacity-80">
                    <MapPin className="w-3 h-3" />
                    <p className="text-[0.6875rem] font-medium line-clamp-1">{profile?.address || "Alamat belum diatur"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md px-3 py-1 font-bold text-[0.625rem] rounded-lg">
                    {profile?.phone || "08xxxx"}
                  </Badge>
                  <Badge className="bg-black/10 text-white border-none backdrop-blur-md px-3 py-1 font-bold text-[0.625rem] rounded-lg uppercase tracking-widest">
                    {profile?.isOnboarded ? "Aktif" : "Draft"}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Stats Bento (Grid 3 cols) */}
          <Card className="lg:col-span-2 p-4 border-none shadow-sm bg-card/40 backdrop-blur-sm grid grid-cols-3 gap-3 rounded-[2rem]">
            <div className="bg-blue-500/5 hover:bg-blue-500/10 transition-colors p-4 rounded-2xl flex flex-col justify-center items-center text-center group">
              <Package className="w-5 h-5 text-blue-500 mb-2 opacity-40 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-xl font-black text-blue-600 leading-none">{products || 0}</h3>
              <p className="text-[0.5625rem] font-bold text-blue-600/60 uppercase tracking-widest mt-2">Produk</p>
            </div>
            <div className="bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors p-4 rounded-2xl flex flex-col justify-center items-center text-center group">
              <RotateCcw className="w-5 h-5 text-emerald-500 mb-2 opacity-40 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-xl font-black text-emerald-600 leading-none">{transactions || 0}</h3>
              <p className="text-[0.5625rem] font-bold text-emerald-600/60 uppercase tracking-widest mt-2">Transaksi</p>
            </div>
            <div className="bg-amber-500/5 hover:bg-amber-500/10 transition-colors p-4 rounded-2xl flex flex-col justify-center items-center text-center group">
              <Building2 className="w-5 h-5 text-amber-500 mb-2 opacity-40 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-xl font-black text-amber-600 leading-none">{suppliers || 0}</h3>
              <p className="text-[0.5625rem] font-bold text-amber-600/60 uppercase tracking-widest mt-2">Supplier</p>
            </div>
          </Card>
        </div>

        {/* Main Settings Bento Grid - Efficient 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Column 1: Master Data */}
          <div className="space-y-6">
            <SettingsSection title="Profil Bisnis" subtitle="Identitas & Tipe" icon={Store}>
              <div className="p-4 space-y-4 border-b border-border/20">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Tipe Bisnis</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'FNB', label: 'FnB', desc: 'Menu' },
                    { id: 'RETAIL', label: 'Toko', desc: 'Barang' },
                    { id: 'GENERAL', label: 'Umum', desc: 'Produk' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={async () => {
                        if (profile?.businessType === t.id) return;
                        const isConfirmed = await confirm({
                          title: "Ganti Tipe Bisnis?",
                          message: `Tampilan aplikasi akan disesuaikan untuk tipe ${t.label}. Semua data Anda tetap aman.`,
                          type: "warning"
                        });
                        if (isConfirmed) saveProfile({ businessType: t.id as any });
                      }}
                      className={cn(
                        "p-3 rounded-2xl border-2 transition-all text-center",
                        profile?.businessType === t.id 
                          ? "border-primary bg-primary/5 shadow-md" 
                          : "border-border/50 bg-muted/20"
                      )}
                    >
                      <p className="text-[10px] font-black uppercase tracking-tighter text-foreground">{t.label}</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Informasi Toko</p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-foreground uppercase ml-1">Nama Bisnis</p>
                    <Input
                      className="h-12 px-5 rounded-xl bg-muted/30 border-none font-bold"
                      value={profile?.name || ""}
                      onChange={(e) => saveProfile({ name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-foreground uppercase ml-1">Alamat</p>
                    <textarea
                      className="w-full min-h-[80px] p-4 rounded-xl bg-muted/30 border border-border/10 font-bold text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={profile?.address || ""}
                      onChange={(e) => saveProfile({ address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection title="Kategori Produk" subtitle="Master Data" icon={Tag}>
              <div className="p-5 space-y-5">
                <div className="flex gap-2">
                  <Input
                    className="h-11 bg-muted/40 border-none rounded-xl px-4 text-sm"
                    placeholder="Kategori baru..."
                    value={newCat}
                    onChange={e => setNewCat(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory} size="icon" className="h-11 w-11 rounded-xl gradient-primary text-white shrink-0">
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-1 scroll-area">
                  {categories?.length === 0 && (
                    <div className="w-full py-6 text-center bg-muted/20 rounded-xl border border-dashed border-border/50">
                      <p className="text-[0.625rem] text-muted-foreground italic">Belum ada kategori</p>
                    </div>
                  )}
                  {categories?.map(c => (
                    <Badge 
                      key={c.id} 
                      variant="secondary" 
                      className="px-3 py-1.5 rounded-xl gap-2 bg-muted/60 hover:bg-muted border-none transition-all"
                    >
                      <span className="text-[0.6875rem] font-bold text-foreground">{c.name}</span>
                      <button onClick={() => c.id && handleDeleteCategory(c.id)} className="text-muted-foreground/40 hover:text-rose-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </SettingsSection>
          </div>

          {/* Column 2: Operations & Security */}
          <div className="space-y-6">
            <SettingsSection title="Fitur Bisnis" subtitle="Operasional" icon={Store}>
              <div className="divide-y divide-border/10">
                <SettingsRow label="Gunakan Nomor Meja" desc="Tampilkan pilihan meja" icon={Info} iconColor="bg-blue-500/10 text-blue-500">
                  <Switch checked={profile?.useTable} onCheckedChange={checked => saveProfile({ useTable: checked })} />
                </SettingsRow>
                <SettingsRow label="Catat HP Pelanggan" desc="Simpan data pelanggan" icon={Globe} iconColor="bg-indigo-500/10 text-indigo-500" last>
                  <Switch checked={profile?.usePhoneNumber} onCheckedChange={checked => saveProfile({ usePhoneNumber: checked })} />
                </SettingsRow>
              </div>
            </SettingsSection>

            <SettingsSection title="Keamanan Data" subtitle="Manajemen File" icon={Database}>
              <div className="divide-y divide-border/10">
                <SettingsRow icon={Download} iconColor="bg-emerald-500/10 text-emerald-500" label="Ekspor Backup" desc="Simpan ke JSON" onClick={handleBackup} />
                <input type="file" accept=".json" className="hidden" ref={restoreRef} onChange={handleRestore} />
                <SettingsRow icon={Upload} iconColor="bg-amber-500/10 text-amber-500" label="Impor Data" desc="Restore dari backup" onClick={() => restoreRef.current?.click()} last />
              </div>
            </SettingsSection>
          </div>

          {/* Column 3: Personalization & System */}
          <div className="space-y-6">
            <SettingsSection title="Tampilan & Tema" subtitle="Personalisasi" icon={Palette}>
              <div className="p-5 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200",
                        theme === t.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/40 hover:bg-muted"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", t.color)}>
                        <t.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[0.625rem] font-black uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 justify-between">
                  {[
                    { id: "violet", class: "bg-violet-500" },
                    { id: "blue", class: "bg-blue-500" },
                    { id: "emerald", class: "bg-emerald-500" },
                    { id: "rose", class: "bg-rose-500" },
                    { id: "amber", class: "bg-amber-500" },
                  ].map((color) => (
                    <button key={color.id} onClick={() => setAccent(color.id as any)} className="group touchable">
                      <div className={cn(
                        "w-9 h-9 rounded-xl transition-all duration-200 border-2",
                        accent === color.id ? "border-primary scale-110 shadow-lg" : "border-transparent opacity-60"
                      )}>
                        <div className={cn("w-full h-full rounded-lg", color.class)} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </SettingsSection>

            <SettingsSection title="Tindakan Berbahaya" subtitle="System" icon={Trash2}>
              <SettingsRow icon={RotateCcw} iconColor="bg-rose-500/10 text-rose-500" label="Reset Toko" desc="Setup dari awal" onClick={handleResetOnboarding} danger last />
            </SettingsSection>
          </div>
        </div>

        <div className="text-center space-y-4 pt-12 pb-12 opacity-50">
          <div className="space-y-1">
            <p className="text-[0.625rem] font-black uppercase tracking-[0.3em] text-foreground">TokoKu POS v1.0.0</p>
            <p className="text-[0.8125rem] font-bold text-muted-foreground">
              Dibuat oleh <span className="text-primary">Alfaruq Asri</span> • 
              <a 
                href="https://wa.me/6285359907696?text=Hai%20Alfaruq,%20saya%20ingin%20donasi%20untuk%20pengembangan%20aplikasi%20TokoKu%20POS" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline"
              >
                WA: 0853 5990 7696
              </a>
            </p>
          </div>
          
          <div className="max-w-xs mx-auto p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <p className="text-[0.75rem] font-semibold leading-relaxed">
              Aplikasi ini <span className="font-bold text-primary">GRATIS</span>. Jika Anda merasa terbantu dan ingin berdonasi, silakan hubungi WhatsApp di atas. Terus dukung digitalisasi UMKM Indonesia! 🇮🇩
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="w-8 h-[1px] bg-foreground/20" />
            <p className="text-[0.5625rem] font-medium italic">Digitalizing Indonesian UMKM with ❤️</p>
            <div className="w-8 h-[1px] bg-foreground/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
