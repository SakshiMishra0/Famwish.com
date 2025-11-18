// src/app/auction/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";

interface Auction {
  _id: string;
  title: string;
  bid: string;
  bids: number;
  isWishlisted: boolean;
  titleImage?: string | null;
}

// Interface for Trending/Sidebar items (simpler subset of Auction)
interface SidebarAuction {
    _id: string;
    title: string;
    bid: string;
    bids: number;
    titleImage?: string | null;
}


// Wrapper component for Suspense
export default function AuctionsPageWrapper() {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
      <AuctionsPage />
    </Suspense>
  );
}

// Main page component
function AuctionsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q");

  const [activeCategory, setActiveCategory] = useState("Live");
  const [activeFilter, setActiveFilter] = useState("Popular");

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [trending, setTrending] = useState<SidebarAuction[]>([]); // <--- NEW STATE
  const [recommended, setRecommended] = useState<SidebarAuction[]>([]); // <--- NEW STATE
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = [
    "Live", "Ending Soon", "Most Bid", "Art", "Experiences", 
    "Merchandise", "Charity", "NGOs",
  ];

  const filters = ["Popular", "Highest Bids", "Newest", "Ending Soon", "Recommended"];
  
  // --- NEW: Fetch Trending Auctions (Simulated by filtering logic) ---
  const fetchTrendingAuctions = useCallback(async () => {
      try {
          // In a real application, this API would support a sort by 'bids' or 'recent activity'.
          // For now, we fetch all and sort by bids client-side.
          const res = await fetch("/api/auctions");
          if (!res.ok) throw new Error("Failed to fetch trending data");
          
          const data: Auction[] = await res.json();
          
          // Simulate "Trending" by taking the 3 auctions with the highest number of bids
          const trendingData = data
            .slice() // create copy
            .sort((a, b) => b.bids - a.bids)
            .slice(0, 3)
            .map(a => ({
                _id: a._id,
                title: a.title,
                bid: a.bid,
                bids: a.bids,
                titleImage: a.titleImage,
            }));
            
          setTrending(trendingData);
      } catch (e) {
          console.error("Error fetching trending auctions:", e);
          // Keep the trending list empty on error, no mock fallback
      }
  }, []);
  // -----------------------------------------------------------------

  // --- NEW: Fetch Recommended Auctions (Simulated) ---
  const fetchRecommendedAuctions = useCallback(async () => {
      // In a functional app, this would use the user's history/wishlist to recommend.
      // For now, we'll fetch a list and pick the newest three.
      try {
          const res = await fetch("/api/auctions");
          if (!res.ok) throw new Error("Failed to fetch recommended data");
          
          const data: Auction[] = await res.json();
          
          // Simulate "Recommended" by taking the newest 3 auctions (assuming /api/auctions returns sorted by date DESC)
          const recommendedData = data.slice(0, 3).map(a => ({
                _id: a._id,
                title: a.title,
                bid: a.bid,
                bids: a.bids,
                titleImage: a.titleImage,
          }));
          
          setRecommended(recommendedData);
      } catch (e) {
          console.error("Error fetching recommended auctions:", e);
      }
  }, []);
  // ---------------------------------------------------


  // Main Data Fetching Effect
  useEffect(() => {
    async function getAuctionsAndWishlist() {
      try {
        setLoading(true);

        let apiUrl = "/api/auctions";
        if (searchQuery) {
          apiUrl += `?search=${encodeURIComponent(searchQuery)}`;
        }
        
        const auctionsRes = await fetch(apiUrl);
        if (!auctionsRes.ok) throw new Error("Failed to fetch auctions");
        const auctionData = await auctionsRes.json();

        let userWishlistIds = new Set<string>();

        if (session) {
          const wishlistRes = await fetch("/api/wishlist");
          if (wishlistRes.ok) {
            const wishlistData = await wishlistRes.json();
            userWishlistIds = new Set(wishlistData.map((item: any) => item.auctionId));
          }
        }
        
        setWishlistedIds(userWishlistIds);

        const combinedAuctions = auctionData.map((auction: any) => ({
          ...auction,
          isWishlisted: userWishlistIds.has(auction._id),
        }));

        setAuctions(combinedAuctions);
        
      } catch (err) {
        console.error(err);
        setError("Unable to load auctions at the moment. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    getAuctionsAndWishlist();
    
    // Fetch sidebar data after main data is loaded or in parallel
    fetchTrendingAuctions();
    if (session) {
        fetchRecommendedAuctions();
    } else {
        // Clear recommended if logged out or if functionality doesn't exist
        setRecommended([]);
    }
    
  }, [activeCategory, session, searchQuery, fetchTrendingAuctions, fetchRecommendedAuctions]);

  // (handleWishlistToggle function is unchanged)
  const handleWishlistToggle = useCallback(async (auctionId: string, isCurrentlyWishlisted: boolean) => {
    if (!session) {
        alert("Please log in to update your wishlist.");
        return;
    }

    const newIsWishlisted = !isCurrentlyWishlisted;
    // Optimistic UI update
    setAuctions(prevAuctions => 
      prevAuctions.map(a => 
        a._id === auctionId ? { ...a, isWishlisted: newIsWishlisted } : a
      )
    );
    
    // Update the set for the next toggle
    setWishlistedIds(prevIds => {
      const newIds = new Set(prevIds);
      if (newIsWishlisted) {
        newIds.add(auctionId);
      } else {
        newIds.delete(auctionId);
      }
      return newIds;
    });

    try {
      const res = await fetch("/api/wishlist", {
        method: newIsWishlisted ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId }),
      });
      
      if (!res.ok) {
        throw new Error("API call failed.");
      }
      
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      // Rollback UI on error
      setAuctions(prevAuctions => 
        prevAuctions.map(a => 
          a._id === auctionId ? { ...a, isWishlisted: isCurrentlyWishlisted } : a
        )
      );
      setWishlistedIds(prevIds => {
        const newIds = new Set(prevIds);
        if (isCurrentlyWishlisted) {
          newIds.add(auctionId);
        } else {
          newIds.delete(auctionId);
        }
        return newIds;
      });
      alert(`Error: Failed to ${newIsWishlisted ? 'add to' : 'remove from'} wishlist.`);
    }
  }, [session]);

  return (
    <div className="grid grid-cols-1 gap-10 px-10 py-10 lg:grid-cols-[2fr_0.9fr]">

      <div>
        <SearchBar initialQuery={searchQuery} />

        {/* CATEGORY PILLS */}
        <div className="flex flex-wrap items-center gap-3 mt-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-5 py-1.5 text-sm border transition-all ${
                activeCategory === cat
                  ? "bg-[#E7E1F6] text-[#2F235A] font-semibold border-[#D6CCE8]"
                  : "border-[#E3DDD5] hover:bg-[#F7F4FF]"
              }`}
            >
              {cat === "Live" && <span className="mr-1 text-red-500">🔴</span>}
              {cat}
            </button>
          ))}
        </div>

        {/* Show search result title if a search is active */}
        {searchQuery && (
          <h2 className="text-2xl font-bold mt-8 mb-2 text-[#1E1635]">
            Showing results for: &quot;{searchQuery}&quot;
          </h2>
        )}

        {/* FILTER TABS */}
        <div className="mt-6 flex gap-8 text-sm font-medium">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`pb-1 transition-all ${
                activeFilter === f
                  ? "text-[#2F235A] border-b-2 border-[#2F235A] font-semibold"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* AUCTION GRID */}
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p>Loading auctions...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : auctions.length === 0 ? (
            <p>
              {searchQuery 
                ? `No auctions found for "${searchQuery}".`
                : "No auctions found. Try creating one as a celebrity!"
              }
            </p>
          ) : (
            auctions.map((auction) => (
              <div
                key={auction._id}
                className="rounded-xl border border-[#E8E4DD] bg-white shadow-sm p-0.5 
                hover:-translate-y-1 hover:shadow-lg transition duration-200 group flex flex-col"
              >
                <div className="relative">
                  <Link href={`/auction/${auction._id}`} className="block">
                    <span className="absolute top-3 left-3 rounded-full bg-red-100 px-2 py-[2px] text-[11px] font-semibold text-red-600">
                      LIVE
                    </span>
                    {auction.titleImage ? (
                      <img
                        src={auction.titleImage}
                        alt={auction.title}
                        className="h-36 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-36 w-full rounded-lg bg-gray-200"></div>
                    )}
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWishlistToggle(auction._id, auction.isWishlisted);
                    }}
                    className={`absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-full transition-colors
                                ${auction.isWishlisted ? 'text-red-500' : 'text-gray-400 group-hover:text-red-400'}`}
                  >
                    <Heart
                      size={20}
                      fill={auction.isWishlisted ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <Link href={`/auction/${auction._id}`} className="block flex-1 flex flex-col px-3 py-3">
                  <h3 className="font-bold text-[14px] leading-tight">{auction.title}</h3>
                  <div className="mt-2 flex justify-between text-sm flex-1 items-end">
                    <div>
                      <p className="text-xs text-gray-500">Current Bid</p>
                      <p className="font-bold">{auction.bid}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bids</p>
                      <p className="font-bold">{auction.bids}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sidebar (UPDATED) */}
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-5 shadow border border-[#E5E1DB]">
          <h3 className="flex items-center gap-1 font-bold text-lg">
            🔥 Trending Auctions
          </h3>
          <div className="mt-4 flex flex-col gap-5">
            {trending.length > 0 ? (
                trending.map((item, i) => (
                    <Link href={`/auction/${item._id}`} key={item._id} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
                        <div className="h-12 w-12 rounded-lg bg-gray-200 overflow-hidden">
                            {item.titleImage ? (
                                <img src={item.titleImage} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200"></div>
                            )}
                        </div>
                        <div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500">
                            {item.bid} · {item.bids} bids
                        </p>
                        </div>
                    </Link>
                ))
            ) : (
                <p className="text-sm text-gray-500">No trending auctions available.</p>
            )}
          </div>
        </div>
        
        {session && (
            <div className="rounded-2xl bg-white p-5 shadow border border-[#E5E1DB]">
            <h3 className="font-bold text-lg flex items-center gap-1">
                ⭐ Recommended for you
            </h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">
                Based on your preferences and activity.
            </p>
            <div className="mt-4 flex flex-col gap-5">
            {recommended.length > 0 ? (
                recommended.map((item, i) => (
                    <Link href={`/auction/${item._id}`} key={item._id} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
                        <div className="h-12 w-12 rounded-lg bg-gray-200 overflow-hidden">
                            {item.titleImage ? (
                                <img src={item.titleImage} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200"></div>
                            )}
                        </div>
                        <div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500">
                            {item.bid} · {item.bids} bids
                        </p>
                        </div>
                    </Link>
                ))
            ) : (
                <p className="text-sm text-gray-500">No recommendations right now.</p>
            )}
          </div>
        </div>
        )}
        
        <div className="rounded-2xl bg-white p-5 shadow border border-[#E5E1DB]">
          <h3 className="font-bold text-lg flex items-center gap-1">
            ⏰ Recently Viewed
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            (Client-side feature, not implemented yet)
          </p>
        </div>
      </div>
    </div>
  );
}