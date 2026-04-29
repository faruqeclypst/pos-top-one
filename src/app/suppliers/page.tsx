"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db, { type Supplier } from "@/lib/db";
import {
  Search, Plus, Edit2, Trash2, Building2, Phone, MapPin,
  X, ChevronRight, ArrowUpDown, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Skeleton ──────────────────────────────────────────────
function SuppliersSkeleton() {
  return (
    <div className="p-4 space-y-3 pt-20 max-w-4xl mx-auto w-full">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-2xl shimmer h-20" />
      ))}
    </div>
  );
}

// ── Supplier List Item ─────────────────────────────────────
function SupplierItem({ supplier, onEdit, onDelete }: {
  supplier: Supplier;
  onEdit: (s: Supplier) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="card-premium p-4 flex items-center gap-4 group hover:border-primary/20 transition-colors">
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
        <Building2 className="w-6 h-6 text-primary" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{supplier.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>{supplier.contact || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{supplier.address || "-"}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(supplier)}
          className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center touchable"
        >
          <Edit2 className="w-4 h-4 text-primary" />
        </button>
        <button
          onClick={() => onDelete(supplier.id)}
          className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center touchable"
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
        </button>
      </div>
    </div>
  );
}

// ── Main Suppliers Page ───────────────────────────────────
export default function SuppliersPage() {
  const suppliers = useLiveQuery(() => db.suppliers.orderBy("name").toArray());
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    id: "", name: "", contact: "", address: ""
  });

  const filtered = suppliers?.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenForm = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id);
      setFormData(supplier);
    } else {
      setEditingId(null);
      setFormData({ id: `SUP-${Date.now()}`, name: "", contact: "", address: "" });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return alert("Nama supplier wajib diisi");

    try {
      const idToUse = formData.id || `SUP-${Date.now()}`;
      await db.suppliers.put({
        id: idToUse,
        name: formData.name!,
        contact: formData.contact || "",
        address: formData.address || "",
        createdAt: formData.createdAt || Date.now(),
      });
      setIsFormOpen(false);
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan data supplier.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus supplier ini? Semua data terkait mungkin akan terpengaruh.")) return;
    await db.suppliers.delete(id);
  };

  if (!suppliers) return <SuppliersSkeleton />;

  return (
    <div className="flex flex-col bg-background min-h-full pb-28">
      <div className="max-w-4xl mx-auto w-full">
        {/* ── Header ── */}
        <div className="bg-background/95 px-4 pt-5 pb-3 space-y-4" style={{ backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Daftar Pemasok</h1>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {suppliers.length} Supplier
            </span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full h-12 pl-10 pr-4 bg-muted/50 rounded-2xl text-sm placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-sm shadow-black/[0.02]"
              placeholder="Cari nama, telepon, atau alamat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── List ── */}
        <div className="flex-1 px-4 pt-2 space-y-3">
          {filtered?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-20 h-20 rounded-[2.5rem] bg-muted/50 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Tidak ada supplier</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Mulai dengan menambah supplier baru untuk mengelola inventori Anda.</p>
              </div>
            </div>
          ) : filtered?.map(s => (
            <SupplierItem key={s.id} supplier={s} onEdit={handleOpenForm} onDelete={handleDelete} />
          ))}
        </div>

        {/* ── FAB ── */}
        <button
          onClick={() => handleOpenForm()}
          className="fixed bottom-[88px] right-6 xl:right-[calc(50%-612px+24px)] w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-primary/30 touchable z-20"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* ── Form Sheet ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-border/50 bg-background/95 sticky top-0 z-10 backdrop-blur-md">
            <button onClick={() => setIsFormOpen(false)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold text-foreground">
              {editingId ? "Ubah Detail Supplier" : "Tambah Supplier Baru"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto scroll-area px-5 py-6 space-y-8 max-w-2xl mx-auto w-full">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground px-1">Nama Perusahaan / Supplier</p>
                <input
                  className="w-full h-12 px-4 bg-muted/40 rounded-2xl text-sm border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Contoh: PT Sumber Makmur"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground px-1">Nomor Telepon / WhatsApp</p>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className="w-full h-12 pl-11 pr-4 bg-muted/40 rounded-2xl text-sm border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="08123456789"
                    value={formData.contact}
                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground px-1">Alamat Kantor / Gudang</p>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 w-4 h-4 text-muted-foreground" />
                  <textarea
                    className="w-full h-32 pl-11 pr-4 py-3 bg-muted/40 rounded-2xl text-sm border border-border/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    placeholder="Jalan, Kecamatan, Kota..."
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Menghubungkan produk dengan supplier membantu Anda dalam melakukan audit stok dan mempermudah proses pemesanan ulang (Re-order).
              </p>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="px-5 pb-10 pt-4 border-t border-border/50 bg-background/95 backdrop-blur-md sticky bottom-0">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={handleSave}
                className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                {editingId ? "Simpan Perubahan" : "Simpan Supplier Baru"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
