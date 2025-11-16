// src/app/wishlist/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

// Define a type for our wishlist item (which includes the joined auction)
interface WishlistItem {
  _id: string;
  userId: string;
  auctionId: string;
  notes: string;
  auctionDetails: {
    _id: string;
    title: string;
    bid: string;
    bids: number;
  };
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await fetch("/api/wishlist");
        if (!res.ok) {
          throw new Error("Failed to fetch wishlist");
        }
        const data = await res.json();
        setItems(data);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    };

    fetchWishlist();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-extrabold mb-6 text-[#22163F]">
        Your Wishlist
      </h1>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && items.length === 0 && (
        <p>Your wishlist is empty.</p>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div 
            key={item._id} 
            className="p-4 rounded-lg border bg-white flex items-center gap-4"
          >
            <div className="w-24 h-24 bg-gray-200 rounded-md flex-shrink-0">
              {/* You would put an auction image here */}
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-900">
                {item.auctionDetails.title}
              </h3>
              <p className="text-sm text-gray-600">
                Current Bid: <span className="font-bold">{item.auctionDetails.bid}</span>
              </p>
              <p className="text-sm text-gray-600">
                Bids: <span className="font-bold">{item.auctionDetails.bids}</span>
              </p>
              <button className="mt-2 px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-full hover:bg-red-50">
                Remove
              </button>
            </div>
            <div className="text-red-500">
              <Heart size={20} fill="currentColor" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}