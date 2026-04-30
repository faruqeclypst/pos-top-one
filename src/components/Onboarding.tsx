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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Step 1: Store Info */}
        {step === 1 && (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto overflow-hidden rounded-3xl">
                <img src="/logo-default.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Mulai TokoKu</h1>
            </div>

            <div className="space-y-3">
              <input
                className="w-full h-14 px-6 bg-muted/40 rounded-2xl text-sm border border-transparent focus:border-primary/20 outline-none transition-all font-bold text-center"
                placeholder="Nama Toko"
                value={formData.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                className="w-full h-14 px-6 bg-muted/40 rounded-2xl text-sm border border-transparent focus:border-primary/20 outline-none transition-all text-center font-medium"
                placeholder="Alamat (Opsional)"
                value={formData.address}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address: e.target.value })}
              />
              <input
                type="tel"
                className="w-full h-14 px-6 bg-muted/40 rounded-2xl text-sm border border-transparent focus:border-primary/20 outline-none transition-all text-center font-medium"
                placeholder="WhatsApp (Opsional)"
                value={formData.phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <button
              disabled={!formData.name}
              onClick={() => setStep(2)}
              className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm disabled:opacity-30 transition-all active:scale-95"
            >
              LANJUTKAN
            </button>
          </div>
        )}

        {/* Step 2: Dummy Data */}
        {step === 2 && (
          <div className="space-y-8 text-center animate-in fade-in slide-in-from-right-4 duration-400">
            <div className="space-y-3">
              <h1 className="text-2xl font-black">Data Contoh</h1>
              <p className="text-sm text-muted-foreground">Pilih jenis usaha Anda untuk mengisi data awal secara otomatis.</p>
            </div>

            <div className="space-y-3">
              {[
                { id: "fnb", title: "UMKM FnB (Kuliner)", icon: "☕" },
                { id: "grocery", title: "UMKM Kelontong", icon: "🏠" },
              ].map(type => (
                <button
                  key={type.id}
                  disabled={isInjecting || injected}
                  onClick={() => handleInjectDummy(type.id as any)}
                  className={cn(
                    "w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between",
                    injected ? "opacity-50 grayscale" : "hover:border-primary/30 active:scale-95 border-muted/30"
                  )}
                >
                  <span className="font-bold">{type.title}</span>
                  {injected ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <span className="text-xl">{type.icon}</span>}
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-6">
              <button
                onClick={() => setStep(3)}
                className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm"
              >
                LANJUTKAN
              </button>
              <button onClick={() => setStep(1)} className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                KEMBALI
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Permissions */}
        {step === 3 && (
          <div className="space-y-8 text-center animate-in fade-in slide-in-from-right-4 duration-400">
            <div className="space-y-3">
              <h1 className="text-2xl font-black">Akses Perangkat</h1>
              <p className="text-sm text-muted-foreground">Aplikasi membutuhkan izin berikut agar berjalan optimal.</p>
            </div>

            <div className="space-y-2">
              {["Kamera (Scan Barcode)", "Bluetooth (Print Struk)", "Penyimpanan (Data)"].map(item => (
                <div key={item} className="p-4 rounded-xl bg-muted/30 text-sm font-bold text-foreground">
                  {item}
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-6">
              <button
                onClick={handleFinish}
                className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm"
              >
                MULAI SEKARANG
              </button>
              <button onClick={() => setStep(2)} className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                KEMBALI
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
