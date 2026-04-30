"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db, { type Supplier } from "@/lib/db";
import {
  Search, Plus, Edit2, Trash2, Building2, Phone, MapPin,
  X, ChevronRight, ArrowUpDown, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ── Skeleton ──────────────────────────────────────────────
function SuppliersSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
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
    <div className="hidden lg:grid grid-cols-[80px_1fr_200px_1fr_120px] gap-4 px-6 py-3 mb-2 text-[0.625rem] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/5">
      <span>Profil</span>
      <span>Nama Pemasok</span>
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
      <div className="flex flex-col lg:grid lg:grid-cols-[80px_1fr_200px_1fr_120px] items-center gap-4 lg:gap-4 lg:h-20 lg:px-4">
        {/* Box 1: Profile Icon */}
        <div className="w-16 h-16 lg:w-12 lg:h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <Building2 className="w-6 h-6" />
        </div>

        {/* Box 2: Name */}
        <div className="flex-1 w-full min-w-0 text-center lg:text-left">
          <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{supplier.name}</h3>
          <p className="text-[0.625rem] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5">ID: {supplier.id.slice(-6)}</p>
        </div>

        {/* Box 3: Contact */}
        <div className="flex lg:flex flex-col w-full lg:w-auto items-center lg:items-start bg-muted/20 lg:bg-transparent rounded-xl p-3 lg:p-0">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-xs font-bold text-foreground">{supplier.contact || "-"}</span>
          </div>
          <span className="lg:hidden text-[0.5625rem] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Telepon</span>
        </div>

        {/* Box 4: Address */}
        <div className="hidden lg:flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <p className="text-[0.6875rem] text-muted-foreground line-clamp-2 leading-relaxed">
            {supplier.address || "Tidak ada alamat"}
          </p>
        </div>

        {/* Box 5: Actions */}
        <div className="flex items-center justify-center lg:justify-end gap-1 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-none border-border/10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(supplier)}
            className="w-9 h-9 rounded-xl hover:bg-blue-500/10 hover:text-blue-500"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(supplier.id)}
            className="w-9 h-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500"
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
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    address: ""
  });

  const filtered = suppliers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenForm = (s?: Supplier) => {
    if (s) {
      setEditingId(s.id);
      setFormData({
        name: s.name,
        contact: s.contact || "",
        address: s.address || ""
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", contact: "", address: "" });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    const data = { ...formData, updatedAt: Date.now() };
    if (editingId) {
      await db.suppliers.update(editingId, data);
    } else {
      await db.suppliers.add({ ...data, id: `SUPP-${Date.now()}`, createdAt: Date.now() });
    }
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus pemasok ini? Semua produk terkait tetap ada tetapi tanpa relasi pemasok.")) {
      await db.suppliers.delete(id);
    }
  };

  if (!suppliers) return <SuppliersSkeleton />;

  return (
    <div className="pb-32 animate-in fade-in duration-500 min-h-screen bg-background">
      <PageHeader
        title="Pemasok Barang"
        subtitle="Daftar Mitra"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
              <Input
                className="h-10 w-64 pl-9 bg-muted/40 border-none rounded-xl text-sm"
                placeholder="Cari pemasok..."
                value={search}
                onChange={e => setSearch(e.target.value)}
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
            placeholder="Cari pemasok..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {/* Bento Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="p-6 border-none shadow-sm bg-primary/5 backdrop-blur-sm relative overflow-hidden group hover:bg-primary/10 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Building2 className="w-16 h-16 text-primary" />
            </div>
            <div className="relative z-10">
              <p className="text-[0.625rem] font-black text-primary/60 uppercase tracking-[0.2em] mb-1">Total Pemasok</p>
              <h3 className="text-3xl font-black text-primary tracking-tight">{suppliers.length}</h3>
              <p className="text-[0.625rem] font-bold text-primary/40 mt-1">Mitra bisnis aktif</p>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-blue-500/5 backdrop-blur-sm relative overflow-hidden group hover:bg-blue-500/10 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Phone className="w-16 h-16 text-blue-500" />
            </div>
            <div className="relative z-10">
              <p className="text-[0.625rem] font-black text-blue-600/60 uppercase tracking-[0.2em] mb-1">Kontak Tersedia</p>
              <h3 className="text-3xl font-black text-blue-600 tracking-tight">
                {suppliers.filter(s => !!s.contact).length}
              </h3>
              <p className="text-[0.625rem] font-bold text-blue-600/40 mt-1">Pemasok dengan nomor telepon</p>
            </div>
          </Card>
        </div>

        {/* Bento Table */}
        <div className="space-y-1">
          <SupplierTableHeader />
          {filtered?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
              <div className="w-24 h-24 rounded-[3rem] bg-muted/30 flex items-center justify-center relative">
                <Building2 className="w-12 h-12 text-muted-foreground/20" />
                <div className="absolute inset-0 rounded-[3rem] border border-dashed border-muted-foreground/20 animate-pulse" />
              </div>
              <p className="text-base font-black text-foreground uppercase tracking-widest">Pemasok Tidak Ditemukan</p>
            </div>
          ) : (
            filtered?.map((s, idx) => (
              <div 
                key={s.id} 
                className="animate-in slide-in-from-bottom-2 duration-300 fill-mode-both"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <SupplierBentoRow
                  supplier={s}
                  onEdit={handleOpenForm}
                  onDelete={handleDelete}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Form Modal ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[110] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-5 pt-10 pb-4 border-b border-border/50 bg-background/95 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-bold text-foreground">
                {editingId ? "Ubah Detail Pemasok" : "Tambah Pemasok Baru"}
              </h2>
            </div>
            <Button onClick={handleSave} className="h-10 rounded-xl gradient-primary text-white font-bold text-xs tracking-wider px-6">
              SIMPAN
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto scroll-area px-5 py-6 space-y-8 max-w-2xl mx-auto w-full pb-32">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Informasi Pemasok</p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-[0.625rem] font-bold text-foreground/60 ml-1">Nama Perusahaan / Perorangan</p>
                    <Input
                      className="h-12 px-4 rounded-xl bg-muted/30 border-none"
                      placeholder="Contoh: PT Sumber Makmur"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="text-[0.625rem] font-bold text-foreground/60 ml-1">Nomor Telepon / WhatsApp</p>
                    <Input
                      className="h-12 px-4 rounded-xl bg-muted/30 border-none"
                      placeholder="08123456789"
                      value={formData.contact}
                      onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[0.625rem] font-bold text-foreground/60 ml-1">Alamat Lengkap</p>
                    <textarea
                      className="w-full h-32 px-4 py-3 bg-muted/30 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner-sm"
                      placeholder="Jalan, Kecamatan, Kota..."
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Card className="bg-primary/5 border-none p-4 flex gap-3 rounded-2xl">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary/80 leading-relaxed font-medium">
                  Menambahkan informasi pemasok yang lengkap membantu Anda dalam mengelola rantai pasok dan mempermudah komunikasi saat melakukan restok barang.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
