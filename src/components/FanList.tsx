"use client";

import { Fan } from "@/lib/generateFans";

interface Props {
  fans: Fan[];
  onChallenge: (fan: Fan) => void;
  yourId: string;
}

export default function FanList({ fans, onChallenge, yourId }: Props) {
  return (
    <div className="mt-4 space-y-3">
      {fans.map((f, i) => (
        <div
          key={f.id}
          className={`flex items-center gap-4 p-3 bg-white border rounded-xl hover:-translate-y-1 hover:shadow-md transition cursor-pointer ${
            f.id === yourId ? "animate-pop" : ""
          }`}
          onClick={() => f.id !== yourId && onChallenge(f)}
        >
          <span className="w-10 text-center font-semibold text-[#22163F]">
            #{i + 1}
          </span>
          <div className="h-12 w-12 rounded-full bg-gradient-to-b from-gray-200 to-gray-400" />
          <div>
            <p className="font-semibold">{f.name}</p>
            <p className="text-xs text-gray-500">{f.bids} bids • {f.wishes} wishes</p>
          </div>
          <span className="ml-auto font-semibold text-[#22163F]">{f.points} pts</span>
        </div>
      ))}
    </div>
  );
}
