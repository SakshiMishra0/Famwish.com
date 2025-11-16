import Link from "next/link";

const data = [
  { name: "Samayran Singh", username: "samayran", amount: 23546, wishes: 7 },
  { name: "Gagan", username: "gagan", amount: 14200, wishes: 5 },
  { name: "Aarav", username: "aarav", amount: 9810, wishes: 4 },
  { name: "Riya", username: "riya", amount: 7200, wishes: 3 },
  { name: "Kabir", username: "kabir", amount: 6100, wishes: 2 },
];

export default function TopPhilanthropists() {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-[#D6D1CA] h-fit sticky top-24">
      <h3 className="mb-5 text-lg font-bold">Top Philanthropists</h3>

      <div className="space-y-3">
        {data.map((person, i) => (
          <Link
            href={`/profile/${person.username}`}
            key={i}
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
        ))}
      </div>
    </div>
  );
}
