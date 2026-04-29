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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] pb-safe" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(0,0,0,0.1)" }}>
      <div className="flex h-16 max-w-md mx-auto sm:max-w-xl md:max-w-4xl justify-around items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200",
                isActive ? "bg-primary/12" : ""
              )}>
                <item.icon className={cn("transition-all duration-200", isActive ? "w-5 h-5 stroke-[2.5]" : "w-5 h-5 stroke-[1.75]")} />
              </div>
              <span className={cn("text-[10px] font-medium transition-all duration-200", isActive ? "font-semibold" : "")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
