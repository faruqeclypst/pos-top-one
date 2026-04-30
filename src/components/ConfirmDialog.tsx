"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, AlertTriangle, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "info" | "danger" | "warning";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  type = "info",
  confirmText = "Lanjutkan",
  cancelText = "Batal",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const iconMap = {
    info: (
      <>
        <img src="/logo-default.png" alt="Info" className="w-8 h-8 object-contain block dark:hidden" />
        <img src="/logo-dark.png" alt="Info" className="w-8 h-8 object-contain hidden dark:block" />
      </>
    ),
    danger: <AlertTriangle className="w-8 h-8" />,
    warning: <HelpCircle className="w-8 h-8" />,
  };

  const colorMap = {
    info: "bg-primary/10 text-primary",
    danger: "bg-rose-500/10 text-rose-500",
    warning: "bg-amber-500/10 text-amber-500",
  };

  const btnMap = {
    info: "text-primary hover:bg-primary/5",
    danger: "text-rose-500 hover:bg-rose-500/5",
    warning: "text-amber-500 hover:bg-amber-500/5",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative bg-background w-full max-w-[340px] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-border/50"
          >
            <div className="p-8 text-center">
              <div className={cn(
                "w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-5 shadow-inner",
                colorMap[type]
              )}>
                {iconMap[type]}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed px-2">
                {message}
              </p>
            </div>

            <div className="flex border-t border-border/50">
              <button
                onClick={onCancel}
                className="flex-1 h-16 text-sm font-bold text-muted-foreground hover:bg-muted/30 transition-colors border-r border-border/50 active:bg-muted/50"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={cn(
                  "flex-1 h-16 text-sm font-bold transition-colors active:bg-black/5",
                  btnMap[type]
                )}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
