"use client";

import { useState } from "react";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UtensilsCrossed, Store, Briefcase, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { initGoogleApi, loginGoogle, findOrCreateSpreadsheet, downloadFromCloud } from "@/lib/google-sheets";

export default function Onboarding() {
  const { saveProfile } = useStoreProfile();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<'FNB' | 'RETAIL' | 'GENERAL'>('GENERAL');
  const [storeName, setStoreName] = useState("");

  const [isRestoring, setIsRestoring] = useState(false);

  const handleComplete = async () => {
    await saveProfile({
      name: storeName || (selectedType === 'FNB' ? "Resto Saya" : selectedType === 'RETAIL' ? "Toko Saya" : "Bisnis Saya"),
      businessType: selectedType,
      isOnboarded: true,
    });
    window.location.reload(); 
  };

  const handleGoogleLogin = async () => {
    setIsRestoring(true);
    try {
      await initGoogleApi();
      const token = await loginGoogle();
      if (!token) throw new Error("Gagal mendapatkan token Google");
      const spreadsheetId = await findOrCreateSpreadsheet(token);
      
      if (spreadsheetId) {
        const success = await downloadFromCloud(spreadsheetId);
        if (success) {
          alert("Data berhasil ditemukan! Memuat aplikasi...");
          window.location.reload();
          return;
        }
      }
      alert("Akun Google terhubung, silakan lanjut setup nama toko.");
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Gagal login Google.");
    } finally {
      setIsRestoring(false);
    }
  };

  const types = [
    {
      id: 'FNB',
      label: 'F&B (Kuliner)',
      desc: 'Restoran, Kafe, atau Warung Makan. Fokus ke Menu & Meja.',
      icon: UtensilsCrossed,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      id: 'RETAIL',
      label: 'Toko (Retail)',
      desc: 'Minimarket, Butik, atau Toko Kelontong. Fokus ke Barang & Stok.',
      icon: Store,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      id: 'GENERAL',
      label: 'Umum (Jasa/Lainnya)',
      desc: 'Laundry, Bengkel, atau Jasa lainnya. Fokus ke Produk & Layanan.',
      icon: Briefcase,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10'
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-md space-y-8">
        
        <div className="text-center space-y-2">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6"
          >
            <div className="w-12 h-12 bg-primary rounded-[1.5rem] shadow-lg shadow-primary/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">TokoKu POS</h1>
          <p className="text-muted-foreground text-sm font-medium">Mari siapkan sistem sesuai kebutuhan bisnis Anda</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Pilih Tipe Bisnis</p>
              <div className="grid grid-cols-1 gap-3">
                {types.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedType(t.id as any)}
                    className={cn(
                      "p-5 rounded-3xl border-2 transition-all flex items-center gap-5 text-left group",
                      selectedType === t.id 
                        ? "border-primary bg-primary/5 shadow-md" 
                        : "border-border/50 bg-card hover:border-primary/20"
                    )}
                  >
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", t.bg, t.color)}>
                      <t.icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-foreground text-base tracking-tight">{t.label}</p>
                      <p className="text-xs text-muted-foreground leading-tight mt-1">{t.desc}</p>
                    </div>
                    {selectedType === t.id && (
                      <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="pt-4 space-y-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  Lanjut
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                    <span className="bg-background px-4 text-muted-foreground">Atau</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={isRestoring}
                  className="w-full h-14 bg-card border-2 border-border/50 text-foreground rounded-[2rem] font-bold text-xs flex items-center justify-center gap-3 active:scale-95 transition-all hover:border-primary/20"
                >
                  {isRestoring ? (
                    "Menghubungkan..."
                  ) : (
                    <>
                      <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale" alt="Google" />
                      Login & Restore Data Cloud
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6 bg-card border border-border/50 p-8 rounded-[2.5rem] shadow-sm"
            >
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detail Bisnis</p>
                <div className="space-y-2">
                  <label className="text-xs font-black text-foreground uppercase ml-1">Nama Toko / Resto</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder={selectedType === 'FNB' ? "Contoh: Warung Enak" : "Contoh: Toko Berkah"}
                    className="w-full h-14 px-6 rounded-2xl bg-muted/30 border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-foreground"
                  />
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={handleComplete}
                  className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  Mulai Sekarang
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="w-full h-14 bg-muted/50 text-muted-foreground rounded-[2rem] font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
                >
                  Kembali
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
