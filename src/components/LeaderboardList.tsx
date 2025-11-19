// src/components/LeaderboardList.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Celeb, Fan } from "@/types";
import { generateFans } from "@/lib/generateFans";
import TopThree from "./TopThree";
import FanList from "./FanList";
import { showToast } from "@/utils/toast";
import { Globe, Star } from "lucide-react";
import StickyRank from "./StickyRank";

interface Props {
  selectedCeleb: Celeb;
  timeframe: "week" | "month" | "year" | "all";
  mode: "celeb" | "global";
  onUpdateCombinedFans: (fans: Fan[]) => void; 
  searchQuery: string; // New prop for fan filtering
}

// Map for UI labels
const labelMap = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
  all: "All Time",
};

export default function LeaderboardList({ selectedCeleb, timeframe, mode, onUpdateCombinedFans, searchQuery }: Props) {
  const [fans, setFans] = useState<Fan[]>([]);
  const [page, setPage] = useState(1);
  const [you, setYou] = useState<Fan | null>(null);
  const [loading, setLoading] = useState(true); 

  const pageSize = 15;
  const yourId = "you"; 

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setPage(1); 
    let fetchedFans: Fan[] = [];

    if (mode === "global") {
      try {
        const res = await fetch(`/api/leaderboard/global?timeframe=${timeframe}`);
        if (!res.ok) {
          throw new Error("Failed to fetch global leaderboard");
        }
        fetchedFans = await res.json();
      } catch (err) {
        console.error("Error fetching global leaderboard:", err);
        fetchedFans = generateFans(selectedCeleb, timeframe, 100).map(f => ({ ...f, celebName: 'Global', id: `global_${f.id}` }));
      }
    } else {
      try {
          const res = await fetch(`/api/leaderboard/celeb?celebId=${selectedCeleb.id}&timeframe=${timeframe}`);
          if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: res.statusText }));
              console.warn(`Failed to fetch real data for celeb ${selectedCeleb.id}. Falling back to mock. Error: ${errorData.error}`);
              fetchedFans = generateFans(selectedCeleb, timeframe, 100);
          } else {
              fetchedFans = await res.json();
              if (fetchedFans.length === 0) {
                  fetchedFans = generateFans(selectedCeleb, timeframe, 100);
              }
          }
      } catch (err) {
          console.error("Error fetching celeb leaderboard:", err);
          fetchedFans = generateFans(selectedCeleb, timeframe, 100);
      }
    }

    // Update mock "You" user logic
    const topPoints = fetchedFans[0]?.points || 500;
    setYou({ 
      id: yourId, 
      name: "You (Rank Simulator)", 
      points: Math.round(topPoints * (0.1 + Math.random() * 0.4)), 
      bids: Math.floor(Math.random() * 10) + 1,
      wishes: 0,
      celebName: mode === 'celeb' ? selectedCeleb.name : 'Global',
    });

    setFans(fetchedFans);
    setLoading(false);
  }, [selectedCeleb, timeframe, mode]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Combine, sort, and filter based on search query
  const combinedAndFiltered = useMemo(() => {
    const list = you ? [you, ...fans] : fans;
    
    // 1. Filter by search query if applicable
    const filtered = searchQuery.trim() === ''
      ? list
      : list.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
    // 2. Sort the filtered list
    const sortedList = filtered.slice().sort((a, b) => b.points - a.points);
    return sortedList;
  }, [fans, you, searchQuery]);
  
  // Propagate the *unfiltered* list to the parent for the profile card data sync
  useEffect(() => {
      const unfilteredList = you ? [you, ...fans].slice().sort((a, b) => b.points - a.points) : fans.slice();
      onUpdateCombinedFans(unfilteredList);
  }, [fans, you, onUpdateCombinedFans]);


  const rank = combinedAndFiltered.findIndex((f) => f.id === yourId) + 1;
  const paginatedFans = combinedAndFiltered.slice(0, page * pageSize);

  const onChallenge = (fan: Fan) => {
    if (!you) return;
    const gain = Math.round(50 + Math.random() * 350);
    
    const isWin = Math.random() > 0.5; 
    let updatedYou;

    if (isWin) {
        updatedYou = { ...you, points: you.points + gain, bids: you.bids + 1 };
        showToast(`🎉 You beat ${fan.name} and gained +${gain} pts!`);
    } else {
        updatedYou = { ...you, bids: you.bids + 1 };
        showToast(`❌ Challenge failed! Try a higher value.`);
    }

    setYou(updatedYou);
  };
  
  const currentYou = you || { id: yourId, name: "Loading...", points: 0, bids: 0, wishes: 0, celebName: '' };
  const modeLabel = mode === 'global' ? 'Global Rank' : `${selectedCeleb.name}'s Fan Rank`;
  
  const isSearchActive = searchQuery.trim() !== '';

  return (
    <div id="leaderboard-list">
      <StickyRank 
          rank={rank} 
          modeLabel={modeLabel} 
          points={currentYou.points} 
      />

      <div className="p-6 rounded-2xl bg-white border shadow-xl flex flex-col justify-between mt-6 min-h-[500px]">
        
        {/* Header */}
        <div>
            <div className="flex items-center gap-3">
                {mode === 'global' ? 
                    <Globe size={24} className="text-blue-500" /> : 
                    <Star size={24} className="text-yellow-500" />
                }
                <h2 className="font-extrabold text-2xl text-[#22163F]">
                    {mode === "global"
                        ? "Global Top Bidders"
                        : `${selectedCeleb.name}'s Top Fans`}
                </h2>
            </div>
            
            <div className="flex justify-between items-center mt-3 border-b pb-3">
                <p className="text-sm text-gray-500">
                    {isSearchActive 
                        ? `Showing ${paginatedFans.length} search result(s) for "${searchQuery}"`
                        : (mode === "global"
                        ? "Rankings across all auctions and celebrities (Real Data)"
                        : `Top contributors to ${selectedCeleb.name}'s auctions`)
                    }
                </p>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Timeframe: <span className="font-semibold text-[#22163F]">{labelMap[timeframe]}</span></p>
                </div>
            </div>
        </div>

        {/* Main Content */}
        {loading ? (
            <div className="text-center p-10 font-semibold text-gray-500 flex-grow flex items-center justify-center">
                Fetching data...
            </div>
        ) : (
            <div className="flex-grow">
                {isSearchActive && paginatedFans.length > 0 && <p className="text-sm text-green-700 font-semibold my-4">Jumped to rank for searched fan/bidder.</p>}
                
                {paginatedFans.length > 0 ? (
                    <>
                        {/* Only display TopThree if not searching or if the result is long enough */}
                        {!isSearchActive && <TopThree fans={combinedAndFiltered} />}
                        
                        {/* Always display FanList (which includes the mock "You" entry) */}
                        <FanList fans={combinedAndFiltered} onChallenge={onChallenge} yourId={yourId} />

                        {paginatedFans.length < combinedAndFiltered.length && (
                            <button
                                onClick={() => setPage(page + 1)}
                                className="mt-6 w-full px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 font-semibold text-[#22163F]"
                                aria-label="Load more fans"
                            >
                                Load more fans ({combinedAndFiltered.length - paginatedFans.length} remaining) ↓
                            </button>
                        )}
                    </>
                ) : (
                    <div className="text-center p-10 font-semibold text-gray-500">
                        {isSearchActive ? `No fan/bidder found matching "${searchQuery}".` : "No fan data available for this selection."}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}