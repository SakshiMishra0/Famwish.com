// src/components/TopPhilanthropists.tsx
import Link from "next/link";

// Define the type for a single philanthropist
interface Philanthropist {
  id: string;
  name: string;
  username: string; // We'll still accept this but not use it for the link
  amount: number;
  wishes: number;
}

// Define the props for the component
interface Props {
  philanthropists: Philanthropist[];
}

export default function TopPhilanthropists({ philanthropists }: Props) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-[#D6D1CA] h-fit sticky top-24">
      <h3 className="mb-5 text-lg font-bold">Top Celebrities</h3>

      <div className="space-y-3">
        {philanthropists.length > 0 ? (
          philanthropists.map((person) => (
            <Link
              // --- THIS IS THE CHANGE ---
              // We now link using the real database ID
              href={`/profile/${person.id}`}
              // -------------------------
              key={person.id}
              className="block rounded-xl bg-[#FAF9F7] px-4 py-3 border border-[#E6E2DB] hover:bg-[#F4F2EE] transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-300" />
                <div>
                  <p className="font-semibold text-sm">{person.name}</p>
                  <p className="text-xs text-gray-500">
                    ₹{person.amount.toLocaleString()} raised · {person.wishes} wishes
                  </p>
                  <div className="mt-1 h-1.5 w-24 rounded-full bg-[#F4C15D]" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            No celebrities have registered yet.
          </p>
        )}
      </div>
    </div>
  );
}