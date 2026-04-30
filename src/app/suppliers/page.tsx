"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db, { type Supplier } from "@/lib/db";
import {
  Search, Plus, Edit2, Trash2, Building2, Phone, MapPin,
  X, Info, CheckCircle2
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
    <div className="">
      <div className="w-full h-48 shimmer mb-6" />
      <div className="px-5 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl shimmer" />)}
      </div>
    </div>
  );
}

// ── Bento Table Header ─────────────────────────────────────
function SupplierTableHeader() {
  return (
    <div className="hidden lg:grid grid-cols-[1fr_200px_1fr_120px] gap-4 px-6 py-3 mb-2 text-[0.625rem] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/5">
      <span>Nama Supplier</span>
      <span>Kontak</span>
      <span>Alamat</span>
      <span className="text-right">Aksi</span>
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
    <Card className="group p-4 lg:p-0 overflow-hidden border-none shadow-sm bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-300 mb-3 rounded-2xl">
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_200px_1fr_120px] items-center gap-4 lg:gap-4 lg:h-20 lg:px-4">
        {/* Box 1: Name */}
        <div className="flex items-center gap-4 w-full min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-center lg:text-left">
            <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{supplier.name}</h3>
            <p className="text-[0.625rem] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">Supplier ID: #{supplier.id.slice(-4).toUpperCase()}</p>
          </div>
        </div>

        {/* Box 2: Contact */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{supplier.contact || "-"}</span>
        </div>

        {/* Box 3: Address */}
        <div className="flex items-center gap-2 text-muted-foreground w-full lg:w-auto">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-medium truncate">{supplier.address || "Tidak ada alamat"}</span>
        </div>

        {/* Box 4: Actions */}
        <div className="flex items-center justify-center lg:justify-end gap-2 w-full lg:w-auto mt-2 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-none border-border/10">
          <button 
            onClick={() => onEdit(supplier)}
            className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(supplier.id)}
            className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
    <div className="pb-32  min-h-screen bg-background">
      <PageHeader
        title="Supplier Bisnis"
        subtitle="Daftar Mitra"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
              <Input
                className="h-10 w-64 pl-9 bg-muted/40 border-none rounded-xl text-sm"
                placeholder="Cari supplier..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={() => handleOpenForm()}
              className="h-10 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 px-4 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah</span>
            </Button>
          </div>
        }
      />

      <div className="w-full px-5 pt-8 mx-auto space-y-8 max-w-[1600px]">
        {/* Mobile Search */}
        <div className="relative group md:hidden">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <Input
            className="h-12 pl-12 bg-muted/40 border-none rounded-2xl text-sm"
            placeholder="Cari supplier..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        {/* Bento Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Card className="p-4 border-none shadow-sm bg-primary/5 backdrop-blur-sm relative overflow-hidden group hover:bg-primary/10 transition-colors">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
            <div className="relative z-10">
              <p className="text-[8px] font-black text-primary/60 uppercase tracking-[0.2em] mb-1">Total Supplier</p>
              <h3 className="text-2xl font-black text-primary tracking-tight">{suppliers.length}</h3>
              <p className="text-[8px] font-bold text-primary/40 mt-1">Mitra aktif</p>
            </div>
          </Card>

          <Card className="p-4 border-none shadow-sm bg-blue-500/5 backdrop-blur-sm relative overflow-hidden group hover:bg-blue-500/10 transition-colors">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
              <Phone className="w-12 h-12 text-blue-500" />
            </div>
            <div className="relative z-10">
              <p className="text-[8px] font-black text-blue-500/60 uppercase tracking-[0.2em] mb-1">Kontak Mitra</p>
              <h3 className="text-2xl font-black text-blue-500 tracking-tight">{suppliers.filter(s => s.contact).length}</h3>
              <p className="text-[8px] font-bold text-blue-500/40 mt-1">Memiliki kontak</p>
            </div>
          </Card>
        </div>

        {/* List */}
        <div className="space-y-4">
          <SupplierTableHeader />
          {filteredSuppliers?.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border/50">
              <div className="w-20 h-20 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground/20" />
              </div>
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Tidak Ditemukan</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Coba kata kunci lain</p>
            </div>
          ) : (
            filteredSuppliers?.map(s => (
              <SupplierBentoRow
                key={s.id}
                supplier={s}
                onEdit={handleOpenForm}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-card border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-tighter">
                    {editingId ? "Edit Supplier" : "Supplier Baru"}
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-muted/50 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground uppercase ml-1">Nama Supplier</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: PT. Sumber Makmur"
                      className="h-14 px-6 rounded-2xl bg-muted/30 border-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground uppercase ml-1">Kontak / No. HP</label>
                    <Input
                      value={formData.contact}
                      onChange={e => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="08xx xxxx xxxx"
                      className="h-14 px-6 rounded-2xl bg-muted/30 border-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground uppercase ml-1">Alamat</label>
                    <textarea
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Alamat lengkap supplier..."
                      className="w-full min-h-[100px] p-6 rounded-2xl bg-muted/30 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  {editingId ? "Simpan Perubahan" : "Tambah Supplier"}
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
