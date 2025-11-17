// src/app/auction/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Heart } from "lucide-react"; // 1. Import the Heart icon
import { useSession } from "next-auth/react"; // 2. Import useSession to check login status

interface Auction {
  _id: string;
  title: string;
  bid: string;
  bids: number;
  isWishlisted: boolean; // 3. Add wishlisted state
}

export default function AuctionsPage() {
  const { data: session } = useSession(); // Get session status
  const [activeCategory, setActiveCategory] = useState("Live");
  const [activeFilter, setActiveFilter] = useState("Popular");

  const [auctions, setAuctions] = useState<Auction[]>([]);
  // 4. State to hold the IDs of wishlisted items
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = [
    "Live",
    "Ending Soon",
    "Most Bid",
    "Art",
    "Experiences",
    "Merchandise",
    "Charity",
    "NGOs",
  ];

  const filters = ["Popular", "Highest Bids", "Newest", "Ending Soon", "Recommended"];

  const trending = [
    { title: "Signed Guitar", bid: "₹3,800", bids: 12 },
    { title: "Vintage Art", bid: "₹4,300", bids: 32 },
    { title: "Cricket Kit (Signed)", bid: "₹2,420", bids: 8 },
  ];

  // 5. Fetch both auctions and wishlist data
  useEffect(() => {
    async function getAuctionsAndWishlist() {
      try {
        setLoading(true);

        // Fetch all auctions
        const auctionsRes = await fetch("/api/auctions");
        if (!auctionsRes.ok) throw new Error("Failed to fetch auctions");
        const auctionData = await auctionsRes.json();

        let userWishlistIds = new Set<string>();

        // If logged in, fetch the user's wishlist
        if (session) {
          const wishlistRes = await fetch("/api/wishlist");
          if (wishlistRes.ok) {
            const wishlistData = await wishlistRes.json();
            // We only need the IDs for quick lookup
            userWishlistIds = new Set(wishlistData.map((item: any) => item.auctionId));
          }
        }
        
        setWishlistedIds(userWishlistIds);

        // Combine auction data with wishlist status
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
  }, [activeCategory, session]); // Re-run if session status changes

  // 6. Create the click handler
  const handleWishlistToggle = useCallback(async (auctionId: string, isCurrentlyWishlisted: boolean) => {
    if (!session) {
      alert("Please log in to add items to your wishlist.");
      // Or redirect to login: router.push('/auth')
      return;
    }

    // Optimistic UI update
    const newWishlistedIds = new Set(wishlistedIds);
    if (isCurrentlyWishlisted) {
      newWishlistedIds.delete(auctionId);
    } else {
      newWishlistedIds.add(auctionId);
    }
    setWishlistedIds(newWishlistedIds);

    setAuctions(prevAuctions =>
      prevAuctions.map(auction =>
        auction._id === auctionId
          ? { ...auction, isWishlisted: !isCurrentlyWishlisted }
          : auction
      )
    );

    // Call the API
    try {
      await fetch("/api/wishlist", {
        method: isCurrentlyWishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId }),
      });
      // Here you could also re-fetch the wishlist count for the navbar
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      // Rollback UI on error
      setAuctions(prevAuctions =>
        prevAuctions.map(auction =>
          auction._id === auctionId
            ? { ...auction, isWishlisted: isCurrentlyWishlisted }
            : auction
        )
      );
      setWishlistedIds(wishlistedIds); // Revert to old set
    }
  }, [session, wishlistedIds]);

  return (
    <div className="grid grid-cols-1 gap-10 px-10 py-10 lg:grid-cols-[2fr_0.9fr]">

      <div>
        {/* CATEGORY PILLS (unchanged) */}
        <div className="flex flex-wrap items-center gap-3">
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

        {/* FILTER TABS (unchanged) */}
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

        {/* AUCTION GRID (Updated) */}
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p>Loading auctions...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : auctions.length === 0 ? (
            <p>No auctions found. Try creating one as a celebrity!</p>
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
                    <div className="h-36 w-full rounded-lg bg-gray-200"></div>
                  </Link>

                  {/* 7. Updated Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent link navigation
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

      {/* Sidebar (unchanged) */}
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-5 shadow border border-[#E5E1DB]">
          <h3 className="flex items-center gap-1 font-bold text-lg">
            🔥 Trending Auctions
          </h3>
          <div className="mt-4 flex flex-col gap-5">
            {trending.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gray-200" />
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500">
                    {item.bid} · {item.bids} bids
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow border border-[#E5E1DB]">
          <h3 className="font-bold text-lg flex items-center gap-1">
            ⭐ Recommended for you
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Based on your wishlist.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow border border-[#E5E1DB]">
          <h3 className="font-bold text-lg flex items-center gap-1">
            ⏰ Recently Viewed
          </h3>
          <p className="text-sm text-gray-500 mt-1">Nothing yet.</p>
        </div>
      </div>
    </div>
  );
}