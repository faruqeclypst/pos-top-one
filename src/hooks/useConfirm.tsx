"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

interface ConfirmOptions {
  title: string;
  message: string;
  type?: "info" | "danger" | "warning";
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ConfirmOptions & { isOpen: boolean; resolve: (value: boolean) => void } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...options,
        isOpen: true,
        resolve,
      });
    });
  }, []);

  const handleCancel = () => {
    if (config) {
      config.resolve(false);
      setConfig(null);
    }
  };

  const handleConfirm = () => {
    if (config) {
      config.resolve(true);
      setConfig(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {config && (
        <ConfirmDialog
          isOpen={config.isOpen}
          title={config.title}
          message={config.message}
          type={config.type}
          confirmText={config.confirmText}
          cancelText={config.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}
