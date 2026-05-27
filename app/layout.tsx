import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudentHub | European Era",
  description: "European Era mobility support platform",
  manifest: "/manifest.webmanifest",
  applicationName: "StudentHub",
  appleWebApp: {
    capable: true,
    title: "StudentHub",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#32409c"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-era-paper text-era-ink antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
