// src/app/profile/me/page.tsx
"use client";

import { useState, useEffect } from "react"; 
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; 
import UserAvatar from "@/components/UserAvatar";
import Link from "next/link"; 
import { TrendingUp, DollarSign } from "lucide-react"; 

// --- NEW Auction Interface ---
interface Auction {
    _id: string;
    title: string;
    bid: string;
    bids: number;
    endDate: string;
    titleImage?: string | null;
}
// --- END NEW Auction Interface ---

// --- NEW Helper Component: Auction List ---
function CelebrityAuctionsList({ userId }: { userId: string }) {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchAuctions() {
            try {
                // Fetch auctions created by the current user using the updated API
                const res = await fetch(`/api/auctions?createdBy=${userId}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch auctions");
                }
                const data: Auction[] = await res.json();
                setAuctions(data);
            } catch (e: any) {
                console.error("Fetch auctions error:", e);
                setError(e.message || "Failed to load auctions.");
            } finally {
                setLoading(false);
            }
        }
        fetchAuctions();
    }, [userId]);

    if (loading) {
        return <div className="p-4 text-center text-gray-500">Loading auctions...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">Error loading auctions: {error}</div>;
    }
    
    // Helper to determine status
    const getStatus = (endDate: string) => {
        const now = new Date();
        const end = new Date(endDate);
        if (end > now) return { label: "LIVE", color: "text-red-600 bg-red-100 border-red-200" };
        return { label: "ENDED", color: "text-gray-600 bg-gray-100 border-gray-200" };
    };

    return (
        <>
            <h2 className="text-xl font-bold mb-4 text-[#22163F]">Your Active & Past Auctions</h2>
            <div className="space-y-4">
                {auctions.length === 0 ? (
                    <p className="p-4 text-gray-600 border rounded-xl bg-gray-50">You have not created any auctions yet.</p>
                ) : (
                    auctions.map((auction) => {
                        const status = getStatus(auction.endDate);
                        return (
                            <Link 
                                href={`/auction/${auction._id}`} 
                                key={auction._id} 
                                className="flex items-center gap-4 rounded-xl p-3 bg-white border shadow-sm hover:shadow-md transition"
                            >
                                {/* Auction Image */}
                                <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden">
                                    {auction.titleImage ? (
                                        <img src={auction.titleImage} alt={auction.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                            Item
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-grow">
                                    <h3 className="font-semibold text-base truncate">{auction.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        <TrendingUp size={12} className="inline mr-1 text-blue-500" /> {auction.bids} Bids 
                                        <DollarSign size={12} className="inline ml-3 mr-1 text-green-500" /> Current Bid: {auction.bid}
                                    </p>
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <span 
                                        className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${status.color}`}
                                    >
                                        {status.label}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
                                        Ends: {new Date(auction.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </>
    );
}
// --- END NEW Helper Component ---

export default function MyProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter(); 

  // --- 4. Handle redirection in a useEffect ---
  useEffect(() => {
    // If not authenticated (and not loading), redirect to home
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);
  // ----------------------------------------

  // 5. Handle loading and unauthenticated states gracefully
  // While redirecting or loading, show a loading message
  if (status === "loading" || status === "unauthenticated") {
    return <div className="text-center py-20">Loading...</div>;
  }
  
  // We are sure the user is authenticated here
  const user = session?.user as { 
    id: string; // <--- Ensure ID is available
    name: string; 
    role: string; 
    email: string 
  };

  // This should not be hit, but it's safe to keep
  if (!user) {
    return <div className="text-center py-20">Loading...</div>;
  }

  // 6. Check if the user is a celebrity
  const isCelebrity = user.role === 'celebrity';

  return (
    <>
      {/* The Modal has been replaced by a full-page link */}

      <div className="pt-10 grid gap-8 md:grid-cols-[1.1fr_1.4fr]">
        
        {/* LEFT PANEL */}
        <div>
          {/* Profile Card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#E8E3DB]">
            
            {/* --- UPDATED AVATAR DISPLAY --- */}
            <UserAvatar size="large" /> 
            {/* ---------------------------- */}

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
              {user.name}
              {isCelebrity && (
                <span className="text-sm text-yellow-600 font-semibold"> • VIP</span>
              )}
            </h1>

            <p className="text-sm text-gray-500">{user.email}</p>

            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              This is your personal profile page. You can update your bio here.
            </p>

            {/* Stats (we can wire these up later) */}
            <div className="grid grid-cols-3 gap-3 mt-5 text-center text-sm">
              <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
                <p className="font-bold">₹0</p>
                <p className="text-xs text-gray-600">Total raised</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
                <p className="font-bold">0</p>
                <p className="text-xs text-gray-600">Wishes fulfilled</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
                <p className="font-bold">0</p>
                <p className="text-xs text-gray-600">NGOs supported</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100">
                Edit Profile
              </button>
              
              {isCelebrity && (
                // FIX: Replaced button with a Link to the new create page
                <Link 
                  href="/auction/create" // <-- NEW LINK
                  className="rounded-xl bg-[#F4C15D] px-4 py-2 text-sm font-semibold text-[#1E1635] hover:bg-[#e4b24e]"
                >
                  + Create Auction
                </Link>
              )}
              
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (Your activity) */}
        <div>
          <div className="rounded-2xl bg-white px-8 py-7 shadow-sm border border-[#E8E3DB]">
            
            {isCelebrity ? (
                 <CelebrityAuctionsList userId={user.id} /> 
            ) : (
                <> {/* <--- WRAPPED: Added a JSX fragment to fix the syntax error */}
                    <h2 className="text-xl font-bold">Your Activity</h2>
                    <p className="mt-3 text-sm text-gray-600">
                        Your recent bids and followed celebrities will appear here.
                    </p>
                </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}