"use client";

import { useState } from "react";
import CelebrityStrip from "@/components/CelebrityStrip";
import TimeFilters from "@/components/TimeFilters";
import ModeSwitch from "@/components/ModeSwitch";
import LeaderboardMain from "@/components/LeaderboardMain";
import Sidebar from "@/components/Sidebar";
import { celebs } from "@/lib/mockData";

export default function LeaderboardPage() {
  const [selectedCeleb, setSelectedCeleb] = useState(celebs[0]);
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year" | "all">("week");
  const [mode, setMode] = useState<"celeb" | "global">("celeb");

  return (
    <div className="max-w-[1250px] mx-auto px-5 pt-10 pb-10">

    {/* CELEBRITY STRIP */}
    <div>
      <div className="flex justify-between items-end mb-3">
        <h2 className="font-extrabold text-[22px] text-[#22163F]">
          Choose a celebrity
        </h2>

        <p className="text-[13px] text-[#6B6B6B]">
          Click a celeb to open their fan leaderboard
        </p>
      </div>

      <CelebrityStrip
        celebs={celebs}
        selected={selectedCeleb}
        onSelect={setSelectedCeleb}
      />
    </div>

      {/* FILTER CONTROLS */}
      <div className="flex justify-between items-center mt-6">
        <TimeFilters value={timeframe} onChange={setTimeframe} />
        <ModeSwitch value={mode} onChange={setMode} />
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-6">
        <LeaderboardMain
          selectedCeleb={selectedCeleb}
          timeframe={timeframe}
          mode={mode}
        />

        <Sidebar
          celebs={celebs}
          selected={selectedCeleb}
          mode={mode}
        />
      </div>
    </div>
  );
}
