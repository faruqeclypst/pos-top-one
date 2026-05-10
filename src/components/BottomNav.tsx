"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Package, BarChart3, Settings2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { useStoreProfile } from "@/hooks/useStoreProfile";
import { getTerminology } from "@/lib/terminology";

export default function BottomNav() {
  const pathname = usePathname();
  const { profile } = useStoreProfile();
  const terms = getTerminology(profile?.businessType);

  const navItems = [
    { name: "Beranda", href: "/", icon: Home },
    { name: "Kasir", href: "/pos", icon: ShoppingCart },
    { name: terms.products, href: "/products", icon: Package },
    { name: "Laporan", href: "/reports", icon: BarChart3 },
    { name: "Pengaturan", href: "/settings", icon: Settings2 },
  ];

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
                <div className="absolute inset-x-1 inset-y-1 bg-primary/10 rounded-[1.5rem] animate-in fade-in duration-200" />
              )}
              
              <div className="relative flex flex-col items-center h-full justify-center gap-1">
                <item.icon className={cn(
                  "transition-all duration-300", 
                  isActive ? "w-6 h-6 stroke-[2.5]" : "w-5.5 h-5.5 stroke-[1.5]"
                )} />
                
                <span className={cn(
                  "text-[9px] transition-all duration-300 tracking-wide whitespace-nowrap",
                  isActive ? "font-bold text-primary" : "font-medium text-muted-foreground"
                )}>
                  {item.name}
                </span>
              </div>


            </Link>
          );
        })}
      </nav>
    </div>
  );
}
