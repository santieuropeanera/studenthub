import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudentHub | European Era",
  description: "Operational dashboard for Erasmus+ students, teachers, and admins in Málaga."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-era-paper text-era-ink antialiased">{children}</body>
    </html>
  );
}
