// src/components/TimeFilters.tsx
import React from "react";

type FilterOption = "week" | "month" | "year" | "all";

type Option = {
  label: string;
  value: FilterOption;
};

type Props = {
  value: FilterOption;
  onChange: (v: FilterOption) => void;
  className?: string;
};

const OPTIONS: Option[] = [
  { label: "1W", value: "week" },
  { label: "1M", value: "month" },
  { label: "1Y", value: "year" },
  { label: "All", value: "all" },
];

const TimeFilters: React.FC<Props> = ({ value, onChange, className = "" }) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 py-2 text-sm rounded-full border transition-colors duration-150 ${
            value === o.value
              ? "bg-[#22163F] text-white border-transparent"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
          aria-pressed={value === o.value}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

export default TimeFilters;
