"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  actions?: ReactNode;
  className?: string;
  sticky?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  actions,
  className,
  sticky = true,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "z-[40] w-full transition-all duration-300",
        sticky ? "sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/50" : "bg-transparent",
        className
      )}
    >
      <div className="flex items-center justify-between max-w-[1600px] mx-auto w-full px-5 py-4">
        <div className="flex items-center gap-3">
          {leftAction}
          <div>
            {subtitle && (
              <p className="text-[0.625rem] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-0.5">
                {subtitle}
              </p>
            )}
            <h1 className="text-xl font-black tracking-tight text-foreground">
              {title}
            </h1>
          </div>
        </div>

        {(rightAction || actions) && (
          <div className="flex items-center gap-2">
            {rightAction}
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
