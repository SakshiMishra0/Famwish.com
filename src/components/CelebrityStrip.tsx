// src/components/CelebrityStrip.tsx
"use client";

import { Celeb } from "@/types";
import { cn } from "@/utils/cn";
import { useMemo } from "react";

// Extend Celeb interface for local use to include new data for sorting
interface ExtendedCeleb extends Celeb {
    donated?: number;
}

interface Props {
  celebs: ExtendedCeleb[];
  selected: Celeb;
  onSelect: (celeb: Celeb) => void;
  searchTerm: string; // New prop for filtering
}

export default function CelebrityStrip({ celebs, selected, onSelect, searchTerm }: Props) {
  
  // 1. Sorting logic (Default mode: sort by donated amount DESC)
  const sortedCelebs = useMemo(() => {
    return [...celebs].sort((a, b) => (b.donated || 0) - (a.donated || 0));
  }, [celebs]);

  // 2. Filtering logic
  const filteredCelebs = useMemo(() => {
    return sortedCelebs.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedCelebs, searchTerm]);
  
  // 3. Determine which list to display
  const displayCelebs = searchTerm.trim() !== '' ? filteredCelebs : sortedCelebs;

  // Handle keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, celeb: Celeb) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(celeb);
    }
  };

  if (displayCelebs.length === 0 && searchTerm.trim() !== '') {
    return (
        <div className="p-4 rounded-xl bg-white/50 border border-dashed border-gray-300 text-gray-600 text-sm">
            No celebrity found matching "{searchTerm}".
        </div>
    );
  }

  return (
    <div 
        className="flex gap-3 overflow-x-auto p-4 rounded-xl bg-white/50 shadow-inner"
        role="tablist"
        aria-label="Select a celebrity"
    >
      {displayCelebs.map((c) => (
        <div
          key={c.id}
          onClick={() => onSelect(c)}
          onKeyDown={(e) => handleKeyDown(e, c)}
          role="tab"
          aria-selected={selected.id === c.id}
          tabIndex={0}
          className={cn(
            "min-w-[120px] cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-2 transition",
            selected.id === c.id
              ? "border-[#22163F] shadow-lg bg-white"
              : "border-gray-200 bg-white hover:shadow-md hover:-translate-y-1"
          )}
        >
          {/* Avatar Placeholder */}
          <div className="h-16 w-16 bg-gradient-to-b from-yellow-100 to-yellow-300 rounded-full flex items-center justify-center text-sm text-[#22163F] font-bold">
            {c.name.charAt(0)}
          </div>
          <div className="font-semibold text-sm text-[#22163F] text-center">{c.name}</div>
          <div className="text-xs text-gray-500">
            {c.followers.toLocaleString()} followers
          </div>
        </div>
      ))}
    </div>
  );
}