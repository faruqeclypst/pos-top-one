"use client";

import { useState, ChangeEvent } from "react";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import { Button } from "@/components/ui/button";
import { Camera, Bluetooth, HardDrive, CheckCircle2, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import db from "@/lib/db";
import { cn } from "@/lib/utils";

const DUMMY_PRODUCTS = [
  { id: "P001", sku: "B-WANGI-5", barcode: "8991234567890", name: "Beras Pandan Wangi 5Kg", category: "Sembako", sellingPrice: 65000, cogs: 58000, stock: 20, unit: "Pcs", createdAt: Date.now() },
  { id: "P002", sku: "BIMOLI-2L", barcode: "8991234567891", name: "Minyak Goreng Bimoli 2L", category: "Sembako", sellingPrice: 34000, cogs: 31000, stock: 15, unit: "Botol", createdAt: Date.now() },
  { id: "P003", sku: "TELUR-1KG", barcode: "8991234567892", name: "Telur Ayam Negeri 1Kg", category: "Sembako", sellingPrice: 28000, cogs: 24000, stock: 30, unit: "Kg", createdAt: Date.now() },
  { id: "P004", sku: "GULA-1KG", barcode: "8991234567893", name: "Gula Pasir 1Kg", category: "Sembako", sellingPrice: 14000, cogs: 12500, stock: 25, unit: "Kg", createdAt: Date.now() },
  { id: "P005", sku: "TEH-SOSRO", barcode: "8991234567894", name: "Teh Botol Sosro 350ml", category: "Minuman", sellingPrice: 5000, cogs: 3500, stock: 48, unit: "Botol", createdAt: Date.now() },
  { id: "P006", sku: "IND-GORENG", barcode: "8991234567895", name: "Indomie Goreng", category: "Sembako", sellingPrice: 3500, cogs: 2800, stock: 100, unit: "Bungkus", createdAt: Date.now() },
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

  const handleInjectDummy = async () => {
    setIsInjecting(true);
    try {
      await db.products.bulkPut(DUMMY_PRODUCTS);
      await db.suppliers.bulkPut([
        { id: "S001", name: "PT Indofood Sukses Makmur", contact: "08123456789", address: "Jakarta Pusat", createdAt: Date.now() },
        { id: "S002", name: "CV Berkah Mandiri", contact: "08567891234", address: "Bandung", createdAt: Date.now() },
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

            <div className="pt-8 pb-10">
              <button
                disabled={!formData.name}
                onClick={() => setStep(2)}
                className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
                style={{ boxShadow: formData.name ? "0 4px 20px rgba(80, 70, 230, 0.35)" : "none" }}
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
              {/* Dummy Data Card */}
              <div className={cn(
                "rounded-2xl border-2 p-5 transition-all duration-300",
                injected ? "border-primary bg-primary/5" : "border-border bg-card"
              )}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-foreground">Paket Data Contoh</p>
                    <p className="text-xs text-muted-foreground mt-0.5">6 produk · 2 supplier · Data bisa dihapus kapan saja</p>
                  </div>
                  {injected && (
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {["Sembako", "Minuman", "Snack"].map(cat => (
                    <div key={cat} className="bg-muted/60 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-[10px] font-medium text-muted-foreground">{cat}</p>
                    </div>
                  ))}
                </div>
                {!injected ? (
                  <button
                    onClick={handleInjectDummy}
                    disabled={isInjecting}
                    className="w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold touchable disabled:opacity-50"
                  >
                    {isInjecting ? "Memuat data..." : "Tambahkan Data Contoh"}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 h-11 rounded-xl bg-primary/10 text-primary text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Data berhasil ditambahkan!
                  </div>
                )}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                atau lewati langkah ini dan mulai dengan data kosong
              </p>
            </div>

            <div className="pt-4 pb-10 space-y-3">
              <button
                onClick={() => setStep(3)}
                className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ boxShadow: "0 4px 20px rgba(80, 70, 230, 0.35)" }}
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

            <div className="pt-4 pb-10 space-y-3">
              <button
                onClick={handleFinish}
                className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ boxShadow: "0 4px 20px rgba(80, 70, 230, 0.35)" }}
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
