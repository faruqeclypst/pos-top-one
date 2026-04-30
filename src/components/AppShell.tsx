"use client";

import { useStoreProfile } from "@/hooks/useStoreProfile";
import { useEffect, useState } from "react";
import Onboarding from "./Onboarding";
import BottomNav from "./BottomNav";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();
  const isPOS = pathname === "/pos";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return <AppSkeleton />;
  }

  if (!profile?.isOnboarded) {
    return <Onboarding />;
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      <main className={cn("flex-1 overflow-y-auto scroll-area w-full", !isPOS && "pb-24")}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
