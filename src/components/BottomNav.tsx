"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Package, BarChart3, Settings2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Beranda", href: "/", icon: Home },
  { name: "Kasir", href: "/pos", icon: ShoppingCart },
  { name: "Barang", href: "/products", icon: Package },
  { name: "Pemasok", href: "/suppliers", icon: Building2 },
  { name: "Laporan", href: "/reports", icon: BarChart3 },
  { name: "Pengaturan", href: "/settings", icon: Settings2 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[100] pb-safe border-t border-border/40 bg-background/80 backdrop-blur-xl"
      style={{ WebkitBackdropFilter: "blur(24px)" }}
    >
      <div className="flex h-20 max-w-lg mx-auto justify-around items-center px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1.5 transition-all duration-300 relative group",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute top-2 w-8 h-1 rounded-full bg-primary animate-in fade-in zoom-in duration-300" />
              )}
              <div className={cn(
                "flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-300",
                isActive ? "bg-primary/10" : "group-hover:bg-muted/50"
              )}>
                <item.icon className={cn("transition-all duration-300", isActive ? "w-5.5 h-5.5 stroke-[2.5]" : "w-5.5 h-5.5 stroke-[1.5]")} />
              </div>
              <span className={cn(
                "text-[0.5625rem] uppercase tracking-widest font-black transition-all duration-300",
                isActive ? "opacity-100 scale-100" : "opacity-60 scale-95"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
