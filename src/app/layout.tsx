import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
      <body className="min-h-screen bg-[#F6F3EC] text-[#1E1635]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
