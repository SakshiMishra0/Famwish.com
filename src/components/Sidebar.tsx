"use client";

import { Celeb } from "@/types";

interface Props {
  celebs: Celeb[];
  selected: Celeb;
  mode: "celeb" | "global";
}

export default function Sidebar({ selected, mode }: Props) {
  const heat = Math.floor(40 + Math.random() * 50);

  return (
    <aside className="space-y-4 sticky top-6">
      <div className="p-4 bg-white border rounded-xl shadow-sm">
        <p className="text-sm text-gray-500">Current Celeb</p>
        <p className="font-bold text-[#22163F]">{mode === "global" ? "Global" : selected.name}</p>
      </div>

      <div className="p-4 bg-white border rounded-xl shadow-sm">
        <p className="text-sm text-gray-500">Leaderboard Heat</p>
        <p className="font-bold">{heat}%</p>

        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div className="bg-orange-400 h-full rounded-full" style={{ width: `${heat}%` }} />
        </div>
      </div>

      <div className="p-4 bg-white border rounded-xl shadow-sm">
        <h4 className="font-bold mb-2">Quick Actions</h4>
        <button className="w-full py-2 bg-[#22163F] text-white rounded-lg hover:bg-[#463985]">
          Follow
        </button>
        <button className="mt-2 w-full py-2 border rounded-lg hover:bg-gray-100">
          Notify for auctions
        </button>
      </div>
    </aside>
  );
}
