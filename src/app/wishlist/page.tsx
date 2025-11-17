// src/app/wishlist/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react"; // 1. Import useCallback
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

  // 2. Add the handleRemove function
  const handleRemove = useCallback(async (auctionIdToRemove: string) => {
    // Save the current items for potential rollback
    const originalItems = items;

    // Optimistic UI update: Remove the item from the list immediately
    setItems(prevItems => 
      prevItems.filter(item => item.auctionId !== auctionIdToRemove)
    );

    // Call the API to delete the item
    try {
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId: auctionIdToRemove }),
      });

      if (!res.ok) {
        // If the API call fails, throw an error
        throw new Error("Failed to remove item from wishlist");
      }
      // On success, the UI is already updated, so we do nothing.
      // You could also refetch the navbar count here if needed.

    } catch (err) {
      console.error(err);
      // Rollback: If the API call failed, restore the original item list
      alert("Error removing item. Please try again.");
      setItems(originalItems);
    }
  }, [items]); // This function depends on the 'items' state

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
            <Link href={`/auction/${item.auctionId}`} className="block w-24 h-24 bg-gray-200 rounded-md flex-shrink-0">
              {/* You would put an auction image here */}
            </Link>
            
            <div className="flex-grow">
              <Link href={`/auction/${item.auctionId}`} className="block">
                <h3 className="text-lg font-semibold text-gray-900 hover:underline">
                  {item.auctionDetails.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-600">
                Current Bid: <span className="font-bold">{item.auctionDetails.bid}</span>
              </p>
              <p className="text-sm text-gray-600">
                Bids: <span className="font-bold">{item.auctionDetails.bids}</span>
              </p>
              
              {/* 3. Attach the onClick handler to the button */}
              <button 
                onClick={() => handleRemove(item.auctionId)}
                className="mt-2 px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-full hover:bg-red-50 hover:border-red-300"
              >
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