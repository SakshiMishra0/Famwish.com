// src/components/TopThree.tsx
"use client";

import { Fan } from "@/types"; // Use imported Fan interface
import { DollarSign } from "lucide-react";

interface Props {
  fans: Fan[];
}

// Helper to format INR
const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function TopThree({ fans }: Props) {
  // Ensure we only process up to 3 fans
  const topFans = fans.slice(0, 3);
  
  // Custom design based on rank for visual hierarchy
  const getRankClasses = (rank: number) => {
      switch(rank) {
          case 1: return "bg-gradient-to-b from-yellow-300 to-yellow-500 text-[#22163F] shadow-2xl scale-[1.05]";
          case 2: return "bg-gradient-to-b from-gray-200 to-gray-300 text-[#22163F] shadow-lg";
          case 3: return "bg-gradient-to-b from-orange-200 to-orange-300 text-[#22163F] shadow-md";
          default: return "bg-white";
      }
  }
  
  const getRankBadge = (rank: number) => {
      switch(rank) {
          case 1: return "🏆";
          case 2: return "🥈";
          case 3: return "🥉";
          default: return "";
      }
  }

  return (
    <div className="grid grid-cols-3 gap-5 mt-8" aria-label="Top three fans">
      {topFans.map((f, i) => (
        <div
          key={f.id}
          className={`p-4 rounded-xl border border-gray-100 transition-all duration-300 ${getRankClasses(i + 1)}`}
        >
          <div className="flex flex-col items-center">
            <span className="text-3xl font-extrabold mb-1">{getRankBadge(i + 1)}</span>
            
            {/* Avatar Placeholder */}
            <div className="mx-auto h-16 w-16 rounded-full bg-gray-600 border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-bold">
                {f.name.charAt(0)}
            </div>
            
            <p className="mt-3 font-bold text-lg text-center leading-tight">
                {f.name}
            </p>
            <p className="font-extrabold text-lg flex items-center text-[#22163F]">
                <DollarSign size={16} className="mr-1 text-green-700" /> 
                {formatINR(f.points)}
            </p>
            <p className="text-xs text-gray-600 mt-1">{f.bids} Bids</p>
          </div>
        </div>
      ))}
    </div>
  );
}