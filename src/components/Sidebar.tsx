// src/components/Sidebar.tsx
"use client";

import { Celeb } from "@/types";
import { useState, useEffect } from "react"; // 1. Import useState and useEffect

interface Props {
  celebs: Celeb[];
  selected: Celeb;
  mode: "celeb" | "global";
}

export default function Sidebar({ selected, mode }: Props) {
  // 2. Initialize 'heat' with a default, non-random state (e.g., 0)
  // The server will render 0, and the client will also render 0 on its first pass.
  const [heat, setHeat] = useState(0);

  // 3. Use useEffect to set the random value *only* on the client side
  useEffect(() => {
    // This code only runs in the browser, *after* hydration is complete
    const randomHeat = Math.floor(40 + Math.random() * 50);
    setHeat(randomHeat);
  }, [selected, mode]); // 4. We also re-run this if the celeb or mode changes

  return (
    <aside className="space-y-4 sticky top-6">
      <div className="p-4 bg-white border rounded-xl shadow-sm">
        <p className="text-sm text-gray-500">Current Celeb</p>
        <p className="font-bold text-[#22163F]">{mode === "global" ? "Global" : selected.name}</p>
      </div>

      <div className="p-4 bg-white border rounded-xl shadow-sm">
        <p className="text-sm text-gray-500">Leaderboard Heat</p>
        
        {/* 5. This <p> tag now safely renders the 'heat' state */}
        <p className="font-bold">{heat}%</p>

        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          {/* 6. The width will be 0% on load, then animate to the random value */}
          <div 
            className="bg-orange-400 h-full rounded-full transition-all duration-300" 
            style={{ width: `${heat}%` }} 
          />
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