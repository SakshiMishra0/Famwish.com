// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "./providers"; // <-- 1. Import the provider we just made

export const metadata: Metadata = {
  title: "Famwish",
  description: "Make wishes come true through meaningful auctions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* 1. Added 'flex flex-col' to the body */}
      <body className="min-h-screen bg-[#F6F3EC] text-[#1E1635] flex flex-col">
        <Providers> 
          <Navbar />
          {/* 2. Added 'flex-1' to main to make it fill empty space */}
          <main className="mx-auto max-w-7xl px-6 py-6 flex-1 w-full">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}