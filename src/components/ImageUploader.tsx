"use client";

import { useState, useRef, useEffect } from "react";
import { Camera as CameraIcon, X, Image as ImageIcon, FileSearch, CameraIcon as CameraDevice } from "lucide-react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  initialBlob?: Blob | null;
  onChange: (blob: Blob | null) => void;
  maxWidth?: number;
}

export default function ImageUploader({ initialBlob, onChange, maxWidth = 800 }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialBlob) {
      const url = URL.createObjectURL(initialBlob);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [initialBlob]);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              blob => blob ? resolve(blob) : reject(new Error("Blob failed")),
              "image/webp", 0.75
            );
          } else {
            reject(new Error("Canvas ctx null"));
          }
        };
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = async (file: File | Blob) => {
    try {
      const blob = file instanceof File ? await compressImage(file) : file;
      const url = URL.createObjectURL(blob);
      setPreview(url);
      onChange(blob);
      setIsMenuOpen(false);
    } catch {
      alert("Gagal memproses gambar");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const pickFromCamera = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        processFile(blob);
      }
    } catch (e: any) {
      if (e.message !== "User cancelled photos app") {
        console.error(e);
      }
    }
  };

  const pickFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });
      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        processFile(blob);
      }
    } catch (e: any) {
      if (e.message !== "User cancelled photos app") {
        console.error(e);
      }
    }
  };

  const pickFromFileManager = () => {
    fileInputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      
      {preview ? (
        <div className="relative w-full h-52 bg-muted rounded-2xl overflow-hidden">
          <img src={preview} alt="Preview" className="w-full h-full object-contain p-2" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <button
            onClick={handleClear}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-sm text-white text-xs font-medium"
          >
            Ganti Foto
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 touchable transition-all",
            isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:bg-muted/30"
          )}
        >
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-lg", isDragging ? "bg-primary" : "gradient-primary")}
            style={{ boxShadow: "0 4px 16px rgba(80, 70, 230, 0.25)" }}>
            <CameraIcon className="w-7 h-7 text-white" />
          </div>
          <div className="text-center pointer-events-none">
            <p className="text-sm font-semibold text-foreground">Tambah Foto Produk</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isDragging ? "Lepaskan gambar di sini..." : "Tarik & lepas file, atau klik untuk memilih"}
            </p>
          </div>
        </button>
      )}

      {/* Source Selection Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[200]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-card rounded-t-[2.5rem] p-8 z-[201] shadow-2xl border-t border-border/50"
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest text-center mb-8">Pilih Sumber Foto</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={pickFromCamera}
                  className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-active:scale-90 transition-transform">
                    <CameraDevice className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">Kamera</span>
                </button>

                <button
                  onClick={pickFromGallery}
                  className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-active:scale-90 transition-transform">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">Galeri</span>
                </button>

                <button
                  onClick={pickFromFileManager}
                  className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-active:scale-90 transition-transform">
                    <FileSearch className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">File</span>
                </button>
              </div>

              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full mt-8 h-14 rounded-2xl bg-muted/50 text-foreground font-black text-[10px] uppercase tracking-[0.2em] hover:bg-muted transition-colors"
              >
                Batal
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
