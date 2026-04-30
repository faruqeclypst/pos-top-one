"use client";

import { useState, ChangeEvent } from "react";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import { Button } from "@/components/ui/button";
import { Camera, Bluetooth, HardDrive, CheckCircle2, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import db from "@/lib/db";
import { cn } from "@/lib/utils";

const DUMMY_FNB = [
  { id: "F001", sku: "KOPI-AREN", barcode: "100001", name: "Kopi Susu Gula Aren", category: "Minuman", sellingPrice: 18000, cogs: 8000, stock: 50, unit: "Cup", createdAt: Date.now() },
  { id: "F002", sku: "TEH-TARIK", barcode: "100002", name: "Teh Tarik Medan", category: "Minuman", sellingPrice: 12000, cogs: 5000, stock: 50, unit: "Cup", createdAt: Date.now() },
  { id: "F003", sku: "NASGOR-SP", barcode: "100003", name: "Nasi Goreng Spesial", category: "Makanan", sellingPrice: 25000, cogs: 12000, stock: 100, unit: "Porsi", createdAt: Date.now() },
  { id: "F004", sku: "MIE-AYAM", barcode: "100004", name: "Mie Ayam Bakso", category: "Makanan", sellingPrice: 20000, cogs: 10000, stock: 100, unit: "Porsi", createdAt: Date.now() },
  { id: "F005", sku: "FRENCH-FRIES", barcode: "100005", name: "Kentang Goreng", category: "Camilan", sellingPrice: 15000, cogs: 7000, stock: 100, unit: "Porsi", createdAt: Date.now() },
  { id: "F006", sku: "ES-JERUK", barcode: "100006", name: "Es Jeruk Peras", category: "Minuman", sellingPrice: 10000, cogs: 4000, stock: 50, unit: "Gelas", createdAt: Date.now() },
];

const DUMMY_GROCERY = [
  { id: "G001", sku: "BERAS-5KG", barcode: "200001", name: "Beras Pandan Wangi 5Kg", category: "Sembako", sellingPrice: 75000, cogs: 68000, stock: 20, unit: "Pcs", createdAt: Date.now() },
  { id: "G002", sku: "MINYAK-2L", barcode: "200002", name: "Minyak Goreng 2L", category: "Sembako", sellingPrice: 34000, cogs: 31000, stock: 15, unit: "Pcs", createdAt: Date.now() },
  { id: "G003", sku: "TELUR-1KG", barcode: "200003", name: "Telur Ayam 1Kg", category: "Sembako", sellingPrice: 28000, cogs: 24000, stock: 30, unit: "Kg", createdAt: Date.now() },
  { id: "G004", sku: "GULA-1KG", barcode: "200004", name: "Gula Pasir 1Kg", category: "Sembako", sellingPrice: 16000, cogs: 14500, stock: 25, unit: "Kg", createdAt: Date.now() },
  { id: "G005", sku: "TEPUNG-1KG", barcode: "200005", name: "Tepung Terigu 1Kg", category: "Bahan Pokok", sellingPrice: 12000, cogs: 10500, stock: 20, unit: "Kg", createdAt: Date.now() },
  { id: "G006", sku: "INDOMIE-G", barcode: "200006", name: "Indomie Goreng (DUS)", category: "Mie Instan", sellingPrice: 115000, cogs: 108000, stock: 10, unit: "Dus", createdAt: Date.now() },
];

const STEPS = [
  { id: 1, title: "Profil Toko", desc: "Informasi dasar bisnis Anda" },
  { id: 2, title: "Data Awal", desc: "Isi data percobaan (opsional)" },
  { id: 3, title: "Izin Akses", desc: "Aktifkan fitur hardware" },
];

export default function Onboarding() {
  const { saveProfile } = useStoreProfile();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", address: "", phone: "" });
  const [isInjecting, setIsInjecting] = useState(false);
  const [injected, setInjected] = useState(false);

  const handleInjectDummy = async (type: "fnb" | "grocery") => {
    setIsInjecting(true);
    try {
      const data = type === "fnb" ? DUMMY_FNB : DUMMY_GROCERY;
      await db.products.bulkPut(data);
      
      const categories = Array.from(new Set(data.map(d => d.category))).map(name => ({ name }));
      await db.categories.bulkPut(categories);

      await db.suppliers.bulkPut([
        { id: "S001", name: "Supplier Utama (Pusat)", contact: "08123456789", address: "Kota Terdekat", createdAt: Date.now() },
        { id: "S002", name: "Grosir Berkah Mandiri", contact: "08567891234", address: "Pasar Induk", createdAt: Date.now() },
      ]);
      setInjected(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInjecting(false);
    }
  };

  const handleFinish = async () => {
    await saveProfile({ ...formData, theme: "light", isOnboarded: true, useTable: false, usePhoneNumber: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Gradient top bar */}
      <div className="gradient-primary h-1.5" />

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-5">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 pt-10 pb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                step > s.id ? "bg-primary text-white" :
                step === s.id ? "bg-primary text-white ring-4 ring-primary/20" :
                "bg-muted text-muted-foreground"
              )}>
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("w-8 h-0.5 rounded-full transition-all duration-500", step > s.id ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Store Info */}
        {step === 1 && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="mb-8">
              <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mb-4"
                style={{ boxShadow: "0 8px 24px rgba(80, 70, 230, 0.3)" }}>
                <HardDrive className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Selamat Datang!</h1>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                Mari kita siapkan toko Anda. Informasi ini akan tampil di struk dan laporan.
              </p>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-1.5">
                  Nama Toko *
                </label>
                <input
                  className="w-full h-13 px-4 bg-muted/60 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
                  style={{ height: "52px" }}
                  placeholder="Contoh: Toko Berkah Jaya"
                  value={formData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-1.5">
                  Alamat
                </label>
                <input
                  className="w-full h-13 px-4 bg-muted/60 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  style={{ height: "52px" }}
                  placeholder="Jalan, Kecamatan, Kota"
                  value={formData.address}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-1.5">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  className="w-full h-13 px-4 bg-muted/60 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  style={{ height: "52px" }}
                  placeholder="08xxxxxxxxxx"
                  value={formData.phone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-8 pb-20">
              <button
                disabled={!formData.name}
                onClick={() => setStep(2)}
                className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
                style={{ 
                  boxShadow: formData.name ? "0 4px 20px rgba(80, 70, 230, 0.35)" : "none",
                  marginBottom: "env(safe-area-inset-bottom, 24px)"
                }}
              >
                Lanjutkan <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Dummy Data */}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="mb-8">
              <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-violet-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Data Percobaan</h1>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                Ingin langsung coba semua fitur? Isi data contoh produk dan supplier secara otomatis.
              </p>
            </div>

            <div className="flex-1 space-y-4">
              {/* Dummy Data Selection */}
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: "fnb", title: "UMKM FnB (Kuliner)", desc: "Menu kopi, makanan berat, & snack", icon: "☕" },
                  { id: "grocery", title: "UMKM Kelontong (Sembako)", desc: "Beras, telur, minyak, & tepung", icon: "🏠" },
                ].map(type => (
                  <button
                    key={type.id}
                    disabled={isInjecting || injected}
                    onClick={() => handleInjectDummy(type.id as any)}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left",
                      injected ? "opacity-50 grayscale pointer-events-none" : 
                      "hover:bg-primary/5 active:scale-[0.98] border-border"
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{type.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                    </div>
                    {injected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>

              {injected && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 text-primary text-xs font-bold animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4" /> Data berhasil ditambahkan!
                </div>
              )}

              <p className="text-center text-[0.625rem] text-muted-foreground pt-2">
                Pilih salah satu paket data untuk memulai dengan cepat.
                <br />Data ini bisa dihapus atau diubah nantinya.
              </p>
            </div>

            <div className="pt-4 pb-20 space-y-3">
              <button
                onClick={() => setStep(3)}
                className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ 
                  boxShadow: "0 4px 20px rgba(80, 70, 230, 0.35)",
                  marginBottom: "env(safe-area-inset-bottom, 0px)"
                }}
              >
                Lanjutkan <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => setStep(1)} className="w-full h-11 rounded-2xl text-muted-foreground text-sm font-medium">
                ← Kembali
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Permissions */}
        {step === 3 && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="mb-8">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Izin Akses</h1>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                Beberapa fitur membutuhkan izin perangkat. Anda bisa mengaktifkannya sekarang atau nanti.
              </p>
            </div>

            <div className="flex-1 space-y-3">
              {[
                {
                  icon: Camera, color: "bg-blue-50 text-blue-600",
                  title: "Kamera", desc: "Scan barcode untuk input produk dan kasir yang lebih cepat"
                },
                {
                  icon: Bluetooth, color: "bg-violet-50 text-violet-600",
                  title: "Bluetooth", desc: "Cetak struk ke printer thermal tanpa kabel"
                },
                {
                  icon: HardDrive, color: "bg-emerald-50 text-emerald-600",
                  title: "Penyimpanan", desc: "Simpan backup database dan ekspor laporan ke perangkat"
                },
              ].map(item => (
                <div key={item.title} className="card-premium p-4 flex items-start gap-4">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", item.color)}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}

              <p className="text-xs text-muted-foreground/70 text-center pt-2 px-4">
                * Izin akan diminta secara otomatis saat fitur digunakan pertama kali di aplikasi Android
              </p>
            </div>

            <div className="pt-4 pb-20 space-y-3">
              <button
                onClick={handleFinish}
                className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ 
                  boxShadow: "0 4px 20px rgba(80, 70, 230, 0.35)",
                  marginBottom: "env(safe-area-inset-bottom, 0px)"
                }}
              >
                <CheckCircle2 className="w-5 h-5" />
                Mulai Gunakan TokoKu
              </button>
              <button onClick={() => setStep(2)} className="w-full h-11 rounded-2xl text-muted-foreground text-sm font-medium">
                ← Kembali
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
