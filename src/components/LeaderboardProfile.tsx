// src/components/LeaderboardProfile.tsx
"use client";

import { Celeb, Fan } from "@/types";
import { DollarSign, Hand, TrendingUp, User, Star, Globe } from "lucide-react";
import Link from "next/link";
import TopThree from "./TopThree";
import FanList from "./FanList"; 

interface Props {
  selectedCeleb: Celeb;
  combinedFans: Fan[];
  onChallenge: (fan: Fan) => void;
  yourId: string;
  mode: "celeb" | "global";
}

// Helper to format INR
const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function LeaderboardProfile({
  selectedCeleb,
  combinedFans,
  onChallenge,
  yourId,
  mode,
}: Props) {
  
    // Find the current user's entry for this celeb/global list
    const yourFanEntry = combinedFans.find(f => f.id === yourId);

    // Filter to only show fans for the currently selected celebrity if in celeb mode
    const celebFans = combinedFans.filter(f => f.celebName === selectedCeleb.name);

    if (mode === 'global') {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-xl border border-[#E8E3DB] sticky top-6 h-fit">
                <h2 className="text-xl font-bold text-[#22163F] flex items-center gap-2">
                    <Globe size={24} className="text-blue-500" />
                    Global Leaderboard Insights
                </h2>
                <p className="mt-3 text-gray-600">
                    The Global Leaderboard tracks top overall bidders. To see profile details, please select <b>Fan Leaderboard</b> mode and choose a celebrity.
                </p>
                
                <div className="mt-5 space-y-2">
                    <p className="font-bold text-lg text-[#22163F]">Your Contribution:</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-[#FAF9F7] py-3 px-4 border border-[#E8E3DB] shadow-sm">
                            <p className="font-bold text-lg">{formatINR(yourFanEntry?.points || 0)}</p>
                            <p className="text-xs text-gray-600">Total Points</p>
                        </div>
                        <div className="rounded-xl bg-[#FAF9F7] py-3 px-4 border border-[#E8E3DB] shadow-sm">
                            <p className="font-bold text-lg">{yourFanEntry?.bids || 0}</p>
                            <p className="text-xs text-gray-600">Total Bids Placed</p>
                        </div>
                    </div>
                </div>

            </div>
        );
    }


    return (
        <div className="space-y-6 sticky top-6 h-fit lg:col-span-1">
          
          {/* 1. Celebrity Profile Card */}
          <div className="rounded-2xl bg-white p-6 shadow-xl border border-[#E8E3DB] flex flex-col items-center text-center">
              
            {/* Avatar Placeholder */}
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#F4C15D] to-[#D9A441] border-4 border-white shadow-md flex items-center justify-center text-white text-3xl font-bold">
              {selectedCeleb.name.charAt(0)}
            </div>
            
            <h2 className="mt-4 text-xl font-extrabold tracking-tight text-[#22163F]">
              {selectedCeleb.name}
              <span className="text-sm text-yellow-600 font-semibold ml-2">
                <Star size={16} className="inline-block" /> VIP
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">{selectedCeleb.desc}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-5 w-full text-sm">
              <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
                <p className="font-bold">{selectedCeleb.followers.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Followers</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
                <p className="font-bold">{formatINR(yourFanEntry?.points || 0)}</p>
                <p className="text-xs text-gray-600">Your points</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
                <p className="font-bold">{yourFanEntry?.bids || 0}</p>
                <p className="text-xs text-gray-600">Your total bids</p>
              </div>
            </div>

            {/* Action Button */}
            <Link href={`/profile/${selectedCeleb.id}`} className="mt-5 w-full text-center rounded-xl bg-[#2F235A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#463985] transition">
              <TrendingUp size={16} className="inline-block mr-1" /> View Full Profile
            </Link>
          </div>

          {/* 2. Top Fans List Section (Quick View) */}
          <div className="rounded-2xl bg-white p-6 shadow-xl border border-[#E8E3DB]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#22163F]">
                <Hand size={20} className="text-red-500" />
                Quick Top 3 Fans
            </h3>
            
            {/* Display Top 3 of the Celeb's fans */}
            <TopThree fans={celebFans} />
            
            <Link href={`#leaderboard-list`} className="mt-4 text-sm text-[#463985] font-semibold block text-center hover:underline">
                View all {celebFans.length} rankings →
            </Link>
          </div>
          
        </div>
      );
}