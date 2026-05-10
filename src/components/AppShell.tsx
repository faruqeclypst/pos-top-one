"use client";

import { useStoreProfile } from "@/hooks/useStoreProfile";
import { useEffect, useState } from "react";
import Onboarding from "./Onboarding";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { Home, ShoppingCart, Package, BarChart3, Settings2 } from "lucide-react";
import { getTerminology } from "@/lib/terminology";

// Premium app-level skeleton
function AppSkeleton() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center" style={{ background: "hsl(240, 5%, 98%)" }}>
      <div className="flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-3xl overflow-hidden animate-pulse">
          <img src="/logo-default.png" alt="Loading..." className="w-full h-full object-contain block dark:hidden" />
          <img src="/logo-dark.png" alt="Loading..." className="w-full h-full object-contain hidden dark:block" />
        </div>
        <div className="space-y-2 flex flex-col items-center">
          <div className="w-36 h-2 rounded-full bg-primary/20" />
          <div className="w-24 h-2 rounded-full bg-primary/10" />
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useStoreProfile();
  const [mounted, setMounted] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [syncAttempted, setSyncAttempted] = useState(false);
  const pathname = usePathname();
  const isPOS = pathname === "/pos";

  useEffect(() => {
    setMounted(true);
    // Timeout fallback - if still loading after 3 seconds, assume ready
    const timer = setTimeout(() => setIsTimeout(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-sync on load - only once after onboarding
  useEffect(() => {
    if (!mounted || isLoading || !profile?.isOnboarded) return;
    
    // Only attempt sync once
    if (!syncAttempted && profile?.isGoogleConnected && profile?.spreadsheetId) {
      const runAutoSync = async () => {
        try {
          const { initGoogleApi, loginGoogle, syncAllToCloud } = await import("@/lib/google-sheets");
          await initGoogleApi();
          await loginGoogle(true); // Attempt silent login to warm up the session
          await syncAllToCloud(profile.spreadsheetId!);
          console.log("Initial background sync completed");
        } catch (e) {
          console.warn("Background auto-sync skipped (not authenticated or no connection)");
        } finally {
          setSyncAttempted(true);
        }
      };
      runAutoSync();
    }
  }, [profile?.isGoogleConnected, profile?.spreadsheetId, profile?.isOnboarded, mounted, isLoading, syncAttempted]);

  if (!mounted || (isLoading && !isTimeout)) {
    return <AppSkeleton />;
  }

  if (!profile?.isOnboarded) {
    return <Onboarding />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-20 flex-shrink-0 flex-col items-center py-4 bg-background border-r border-border/50">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl overflow-hidden mb-6">
          <img src="/logo-default.png" alt="TokoKu" className="w-full h-full object-contain" />
        </div>
        
        {/* Nav Items */}
        <nav className="flex-1 flex flex-col items-center gap-2">
          {[
            { name: "Beranda", href: "/", icon: Home },
            { name: "Kasir", href: "/pos", icon: ShoppingCart },
            { name: getTerminology(profile?.businessType).products, href: "/products", icon: Package },
            { name: "Laporan", href: "/reports", icon: BarChart3 },
            { name: "Pengaturan", href: "/settings", icon: Settings2 },
          ].map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 relative",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Store Info */}
        <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
          <span className="text-xs font-bold text-muted-foreground">
            {profile?.name?.charAt(0) || "T"}
          </span>
        </div>
      </aside>

      {/* Main Content Area - Desktop */}
      <main className="hidden lg:flex flex-1 flex-col min-w-0 overflow-hidden bg-background">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex-1 overflow-y-auto"
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col w-full h-full">
        <main className="flex-1 overflow-y-auto pb-24">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] pointer-events-none">
          <nav 
            className="max-w-[500px] mx-auto h-[4.5rem] bg-background/80 backdrop-blur-3xl border border-white/20 rounded-[2.25rem] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] flex items-center justify-around px-3 pointer-events-auto"
            style={{ WebkitBackdropFilter: "blur(30px) saturate(200%)" }}
          >
            {[
              { name: "Beranda", href: "/", icon: Home },
              { name: "Kasir", href: "/pos", icon: ShoppingCart },
              { name: getTerminology(profile?.businessType).products, href: "/products", icon: Package },
              { name: "Laporan", href: "/reports", icon: BarChart3 },
              { name: "Pengaturan", href: "/settings", icon: Settings2 },
            ].map((item) => {
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
      </div>
    </div>
  );
}
