"use client";

interface Props {
  value: "celeb" | "global";
  onChange: (mode: "celeb" | "global") => void;
}

export default function ModeSwitch({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Mode</span>
      <button
        onClick={() => onChange("celeb")}
        className={`px-4 py-2 text-sm rounded-full ${
          value === "celeb"
            ? "bg-[#22163F] text-white"
            : "bg-white border border-gray-200 text-[#22163F] hover:bg-gray-100"
        }`}
      >
        Fan Leaderboard
      </button>
      <button
        onClick={() => onChange("global")}
        className={`px-4 py-2 text-sm rounded-full ${
          value === "global"
            ? "bg-[#22163F] text-white"
            : "bg-white border border-gray-200 text-[#22163F] hover:bg-gray-100"
        }`}
      >
        Global Top Bidders
      </button>
    </div>
  );
}
