// src/components/SearchBar.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SearchBarProps {
  initialQuery?: string | null;
  // New props for dynamic behavior
  mode: "celeb" | "global"; 
  onLocalSearch?: (query: string) => void; 
}

export default function SearchBar({ initialQuery, onLocalSearch, mode }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialQuery || "");
  const router = useRouter();

  // Sync state if the URL query changes
  useEffect(() => {
    setSearchTerm(initialQuery || "");
  }, [initialQuery]);

  const handleSearch = () => {
    if (onLocalSearch) {
      // Use local search function if provided (e.g., for filtering the Celeb strip)
      onLocalSearch(searchTerm.trim());
    } else if (searchTerm.trim()) {
      // Default behavior: navigate to the auction page with the search query
      router.push(`/auction?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      // If search is empty, go to the auction page *without* the query (for global search)
      router.push("/auction");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const placeholderText = mode === 'celeb' 
    ? "Search celebrity..." 
    : "Search fan/bidder by name...";

  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        placeholder={onLocalSearch ? placeholderText : "Search auctions, NGOs, causes..."}
        className="w-full rounded-xl border border-[#D5D0C7] bg-white px-4 py-3 text-sm shadow-sm focus:border-[#2F235A] focus:ring-1 focus:ring-[#2F235A] transition"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label={onLocalSearch ? placeholderText : "Search auctions"}
      />

      <button
        onClick={handleSearch}
        className="rounded-xl bg-[#1E1635] px-5 py-3 text-sm font-semibold text-white hover:bg-[#463985] transition flex-shrink-0"
        aria-label="Search"
      >
        <Search size={20} />
      </button>
    </div>
  );
}