// src/app/profile/[id]/page.tsx
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";

// --- 1. Define Props ---
interface Props {
  params: {
    id: string | Promise<string>; // This [id] will come from the URL
  };
}

// --- 2. Data Fetching Function for User Details ---
async function getUserData(id: string) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Find the user by their ID
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      // Only get the fields we actually need
      { projection: { name: 1, email: 1, role: 1 } } 
    );

    if (!user) {
      return null; // User not found
    }

    // Format the data for the component
    return {
      id: user._id.toString(),
      name: user.name,
      handle: user.email, // We can use email as the handle
      vip: user.role === 'celebrity',
      // We'll add a database field for 'bio' later. For now, it's static.
      bio: "This is a real celebrity profile, loaded from the database. Bio coming soon!",
    };
  } catch (e) {
    // This catches invalid IDs that can't be cast to ObjectId
    console.error("Failed to fetch user data:", e);
    return null;
  }
}

// --- 3. Data Fetching Function for User Stats ---
async function getUserStats(id: string) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Use an aggregation pipeline to calculate stats
    const stats = await db.collection("auctions").aggregate([
      {
        // Find all auctions created by this user
        $match: { createdBy: new ObjectId(id) }
      },
      {
        // Group them to calculate the totals
        $group: {
          _id: null, // Group all found documents into one
          totalRaised: { $sum: "$currentHighBid" }, // Sum the final bid of all their auctions
          wishesFulfilled: { $sum: 1 } // Count the number of auctions they've created
        }
      }
    ]).toArray();

    // If the user has no auctions, the pipeline will return empty
    if (stats.length === 0) {
      return { totalRaised: 0, wishesFulfilled: 0 };
    }

    // Return the calculated stats
    return stats[0]; // e.g., { _id: null, totalRaised: 50000, wishesFulfilled: 3 }

  } catch (e) {
    console.error("Failed to fetch user stats:", e);
    // Return 0 on error
    return { totalRaised: 0, wishesFulfilled: 0 };
  }
}

// --- 4. The Async Page Component ---
export default async function ProfilePage({ params }: Props) {
  // CRITICAL FIX: Explicitly await the entire params object first to resolve the dynamic segment, 
  // which prevents the error in Next.js/Turbopack environments.
  const resolvedParams = await params;
  const id = resolvedParams.id as string; // Use the resolved ID

  // 5. Fetch the user's details and stats in parallel
  const [userData, userStats] = await Promise.all([
    getUserData(id),
    getUserStats(id)
  ]);

  // 6. If no user is found, show the 404 page
  if (!userData) {
    notFound();
  }

  // --- Mock Data (for sections we haven't implemented yet) ---
  const fulfilled = [
    { title: "Mock: School Supplies", ago: "2 months ago" },
    { title: "Mock: Cricket Kit", ago: "5 months ago" },
  ];
  const activity = [
    { text: "Mock: Fulfilled: School Supplies", ago: "2 months ago" },
    { text: "Mock: Bid: $340 on Vintage Art", ago: "10 hours ago" },
  ];
  const auctions = [
    { title: "Mock: Handmade Painting (Live)", price: "₹4,300", bids: "32 bids" },
    { title: "Mock: Signed Guitar (Upcoming)", price: "Starting $500—" },
  ];
  const recommended = [
    { name: "Gagan", amount: "$14.2k" },
    { name: "Aarav", amount: "$9.8k" },
  ];
  const fans = [
    { name: "Priyanshu", rank: 1, bids: 12, amount: "$820" },
    { name: "Riya", rank: 2, bids: 9, amount: "$540" },
  ];
  // --- End Mock Data ---


  // --- 7. Render the Page with Real Data ---
  return (
    <div className="pt-10 grid gap-8 md:grid-cols-[1.1fr_1.4fr]">
      
      {/* LEFT PANEL */}
      <div>
        {/* Profile Card - NOW REAL DATA */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#E8E3DB]">
          <div className="h-20 w-20 rounded-full bg-gray-300" /> {/* Placeholder for profile pic */}

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
            {userData.name}
            {userData.vip && (
              <span className="text-sm text-yellow-600 font-semibold"> • VIP</span>
            )}
          </h1>

          <p className="text-sm text-gray-500">{userData.handle}</p>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">{userData.bio}</p>

          {/* Stats - NOW REAL DATA */}
          <div className="grid grid-cols-3 gap-3 mt-5 text-center text-sm">
            <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
              <p className="font-bold">₹{userStats.totalRaised.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Total raised</p>
            </div>

            <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
              <p className="font-bold">{userStats.wishesFulfilled}</p>
              <p className="text-xs text-gray-600">Wishes fulfilled</p>
            </div>

            <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
              <p className="font-bold">0</p> {/* NGOs supported is not calculated yet */}
              <p className="text-xs text-gray-600">NGOs supported</p>
            </div>
          </div>

          {/* Action Buttons (Mock) */}
          <div className="flex gap-3 mt-6">
            <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100">
              Follow
            </button>
            <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100">
              Message
            </button>
            {/* We'll hide the Create Auction button for now unless it's your own profile */}
          </div>
        </div>

        {/* --- Sections below still use MOCK data for now --- */}

        {/* Wishes Fulfilled */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm border border-[#E8E3DB]">
          <h2 className="text-lg font-bold">Wishes Fulfilled (Mock)</h2>
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
          <h2 className="text-lg font-bold">Testimonials (Mock)</h2>
          <p className="mt-3 text-sm">
            “Your support changed 12 students' lives.” — Roshni NGO
          </p>
        </div>
      </div>

      {/* RIGHT PANEL (Mock) */}
      <div>
        <div className="rounded-2xl bg-white px-8 py-7 shadow-sm border border-[#E8E3DB]">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold">Activity & Impact (Mock)</h2>
            <div className="text-right">
              <p className="font-semibold text-sm">Rank #4</p>
              <p className="text-xs text-gray-500">Top donors this month</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Recent activity, contributions and auctions participated by {userData.name}.
          </p>

          {/* Recent Activity */}
          <h3 className="mt-6 mb-3 text-lg font-bold">Recent Activity (Mock)</h3>
          <div className="space-y-4">
            {activity.map((item, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl p-3 bg-[#FBFAF8] border">
                <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                <div>
                  <p className="text-sm font-semibold">{item.text}</p>
                  <p className="text-xs text-gray-500">{item.ago}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Auctions */}
          <h3 className="mt-10 mb-3 text-lg font-bold">Auctions (Mock)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {auctions.map((auc, i) => (
              <div key={i} className="rounded-xl border bg-[#FBFAF8] p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition">
                <div className="h-20 w-full bg-gray-200 rounded-xl" />
                <p className="mt-3 font-semibold text-sm">{auc.title}</p>
                <p className="text-xs text-gray-500 mt-1">{auc.price}</p>
              </div>
            ))}
          </div>

          {/* Recommended */}
          <h3 className="mt-10 mb-3 text-lg font-bold">Recommended Philanthropists (Mock)</h3>
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
          <h3 className="mt-10 mb-3 text-lg font-bold">Top Fans (Mock)</h3>
          <div className="space-y-3">
            {fans.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border p-3 bg-[#FBFAF8]">
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