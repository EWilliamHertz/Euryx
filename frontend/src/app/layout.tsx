import type { Metadata } from "next";
import "./globals.css";
import { HaloNav } from "@/components/HaloNav";

export const metadata: Metadata = {
  title: "Euryx · Digital Pokémon TCG",
  description: "Euryx — the hyper-competitive digital Pokémon TCG. A sister-application of Hatake.Social.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-slate-200 antialiased noise min-h-screen" data-testid="app-root">
        <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
        <HaloNav />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
