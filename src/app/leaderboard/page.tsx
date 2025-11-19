// src/app/leaderboard/page.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import CelebrityStrip from "@/components/CelebrityStrip";
import TimeFilters from "@/components/TimeFilters";
import ModeSwitch from "@/components/ModeSwitch";
import LeaderboardList from "@/components/LeaderboardList"; 
import LeaderboardProfile from "@/components/LeaderboardProfile"; 
import SearchBar from "@/components/SearchBar"; 
import { celebs } from "@/lib/mockData";
import { Celeb, Fan } from "@/types";

export default function LeaderboardPage() {
  const [selectedCeleb, setSelectedCeleb] = useState<Celeb>(celebs[0]);
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year" | "all">("week");
  const [mode, setMode] = useState<"celeb" | "global">("celeb");
  const [searchQuery, setSearchQuery] = useState(""); // General search query for strip/fans
  // State to hold the fetched/combined fan list from the List component
  const [combinedFans, setCombinedFans] = useState<Fan[]>([]); 

  // Handler for the SearchBar in the top control panel
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  // Logic to determine the celebrity data for the list/profile.
  const activeCelebData = useMemo(() => {
      const foundCeleb = celebs.find(c => c.id === selectedCeleb.id);
      return foundCeleb || selectedCeleb;

  }, [selectedCeleb]);
  
  const handleCelebSelect = useCallback((celeb: Celeb) => {
      setSelectedCeleb(celeb);
      setMode('celeb'); // Always switch to celeb mode when selecting one from the strip
      setSearchQuery(''); // Clear search on selection
  }, []);

  return (
    <div className="max-w-[1250px] mx-auto pt-10 pb-10">

        {/* TOP BAR: Controls & Search */}
        <div className="p-6 rounded-2xl bg-white/50 border border-[#E8E3DB] shadow-lg mb-6">
            <h1 className="text-3xl font-extrabold mb-4 text-[#22163F]">
                Fan & Bidder Leaderboard
            </h1>

            {/* Row 1: Mode & Time Filters */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b pb-4 mb-4">
                <ModeSwitch 
                    value={mode} 
                    onChange={(newMode) => {
                        setMode(newMode);
                        setSearchQuery(''); // Clear search when changing mode
                    }} 
                />
                <TimeFilters value={timeframe} onChange={setTimeframe} className="md:justify-end" />
            </div>

            {/* Row 2: Search Bar (Dynamic placeholder based on mode) */}
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <SearchBar 
                        mode={mode} // Pass mode to change placeholder text
                        onLocalSearch={handleSearch} 
                        initialQuery={searchQuery} 
                    />
                </div>
            </div>
        </div>

        {/* CELEBRITY STRIP (Hidden in Global Mode) */}
        {mode === 'celeb' && (
            <div className="mb-6">
                <div className="flex justify-between items-end mb-3">
                    <h2 className="font-extrabold text-[22px] text-[#22163F]">
                        {searchQuery ? 'Search Results' : 'Choose a Celebrity to View Fan Ranks'}
                    </h2>
                    <p className="text-[13px] text-[#6B6B6B]">
                        Currently focused on: {selectedCeleb.name}
                    </p>
                </div>
                <CelebrityStrip
                    celebs={celebs as any} // Cast to satisfy updated interface
                    selected={activeCelebData}
                    onSelect={handleCelebSelect}
                    searchTerm={searchQuery} // Filter strip content
                />
            </div>
        )}


        {/* MAIN LAYOUT (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 mt-6">
            
            {/* LEFT COLUMN: Profile Card & Top Fans (Dynamic) */}
            <div className="lg:order-1 order-2">
                <LeaderboardProfile
                    selectedCeleb={activeCelebData}
                    combinedFans={combinedFans}
                    onChallenge={() => {}} 
                    yourId="you" 
                    mode={mode}
                />
            </div>

            {/* RIGHT COLUMN: The Main Ranking List (Fixed List) */}
            <div className="lg:order-2 order-1">
                <LeaderboardList
                    selectedCeleb={activeCelebData}
                    timeframe={timeframe}
                    mode={mode}
                    onUpdateCombinedFans={setCombinedFans}
                    searchQuery={searchQuery} // Pass search query for fan filtering
                />
            </div>
            
        </div>
    </div>
  );
}