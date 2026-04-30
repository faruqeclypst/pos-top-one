"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";
export type AccentColor = "violet" | "blue" | "emerald" | "rose" | "amber";

const ACCENTS: Record<AccentColor, { h: number; s: number; l: number; gh: number }> = {
  violet: { h: 250, s: 85, l: 55, gh: 270 },
  blue: { h: 215, s: 85, l: 55, gh: 195 },
  emerald: { h: 155, s: 85, l: 45, gh: 175 },
  rose: { h: 345, s: 85, l: 55, gh: 325 },
  amber: { h: 38, s: 95, l: 55, gh: 25 },
};

type ThemeProviderState = {
  theme: Theme;
  accent: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: AccentColor) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  accent: "violet",
  setTheme: () => null,
  setAccent: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  accentKey = "ui-accent",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  accentKey?: string;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [accent, setAccent] = useState<AccentColor>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(accentKey) as AccentColor) || "violet";
    }
    return "violet";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const effectiveTheme = theme === "system" 
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;

    root.classList.add(effectiveTheme);

    // Apply Accent Colors
    const config = ACCENTS[accent];
    const lValue = effectiveTheme === "dark" ? config.l + 10 : config.l;
    
    root.style.setProperty("--primary", `hsl(${config.h}, ${config.s}%, ${lValue}%)`);
    root.style.setProperty("--primary-gradient", `hsl(${config.gh}, ${config.s}%, ${lValue - 5}%)`);
    root.style.setProperty("--ring", `hsl(${config.h}, ${config.s}%, ${lValue}%)`);
  }, [theme, accent]);

  const value = {
    theme,
    accent,
    setTheme: (t: Theme) => {
      localStorage.setItem(storageKey, t);
      setTheme(t);
    },
    setAccent: (a: AccentColor) => {
      localStorage.setItem(accentKey, a);
      setAccent(a);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
