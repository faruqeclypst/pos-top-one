"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db, { type Supplier } from "@/lib/db";
import {
  Search, Plus, Edit2, Trash2, Building2, Phone, MapPin,
  X, Info, CheckCircle2, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { useConfirm } from "@/hooks/useConfirm";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import { getTerminology } from "@/lib/terminology";
import { motion, AnimatePresence } from "framer-motion";

// ── Skeleton ──────────────────────────────────────────────
function SuppliersSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full h-48 shimmer mb-6" />
      <div className="px-5 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
        {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-[2rem] shimmer" />)}
      </div>
    </div>
  );
}

// ── Supplier Bento Row ─────────────────────────────────────
function SupplierBentoRow({ supplier, onEdit, onDelete }: {
  supplier: Supplier;
  onEdit: (s: Supplier) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="card-elevated p-4 lg:p-6 mb-4 group hover:shadow-xl transition-all duration-300 bg-card rounded-[2rem] border-transparent">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        
        {/* Left: Icon & Name */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-2xl gradient-primary text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-foreground truncate group-hover:text-primary transition-colors">{supplier.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                #{String(supplier.id).slice(-4)}
              </span>
              {supplier.contact && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <Phone className="w-3 h-3" />
                  {supplier.contact}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Address (Hidden on Mobile if empty, otherwise shown cleanly) */}
        {supplier.address && (
          <div className="flex items-center gap-3 lg:w-1/3 shrink-0 bg-muted/30 p-3 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed">
              {supplier.address}
            </span>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/10">
          <Button 
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onEdit(supplier); }}
            className="flex-1 lg:flex-none h-12 lg:h-12 w-full lg:w-12 rounded-xl lg:rounded-2xl border-blue-500/20 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
          </Button>

          <Button 
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onDelete(supplier.id); }}
            className="flex-1 lg:flex-none h-12 lg:h-12 w-full lg:w-12 rounded-xl lg:rounded-2xl border-rose-500/20 text-rose-600 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
      </div>
    </Card>
  );
}

// ── Main Suppliers Page ───────────────────────────────────
export default function SuppliersPage() {
  const { profile } = useStoreProfile();
  const terms = getTerminology(profile?.businessType);
  const confirm = useConfirm();
  const suppliers = useLiveQuery(() => db.suppliers.toArray());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", contact: "", address: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contact || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenForm = (s?: Supplier) => {
    if (s) {
      setEditingId(s.id);
      setFormData({ name: s.name, contact: s.contact, address: s.address });
    } else {
      setEditingId(null);
      setFormData({ name: "", contact: "", address: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await db.suppliers.update(editingId, { ...formData });
    } else {
      await db.suppliers.add({
        id: `SUPP-${Date.now()}`,
        ...formData,
        createdAt: Date.now()
      });
    }
    setIsModalOpen(false);
    setFormData({ name: "", contact: "", address: "" });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Hapus Supplier?",
      message: `Semua ${terms.product.toLowerCase()} terkait tetap ada tetapi tanpa relasi supplier. Lanjutkan?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger"
    });
    if (ok) {
      await db.suppliers.delete(id);
    }
  };

  if (!suppliers) return <SuppliersSkeleton />;

  return (
    <div className="pb-32 min-h-screen bg-background">
      <PageHeader
        title="Supplier Bisnis"
        subtitle="Daftar Mitra"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                className="h-12 w-72 pl-11 bg-card border-none rounded-2xl font-bold shadow-sm"
                placeholder="Cari nama atau kontak..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={() => handleOpenForm()}
              className="h-12 px-6 rounded-2xl gradient-primary text-white font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Tambah Mitra</span>
            </Button>
          </div>
        }
      />

      <div className="w-full px-5 pt-8 mx-auto space-y-8 max-w-[1600px]">
        {/* Mobile Search */}
        <div className="relative group lg:hidden mb-6">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary" />
          <Input
            className="h-14 pl-14 bg-card border-none rounded-3xl font-bold shadow-sm w-full text-base"
            placeholder="Cari supplier..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Bento Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <Card className="p-6 lg:p-8 card-elevated rounded-[2.5rem] bg-card relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 p-8 bg-primary/5 rounded-[3rem] group-hover:scale-110 transition-transform duration-500">
              <Building2 className="w-12 h-12 text-primary/40" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Total Mitra</p>
              <h3 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter">{suppliers.length}</h3>
              <p className="text-xs font-bold text-primary mt-4 uppercase tracking-widest">Supplier Terdaftar</p>
            </div>
          </Card>

          <Card className="p-6 lg:p-8 card-elevated rounded-[2.5rem] bg-blue-500 text-white relative overflow-hidden group shadow-lg shadow-blue-500/20">
            <div className="absolute -right-6 -top-6 p-8 bg-white/10 rounded-[3rem] group-hover:scale-110 transition-transform duration-500">
              <Phone className="w-12 h-12 text-white/50" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mb-2">Kontak Aktif</p>
              <h3 className="text-4xl lg:text-5xl font-black tracking-tighter">{suppliers.filter(s => s.contact).length}</h3>
              <p className="text-xs font-bold text-blue-100 mt-4 uppercase tracking-widest">Siap Dihubungi</p>
            </div>
          </Card>

          <Card className="p-6 lg:p-8 card-elevated rounded-[2.5rem] bg-emerald-500 text-white relative overflow-hidden group shadow-lg shadow-emerald-500/20">
            <div className="absolute -right-6 -top-6 p-8 bg-white/10 rounded-[3rem] group-hover:scale-110 transition-transform duration-500">
              <CheckCircle2 className="w-12 h-12 text-white/50" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mb-2">Status Data</p>
              <h3 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight mt-2">Terverifikasi</h3>
              <p className="text-xs font-bold text-emerald-100 mt-6 uppercase tracking-widest">Aman & Tersinkron</p>
            </div>
          </Card>
        </div>

        {/* List Section */}
        <div className="w-full pt-4">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Daftar Supplier</h2>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              {filteredSuppliers?.length || 0} DITEMUKAN
            </span>
          </div>

          {filteredSuppliers?.length === 0 ? (
            <div className="py-24 text-center space-y-5 bg-card/50 rounded-[3rem] border-2 border-dashed border-border/50">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                <Search className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">Belum Ada Data</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Coba tambahkan supplier baru</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSuppliers?.map(s => (
                <SupplierBentoRow
                  key={s.id}
                  supplier={s}
                  onEdit={handleOpenForm}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 lg:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground uppercase tracking-tighter">
                      {editingId ? "Edit Mitra" : "Mitra Baru"}
                    </h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      Data Supplier
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nama Bisnis / PT</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: PT. Sumber Makmur"
                      className="h-14 px-6 rounded-2xl bg-muted/40 border-none font-bold text-base focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Kontak / No. WhatsApp</label>
                    <Input
                      value={formData.contact}
                      onChange={e => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="08xx xxxx xxxx"
                      className="h-14 px-6 rounded-2xl bg-muted/40 border-none font-bold text-base focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Alamat Lengkap (Opsional)</label>
                    <textarea
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Masukkan alamat lengkap..."
                      className="w-full min-h-[120px] p-6 rounded-2xl bg-muted/40 border-none font-bold text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-16 rounded-[2rem] gradient-primary text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {editingId ? "Simpan Perubahan" : "Simpan Mitra Baru"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
