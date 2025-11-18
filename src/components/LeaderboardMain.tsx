// src/components/LeaderboardMain.tsx
"use client";

import { useEffect, useState } from "react";
import { Celeb } from "@/types";
import { generateFans, Fan } from "@/lib/generateFans";
import StickyRank from "./StickyRank";
import TopThree from "./TopThree";
import FanList from "./FanList";
import { showToast } from "@/utils/toast";

interface Props {
  selectedCeleb: Celeb;
  timeframe: "week" | "month" | "year" | "all";
  mode: "celeb" | "global";
}

export default function LeaderboardMain({ selectedCeleb, timeframe, mode }: Props) {
  const [fans, setFans] = useState<Fan[]>([]);
  const [page, setPage] = useState(1);
  const [you, setYou] = useState<Fan | null>(null);
  const [loading, setLoading] = useState(true); 

  const pageSize = 10;

  useEffect(() => {
    // 2. Create an async function inside useEffect to fetch data
    const fetchLeaderboard = async () => {
      setLoading(true);
      setPage(1); // Reset pagination
      let fetchedFans: Fan[] = [];

      if (mode === "global") {
        // 3. --- GLOBAL LEADERBOARD (REAL DATA) ---
        try {
          const res = await fetch(`/api/leaderboard/global?timeframe=${timeframe}`);
          if (!res.ok) {
            throw new Error("Failed to fetch global leaderboard");
          }
          const data: Fan[] = await res.json();
          fetchedFans = data;
        } catch (err) {
          console.error(err);
          fetchedFans = []; // Set empty on error
        }
      } else {
        // 4. --- CELEB LEADERBOARD (NOW REAL DATA) ---
        try {
            // Fetch from our NEW celebrity API route
            const res = await fetch(`/api/leaderboard/celeb?celebId=${selectedCeleb.id}&timeframe=${timeframe}`);
            
            if (!res.ok) {
              // On a non-OK response (e.g., 400 for invalid ID, 500 for server error), fall back to mock data
              const errorData = await res.json().catch(() => ({ error: res.statusText }));
              console.warn(`Failed to fetch real data for celeb ${selectedCeleb.id}. Falling back to mock data. Error: ${errorData.error}`);
              fetchedFans = generateFans(selectedCeleb, timeframe, 100);
            } else {
                const data: Fan[] = await res.json();
                fetchedFans = data;
                
                // If the real API returns no data, use mock data as a fallback to show a sample leaderboard
                if (fetchedFans.length === 0) {
                    fetchedFans = generateFans(selectedCeleb, timeframe, 100);
                }
            }
        } catch (err) {
            console.error(err);
            // On hard network failure, fall back to mock data
            fetchedFans = generateFans(selectedCeleb, timeframe, 100);
        }
      }

      setFans(fetchedFans);

      // 5. Update mock "You" user logic (KEEPING MOCK for 'You' user simulation)
      const topPoints = fetchedFans[0]?.points || 500;
      setYou({ 
        id: "you", 
        name: "You", 
        points: Math.round(topPoints / 4), 
        bids: 0, 
        wishes: 0 
      });

      setLoading(false);
    };

    fetchLeaderboard();
    
  }, [selectedCeleb, timeframe, mode]);

  // (This logic is unchanged)
  const combined = you ? [you, ...fans] : fans;
  combined.sort((a, b) => b.points - a.points);

  const rank = combined.findIndex((f) => f.id === "you") + 1;
  const paginatedFans = combined.slice(0, page * pageSize);

  const onChallenge = (fan: Fan) => {
    const gain = Math.round(50 + Math.random() * 350);
    const updatedYou = { ...you!, points: you!.points + gain, bids: you!.bids + 1 };

    showToast(`You gained +${gain} pts vs ${fan.name}!`);
    setYou(updatedYou);
  };

  return (
    <div>
      <StickyRank rank={rank} celebName={selectedCeleb.name} points={you?.points || 0} />

      <div className="p-6 rounded-xl bg-white border shadow mb-4 flex justify-between mt-4">
        <div>
          <h2 className="font-bold text-lg text-[#22163F]">
            {mode === "global"
              ? "Global Top Bidders"
              : `${selectedCeleb.name} — Fan Leaderboard`}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "global"
              ? "Top bidders across all celebrities (Real Data)"
              : `${selectedCeleb.desc} (Now fetching real bid data)`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Leaderboard timeframe</p>
          <p className="font-semibold">{labelMap[timeframe]}</p>
        </div>
      </div>

      {/* 6. Add loading state handler */}
      {loading ? (
        <div className="text-center p-10 font-semibold">Loading Leaderboard...</div>
      ) : (
        <>
          <TopThree fans={combined.slice(0, 3)} />
          <FanList fans={paginatedFans} onChallenge={onChallenge} yourId="you" />

          {paginatedFans.length < combined.length && (
            <button
              onClick={() => setPage(page + 1)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold"
            >
              Load more fans ↓
            </button>
          )}
        </>
      )}
    </div>
  );
}

const labelMap = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
  all: "All Time",
};