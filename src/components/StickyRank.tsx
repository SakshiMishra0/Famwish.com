"use client";

interface Props {
  rank: number | null;
  celebName?: string;
  points: number;
}

export default function StickyRank({ rank, celebName, points }: Props) {
  return (
    <div className="sticky top-4 z-10 bg-[#22163F] text-white px-6 py-3 rounded-lg shadow-lg">
      You are{" "}
      <strong>
        #{rank !== null ? rank : "—"} — {points} pts
      </strong>{" "}
      for <span className="font-semibold">{celebName || "Global"}</span>
    </div>
  );
}
