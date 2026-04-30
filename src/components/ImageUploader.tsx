"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, X } from "lucide-react";

interface ImageUploaderProps {
  initialBlob?: Blob | null;
  onChange: (blob: Blob | null) => void;
  maxWidth?: number;
}

export default function ImageUploader({ initialBlob, onChange, maxWidth = 800 }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
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
    try {
      const blob = await compressImage(file);
      const url = URL.createObjectURL(blob);
      setPreview(url);
      onChange(blob);
    } catch {
      alert("Gagal memproses gambar");
    }
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
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-sm text-white text-xs font-medium"
          >
            Ganti Foto
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 touchable hover:bg-muted/30 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center"
            style={{ boxShadow: "0 4px 16px rgba(80, 70, 230, 0.25)" }}>
            <Camera className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Tambah Foto Produk</p>
            <p className="text-xs text-muted-foreground mt-1">Ketuk untuk ambil foto atau pilih dari galeri</p>
          </div>
        </button>
      )}
    </div>
  );
}
