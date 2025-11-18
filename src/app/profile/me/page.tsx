// src/app/profile/me/page.tsx
"use client";

import { useState, useEffect } from "react"; 
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; 
import UserAvatar from "@/components/UserAvatar";
import Link from "next/link"; 
import { TrendingUp, DollarSign, Hand, Clock } from "lucide-react"; 

// --- NEW Interface for Activity (Unchanged) ---
interface UserActivity {
    type: "bid";
    auctionId: string;
    auctionTitle: string;
    bidAmount: number;
    timestamp: string;
    isHighBid: boolean;
}
// ----------------------------

// --- Interface for Stats (Modified to correctly reflect all three stats) ---
interface UserStats {
    totalRaised: number;
    wishesFulfilled: number;
    ngosSupported: number; 
}
// ----------------------------

// --- Auction Interface (Unchanged) ---
interface Auction {
    _id: string;
    title: string;
    bid: string;
    bids: number;
    endDate: string;
    titleImage?: string | null;
}
// ----------------------------------------

// Helper to format INR (Unchanged)
const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Helper to format time ago (Unchanged)
const formatTimeAgo = (isoString: string): string => {
    const now = new Date();
    const past = new Date(isoString);
    const diffSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffSeconds < 60) return "just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
};


// --- Helper Component: Auction List (Unchanged, copied for completeness) ---
function CelebrityAuctionsList({ userId }: { userId: string }) {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchAuctions() {
            try {
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
// --- END Helper Component ---


// --- Component to list the bidder's recent activity (Unchanged, copied for completeness) ---
function BidderActivityList() {
    const [activity, setActivity] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchActivity() {
            try {
                const res = await fetch(`/api/profile/activity`);
                if (!res.ok) {
                    throw new Error("Failed to fetch user activity.");
                }
                const data: UserActivity[] = await res.json();
                setActivity(data);
            } catch (e: any) {
                console.error("Fetch activity error:", e);
                setError(e.message || "Failed to load recent activity.");
            } finally {
                setLoading(false);
            }
        }
        fetchActivity();
    }, []);

    if (loading) {
        return <div className="p-4 text-center text-gray-500">Loading recent bids...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">Error loading activity: {error}</div>;
    }
    
    return (
        <>
            <h2 className="text-xl font-bold mb-4 text-[#22163F]">Your Recent Bids</h2>
            <div className="space-y-4">
                {activity.length === 0 ? (
                    <p className="p-4 text-gray-600 border rounded-xl bg-gray-50">You haven't placed any bids yet.</p>
                ) : (
                    activity.map((item) => (
                        <Link 
                            href={`/auction/${item.auctionId}`} 
                            key={item.auctionId + item.timestamp} 
                            className="flex items-center gap-4 rounded-xl p-3 bg-white border shadow-sm hover:shadow-md transition"
                        >
                            <div 
                                className={`h-12 w-12 flex-shrink-0 rounded-lg flex items-center justify-center ${item.isHighBid ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                            >
                                <Hand size={20} />
                            </div>
                            
                            <div className="flex-grow">
                                <h3 className="font-semibold text-base truncate">Bid on: {item.auctionTitle}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    <DollarSign size={12} className="inline mr-1 text-green-500" /> {formatINR(item.bidAmount)} 
                                </p>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <span 
                                    className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${item.isHighBid ? 'text-red-600 bg-red-100 border-red-200' : 'text-gray-600 bg-gray-100 border-gray-200'}`}
                                >
                                    {item.isHighBid ? 'HIGH BID' : 'OUTBID'}
                                </span>
                                <p className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
                                    <Clock size={10} className="inline mr-1" /> {formatTimeAgo(item.timestamp)}
                                </p>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </>
    );
}


export default function MyProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter(); 
  
  // MODIFIED: State to initialize all three stats
  const [userStats, setUserStats] = useState<UserStats>({
      totalRaised: 0,
      wishesFulfilled: 0,
      ngosSupported: 0,
  });

  // --- Fetch stats and handle redirection (Modified to fetch ngosSupported) ---
  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    
    async function fetchUserStats() {
        const res = await fetch("/api/profile/stats");
        if (res.ok) {
            const data = await res.json();
            // Update all three stats based on the response
            setUserStats({
                totalRaised: data.totalRaised || 0,
                wishesFulfilled: data.wishesFulfilled || 0,
                ngosSupported: data.ngosSupported || 0, // <-- NEW STAT
            });
        } else {
            console.error("Failed to fetch user stats.");
        }
    }
    
    fetchUserStats();
  }, [status, router]);
  // ----------------------------------------

  // Handle loading and unauthenticated states gracefully
  if (status === "loading" || status === "unauthenticated") {
    return <div className="text-center py-20">Loading...</div>;
  }
  
  const user = session?.user as { 
    id: string; 
    name: string; 
    role: string; 
    email: string 
  };

  if (!user) {
    return <div className="text-center py-20">Loading...</div>;
  }

  const isCelebrity = user.role === 'celebrity';

  return (
    <>
      <div className="pt-10 grid gap-8 md:grid-cols-[1.1fr_1.4fr]">
        
        {/* LEFT PANEL */}
        <div>
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#E8E3DB]">
            
            <UserAvatar size="large" /> 
            
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

            {/* Stats - NOW ALL REAL DATA */}
            <div className="grid grid-cols-3 gap-3 mt-5 text-center text-sm">
              <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
                <p className="font-bold">{formatINR(userStats.totalRaised)}</p>
                <p className="text-xs text-gray-600">Total raised</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
                <p className="font-bold">{userStats.wishesFulfilled}</p>
                <p className="text-xs text-gray-600">Wishes fulfilled</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
                {/* DISPLAY THE NEW REAL STAT */}
                <p className="font-bold">{userStats.ngosSupported}</p> 
                <p className="text-xs text-gray-600">NGOs supported</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100">
                Edit Profile
              </button>
              
              {isCelebrity && (
                <Link 
                  href="/auction/create" 
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
                <BidderActivityList /> 
            )}

          </div>
        </div>
      </div>
    </>
  );
}