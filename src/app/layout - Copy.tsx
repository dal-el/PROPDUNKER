import '../styles/premium.css'
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PROPDUNKER — Game Page",
  description: "BetLines feed (1 row = 1 bet).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
