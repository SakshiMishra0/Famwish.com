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

  const pageSize = 10;

  useEffect(() => {
    let generatedFans = mode === "global"
      ? celebsList.flatMap((celeb) =>
          generateFans(celeb, timeframe, 15).map((f) => ({
            ...f,
            celebName: celeb.name,
          }))
        )
      : generateFans(selectedCeleb, timeframe, 100);

    generatedFans.sort((a, b) => b.points - a.points);
    setFans(generatedFans);
    setYou({ id: "you", name: "You", points: Math.round(generatedFans[0]?.points / 4), bids: 0, wishes: 0 });
    setPage(1);
  }, [selectedCeleb, timeframe, mode]);

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
              ? "Top bidders across all celebrities"
              : selectedCeleb.desc}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Leaderboard timeframe</p>
          <p className="font-semibold">{labelMap[timeframe]}</p>
        </div>
      </div>

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
    </div>
  );
}

const labelMap = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
  all: "All Time",
};

const celebsList = [
  { id: "samay", name: "Samay Raina", desc: "", followers: 1248 },
  { id: "carry", name: "CarryMinati", desc: "", followers: 980 },
  { id: "bhuvan", name: "Bhuvan Bam", desc: "", followers: 760 },
  { id: "rvc", name: "RVCJ", desc: "", followers: 420 },
  { id: "unknown", name: "Zayn Khan", desc: "", followers: 210 },
  { id: "alia", name: "Alia Sharma", desc: "", followers: 540 },
];
