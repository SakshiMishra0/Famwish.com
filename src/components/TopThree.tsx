"use client";

import { Fan } from "@/lib/generateFans";

interface Props {
  fans: Fan[];
}

export default function TopThree({ fans }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {fans.map((f, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-gradient-to-b from-white to-gray-50 border shadow text-center"
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-b from-gray-300 to-gray-400" />
          <p className="mt-2 font-semibold text-[#22163F]">#{i + 1} {f.name}</p>
          <p className="font-bold text-yellow-600">{f.points} pts</p>
        </div>
      ))}
    </div>
  );
}
