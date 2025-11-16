interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  const user = {
    name: "Samayran Singh",
    handle: "@samayran",
    vip: true,
    bio: "UI/UX designer, collector, and philanthropist focused on education & health. Loves art auctions and micro-impact projects.",
    donated: 23546,
    wishes: 7,
    ngos: 4,
    rank: 4,
    annualGoal: 40000,
  };

  const fulfilled = [
    { title: "Ananya — School Supplies", ago: "2 months ago" },
    { title: "Raju — Cricket Kit", ago: "5 months ago" },
  ];

  const activity = [
    { text: "Fulfilled: Ananya — School Supplies", ago: "2 months ago" },
    { text: "Bid: $340 on Vintage Art", ago: "10 hours ago" },
    { text: "Donated $500 to Old Heritage", ago: "4 days ago" },
  ];

  const auctions = [
    { title: "Handmade Painting (Live)", price: "₹4,300", bids: "32 bids" },
    { title: "Signed Guitar (Upcoming)", price: "Starting $500—" },
    { title: "Antique Vase (Won)", price: "$2,100 Won" },
  ];

  const recommended = [
    { name: "Gagan", amount: "$14.2k" },
    { name: "Aarav", amount: "$9.8k" },
    { name: "Riya", amount: "$7.2k" },
    { name: "Kabir", amount: "$6.1k" },
  ];

  const fans = [
    { name: "Priyanshu", rank: 1, bids: 12, amount: "$820" },
    { name: "Riya", rank: 2, bids: 9, amount: "$540" },
    { name: "Neha", rank: 3, bids: 7, amount: "$420" },
  ];

  return (
    <div className="pt-10 grid gap-8 md:grid-cols-[1.1fr_1.4fr]">
      
      {/* LEFT PANEL */}
      <div>
        {/* Profile Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#E8E3DB]">
          <div className="h-20 w-20 rounded-full bg-gray-300" />

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
            {user.name}
            {user.vip && (
              <span className="text-sm text-yellow-600 font-semibold"> • VIP</span>
            )}
          </h1>

          <p className="text-sm text-gray-500">{user.handle}</p>

          <p className="mt-3 text-sm text-gray-600 leading-relaxed">{user.bio}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 text-center text-sm">
            <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
              <p className="font-bold">₹{user.donated.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Total donated</p>
            </div>

            <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
              <p className="font-bold">{user.wishes}</p>
              <p className="text-xs text-gray-600">Wishes fulfilled</p>
            </div>

            <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
              <p className="font-bold">{user.ngos}</p>
              <p className="text-xs text-gray-600">NGOs supported</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100">
              Follow
            </button>

            <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100">
              Message
            </button>

            <button className="rounded-xl bg-[#F4C15D] px-4 py-2 text-sm font-semibold text-[#1E1635] hover:bg-[#e4b24e]">
              + Create Auction
            </button>
          </div>
        </div>

        {/* Wishes Fulfilled */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm border border-[#E8E3DB]">
          <h2 className="text-lg font-bold">Wishes Fulfilled</h2>

          <div className="mt-4 space-y-4">
            {fulfilled.map((wish, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-14 w-14 bg-gray-200 rounded-xl" />
                <div>
                  <p className="font-semibold">{wish.title}</p>
                  <p className="text-xs text-gray-500">{wish.ago}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm border border-[#E8E3DB]">
          <h2 className="text-lg font-bold">Testimonials</h2>
          <p className="mt-3 text-sm">
            “Your support changed 12 students' lives.” — Roshni NGO
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div>
        <div className="rounded-2xl bg-white px-8 py-7 shadow-sm border border-[#E8E3DB]">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold">Activity & Impact</h2>

            <div className="text-right">
              <p className="font-semibold text-sm">Rank #{user.rank}</p>
              <p className="text-xs text-gray-500">Top donors this month</p>
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-600">
            Recent activity, contributions and auctions participated by {user.name}.
          </p>

          {/* Recent Activity */}
          <h3 className="mt-6 mb-3 text-lg font-bold">Recent Activity</h3>

          <div className="space-y-4">
            {activity.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl p-3 bg-[#FBFAF8] border"
              >
                <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                <div>
                  <p className="text-sm font-semibold">{item.text}</p>
                  <p className="text-xs text-gray-500">{item.ago}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Auctions */}
          <h3 className="mt-10 mb-3 text-lg font-bold">Auctions (Created & Participated)</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {auctions.map((auc, i) => (
              <div
                key={i}
                className="rounded-xl border bg-[#FBFAF8] p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition"
              >
                <div className="h-20 w-full bg-gray-200 rounded-xl" />
                <p className="mt-3 font-semibold text-sm">{auc.title}</p>
                <p className="text-xs text-gray-500 mt-1">{auc.price}</p>
              </div>
            ))}
          </div>

          {/* Recommended */}
          <h3 className="mt-10 mb-3 text-lg font-bold">Recommended Philanthropists</h3>

          <div className="flex items-center gap-4">
            {recommended.map((p, i) => (
              <div key={i} className="text-center text-sm">
                <div className="h-12 w-12 bg-gray-300 rounded-full" />
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{p.amount}</p>
              </div>
            ))}
          </div>

          {/* Top Fans */}
          <h3 className="mt-10 mb-3 text-lg font-bold">Top Fans (Based on Bids)</h3>

          <div className="space-y-3">
            {fans.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border p-3 bg-[#FBFAF8]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#D4A017]">#{f.rank}</span>
                  <div className="h-10 w-10 bg-gray-300 rounded-full" />
                  <div>
                    <p className="font-semibold">{f.name}</p>
                    <p className="text-xs text-gray-500">
                      {f.bids} bids · {f.amount}
                    </p>
                  </div>
                </div>

                <button className="px-3 py-1 text-xs border rounded-full hover:bg-white">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
