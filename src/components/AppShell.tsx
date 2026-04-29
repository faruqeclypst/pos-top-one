"use client";

import { useStoreProfile } from "@/hooks/useStoreProfile";
import { useEffect, useState } from "react";
import Onboarding from "./Onboarding";
import BottomNav from "./BottomNav";

// Premium app-level skeleton
function AppSkeleton() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center" style={{ background: "hsl(240, 5%, 98%)" }}>
      <div className="flex flex-col items-center gap-4">
        {/* App icon placeholder */}
        <div className="w-20 h-20 rounded-3xl shimmer" />
        <div className="space-y-2 flex flex-col items-center">
          <div className="w-36 h-4 rounded-full shimmer" />
          <div className="w-24 h-3 rounded-full shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useStoreProfile();
  const [mounted, setMounted] = useState(false);

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
      <main className="flex-1 overflow-y-auto scroll-area w-full pb-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
