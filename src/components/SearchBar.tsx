// src/components/SearchBar.tsx
"use client";

import { useState, useEffect } from "react"; // 1. Import useEffect
import { useRouter } from "next/navigation";

// 2. Add prop for the initial query from the URL
interface SearchBarProps {
  initialQuery?: string | null;
}

export default function SearchBar({ initialQuery }: SearchBarProps) {
  // 3. Initialize state with the prop
  const [searchTerm, setSearchTerm] = useState(initialQuery || "");
  const router = useRouter();

  // 4. Add useEffect to sync state if the URL query changes
  // This is crucial for when the user navigates back/fwd
  // or lands on the page with a pre-filled query.
  useEffect(() => {
    setSearchTerm(initialQuery || "");
  }, [initialQuery]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      // Navigate to the auction page with the search query
      router.push(`/auction?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      // If search is empty, go to the auction page *without* the query
      router.push("/auction");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="mt-6 flex items-center gap-3">
      <input
        type="text"
        placeholder="Search auctions, NGOs, causes..."
        className="w-full rounded-xl border border-[#D5D0C7] bg-white px-4 py-3 text-sm shadow-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button
        onClick={handleSearch}
        className="rounded-xl bg-[#1E1635] px-5 py-3 text-sm font-semibold text-white hover:bg-[#463985]"
      >
        Explore
      </button>
    </div>
  );
}