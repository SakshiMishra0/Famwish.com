"use client";

interface Props {
  value: "week" | "month" | "year" | "all";
  onChange: (val: "week" | "month" | "year" | "all") => void;
}

const options = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
  { label: "All Time", value: "all" },
];

export default function TimeFilters({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 py-2 text-sm rounded-full border ${
            value === o.value
              ? "bg-[#22163F] text-white border-transparent"
              : "bg-white text-[#22163F] border-gray-200 hover:bg-gray-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
