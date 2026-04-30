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
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] pointer-events-none">
      <nav 
        className="max-w-[500px] mx-auto h-[4.5rem] bg-background/80 backdrop-blur-3xl border border-white/20 rounded-[2.25rem] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] flex items-center justify-around px-3 pointer-events-auto"
        style={{ WebkitBackdropFilter: "blur(30px) saturate(200%)" }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-14 transition-all duration-500 relative group",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute inset-x-1 inset-y-1 bg-primary/10 rounded-[1.5rem] animate-in fade-in zoom-in-95 duration-500" />
              )}
              
              <div className="relative flex flex-col items-center h-full justify-center -gap-0.5">
                <item.icon className={cn(
                  "transition-all duration-300", 
                  isActive ? "w-5.5 h-5.5 stroke-[2.5] translate-y-0.5" : "w-5.5 h-5.5 stroke-[1.5]"
                )} />
                
                <div className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isActive ? "grid-rows-[1fr] opacity-100 mt-0.5" : "grid-rows-[0fr] opacity-0 mt-0"
                )}>
                  <span className="text-[8px] font-medium overflow-hidden whitespace-nowrap">
                    {item.name}
                  </span>
                </div>
              </div>


            </Link>
          );
        })}
      </nav>
    </div>
  );
}
