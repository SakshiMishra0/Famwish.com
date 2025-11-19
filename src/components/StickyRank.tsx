// src/components/StickyRank.tsx
"use client";

import { DollarSign, Trophy } from "lucide-react";

interface Props {
  rank: number | null;
  modeLabel: string;
  points: number;
}

// Helper to format INR
const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;


export default function StickyRank({ rank, modeLabel, points }: Props) {
  return (
    <div className="sticky top-4 z-10 bg-[#22163F] text-white px-6 py-3 rounded-lg shadow-lg flex justify-between items-center">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium opacity-80 flex items-center gap-1">
          <Trophy size={16} /> Your Rank:
        </span>
        <strong className="text-xl">
          #{rank !== null ? rank : "—"}
        </strong>
      </div>
      
      <div className="text-right">
        <p className="text-xs opacity-80">{modeLabel}</p>
        <strong className="text-xl flex items-center">
          <DollarSign size={18} className="mr-1 text-yellow-300" />
          {formatINR(points)} pts
        </strong>
      </div>
    </div>
  );
}