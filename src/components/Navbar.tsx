"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full border-b border-[#E6E3DD] bg-[#F6F3EC]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link href="/" className="font-extrabold text-2xl tracking-tight">
          famwish
        </Link>

        {/* Links */}
        <div className="hidden gap-8 text-sm font-medium md:flex">
          <Link href="/" className="hover:text-[#4B3F72]">Home</Link>
          <Link href="/auctions" className="hover:text-[#4B3F72]">Auctions</Link>
          <Link href="/leaderboard" className="hover:text-[#4B3F72]">Leaderboard</Link>
          <Link href="/ngos" className="hover:text-[#4B3F72]">NGOs</Link>
          <Link href="/about" className="hover:text-[#4B3F72]">ABOUT</Link>
          <span className="text-[#E74C3C]">♥</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button className="rounded-full border px-4 py-1.5 text-sm hover:bg-white">
            Log in
          </button>

          <button className="rounded-full bg-[#2F235A] px-4 py-1.5 text-sm text-white hover:bg-[#463985]">
            Sign up
          </button>
        </div>
      </nav>
    </header>
  );
}
