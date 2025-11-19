// src/components/FanList.tsx
"use client";

import { Fan } from "@/types"; // Use imported Fan interface
import { DollarSign, Hand, Trophy, User } from "lucide-react";

interface Props {
  fans: Fan[];
  onChallenge: (fan: Fan) => void;
  yourId: string;
}

// Helper to format INR
const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;


export default function FanList({ fans, onChallenge, yourId }: Props) {
    
    // Filter out the top 3 already displayed by TopThree.tsx
    const listFans = fans.slice(3);
    
  return (
    <div className="mt-8 space-y-3">
      {listFans.length === 0 && (
          <p className="p-4 text-center text-gray-500 border rounded-xl bg-white/70">
              No further fans to display or challenge.
          </p>
      )}
      {listFans.map((f, i) => {
          const isYou = f.id === yourId;
          const rank = i + 4; // Since we slice 3, the rank starts at 4
          
          return (
            <div
              key={f.id}
              role="listitem"
              onClick={() => !isYou && onChallenge(f)}
              tabIndex={isYou ? -1 : 0}
              onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isYou) {
                      e.preventDefault();
                      onChallenge(f);
                  }
              }}
              className={`flex items-center gap-4 p-3 bg-white border rounded-xl transition ${
                isYou
                  ? "animate-pop ring-2 ring-red-400 bg-red-50"
                  : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer hover:bg-gray-50"
              }`}
            >
              {/* Rank */}
              <span className="w-8 text-center text-lg font-extrabold text-[#22163F]">
                #{rank}
              </span>
              
              {/* Avatar */}
              <div className="h-12 w-12 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-white text-xl font-bold">
                {isYou ? <User size={20} /> : f.name.charAt(0)}
              </div>
              
              {/* Info */}
              <div className="flex-grow">
                <p className="font-semibold text-lg">{f.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Hand size={12} /> {f.bids} bids 
                    <Trophy size={12} className="ml-2" /> {f.wishes} wishes
                </p>
              </div>
              
              {/* Points */}
              <span className="font-extrabold text-xl text-[#22163F] flex-shrink-0">
                  {formatINR(f.points)}
              </span>
              
              {/* Action/Indicator */}
              {!isYou && (
                  <button 
                    className="ml-auto px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full hover:bg-green-600 transition"
                    onClick={(e) => { e.stopPropagation(); onChallenge(f); }}
                  >
                    Challenge
                  </button>
              )}
            </div>
          );
      })}
    </div>
  );
}