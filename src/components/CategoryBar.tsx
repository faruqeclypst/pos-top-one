"use client";

import { useLiveQuery } from "dexie-react-hooks";
import db from "@/lib/db";
import { cn } from "@/lib/utils";

interface CategoryBarProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
  className?: string;
}

export default function CategoryBar({ selectedCategory, onSelect, className }: CategoryBarProps) {
  const categories = useLiveQuery(() => db.categories.toArray());

  return (
    <div className={cn("flex gap-2 overflow-x-auto hide-scrollbar pb-1", className)}>
      <button
        onClick={() => onSelect("Semua")}
        className={cn(
          "px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border-none",
          selectedCategory === "Semua" 
            ? "gradient-primary text-white" 
            : "bg-muted/40 text-muted-foreground hover:bg-muted"
        )}
      >
        Semua
      </button>
      {categories?.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.name)}
          className={cn(
            "px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border-none",
            selectedCategory === cat.name 
              ? "gradient-primary text-white" 
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
