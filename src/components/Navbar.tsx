// src/components/Navbar.tsx
"use client";

import Link from "next/link";
// We no longer need the modals
// import SignupModal from "@/components/SignupModal";
// import LoginModal from "@/components/LoginModal";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Bell, Heart } from "lucide-react"; 

export default function Navbar() {
  // We no longer need modal state
  // const [showSignup, setShowSignup] = useState(false);
  // const [showLogin, setShowLogin] = useState(false);

  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const [notificationCount, setNotificationCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      const fetchCounts = async () => {
        try {
          const [notifRes, wishRes] = await Promise.all([
            fetch('/api/notifications/count'),
            fetch('/api/wishlist/count')
          ]);

          if (notifRes.ok) {
            const data = await notifRes.json();
            setNotificationCount(data.count);
          }
          
          if (wishRes.ok) {
            const data = await wishRes.json();
            setWishlistCount(data.count);
          }
        } catch (error) {
          console.error("Failed to fetch counts:", error);
        }
      };
      
      fetchCounts();
    } else if (status === "unauthenticated") {
      setNotificationCount(0);
      setWishlistCount(0);
    }
  }, [status]); 

  return (
    <header className="w-full border-b border-[#E6E3DD] bg-[#F6F3EC]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-extrabold text-2xl tracking-tight">
          famwish
        </Link>

        <div className="hidden gap-8 text-sm font-medium md:flex">
          <Link href="/" className="hover:text-[#4B3F72]">Home</Link>
          <Link href="/auctions" className="hover:text-[#4B3F72]">Auctions</Link>
          <Link href="/leaderboard" className="hover:text-[#4B3F72]">Leaderboard</Link>
          <Link href="/ngos" className="hover:text-[#4B3F72]">NGOs</Link>
          {session && (
             <Link href="/profile/me" className="hover:text-[#4B3F72]">Profile</Link>
          )}
        </div>

        <div className="flex items-center gap-4"> 
          {isLoading ? (
            <div className="text-sm">Loading...</div>
          ) : session ? (
            // User is logged in
            <>
              <Link href="/wishlist" className="relative text-gray-600 hover:text-black" title="Wishlist">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-xs text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link href="/notifications" className="relative text-gray-600 hover:text-black" title="Notifications">
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {notificationCount}
                  </span>
                )}
              </Link>

              <span className="text-sm self-center">
                Hi, {session.user?.name}
              </span>
              <button
                className="rounded-full border px-4 py-1.5 text-sm hover:bg-white"
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </>
          ) : (
            // User is logged out
            <>
              {/* --- UPDATED BUTTONS TO LINKS --- */}
              <Link
                href="/auth"
                className="rounded-full border px-4 py-1.5 text-sm hover:bg-white"
              >
                Log in
              </Link>
              <Link
                href="/auth?tab=signup" // <-- Links to auth page, signup tab
                className="rounded-full bg-[#2F235A] px-4 py-1.5 text-sm text-white hover:bg-[#463985]"
              >
                Sign up
              </Link>
              {/* ---------------------------------- */}
            </>
          )}
        </div>
      </nav>

      {/* --- MODALS ARE NOW REMOVED --- */}
      {/* <SignupModal open={showSignup} onClose={() => setShowSignup(false)} /> */}
      {/* <LoginModal open={showLogin} onClose={() => setShowLogin(false)} /> */}
    </header>
  );
}