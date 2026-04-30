"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type FontSize = "s" | "m" | "l" | "xl";

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("m");

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem("app-font-size") as FontSize;
    if (saved && ["s", "m", "l", "xl"].includes(saved)) {
      setFontSizeState(saved);
      applyFontSize(saved);
    }
  }, []);

  const applyFontSize = (size: FontSize) => {
    const html = document.documentElement;
    html.classList.remove("font-s", "font-m", "font-l", "font-xl");
    html.classList.add(`font-${size}`);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem("app-font-size", size);
    applyFontSize(size);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error("useFontSize must be used within a FontSizeProvider");
  }
  return context;
}
