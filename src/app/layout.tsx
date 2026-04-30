import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import AppShell from "@/components/AppShell";
import { ConfirmProvider } from "@/hooks/useConfirm";

import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TokoKu POS",
  description: "Point of Sale modern untuk UMKM Indonesia",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TokoKu POS",
  },
  icons: {
    icon: [
      { url: "/logo-default.png" },
      { url: "/logo-default.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/logo-default.png",
    apple: "/logo-default.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0e1c" },
  ],
};

import { FontSizeProvider } from "@/components/FontSizeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={inter.variable}
    >
      <body>
        <ThemeProvider defaultTheme="light">
          <FontSizeProvider>
            <ConfirmProvider>
              <AppShell>{children}</AppShell>
            </ConfirmProvider>
          </FontSizeProvider>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
