// src/app/profile/[id]/page.tsx
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";
import { notFound } from "next/navigation";
import Link from "next/link"; // <--- FIX: ADDED MISSING IMPORT

// --- New Interface for Auction List used as Fulfilled Wishes (unchanged) ---
interface AuctionList extends Document {
    _id: string;
    title: string;
    endDate: string; // Used to simulate fulfillment date
    bid: string;     // Added for live auctions list
    bids: number;    // Added for live auctions list
}
// -----------------------------------------------------------

// --- New Interface for Top Fan Data (unchanged) ---
interface TopFan {
    userId: string;
    name: string;
    points: number; // Total bid amount (points)
    bids: number;
}
// ------------------------------------

// --- New Interface for Philanthropists (unchanged) ---
export interface Philanthropist {
  id: string;
  name: string;
  username: string;
  amount: number; // Total raised
  wishes: number; // Wishes fulfilled (auctions created)
}
// ------------------------------------

// --- 1. Define Props (unchanged) ---
interface Props {
  params: {
    id: string | Promise<string>;
  };
}

// --- Data Fetching Function for User Details (Unchanged) ---
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
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      handle: user.email, 
      vip: user.role === 'celebrity',
      bio: "This is a real celebrity profile, loaded from the database. Bio coming soon!",
    };
  } catch (e) {
    console.error("Failed to fetch user data:", e);
    return null;
  }
}

// --- Data Fetching Function for User Stats (Unchanged) ---
async function getUserStats(id: string) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const stats = await db.collection("auctions").aggregate([
      {
        $match: { createdBy: new ObjectId(id) }
      },
      {
        $group: {
          _id: null,
          totalRaised: { $sum: "$currentHighBid" },
          wishesFulfilled: { $sum: 1 }
        }
      }
    ]).toArray();

    if (stats.length === 0) {
      return { totalRaised: 0, wishesFulfilled: 0 };
    }

    return stats[0];
  } catch (e) {
    console.error("Failed to fetch user stats:", e);
    return { totalRaised: 0, wishesFulfilled: 0 };
  }
}

// --- Data Fetching Function for Fulfilled Wishes (Auctions) (Unchanged) ---
async function getFulfilledWishes(id: string): Promise<AuctionList[]> {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        const auctions = await db.collection("auctions")
            .find(
                { 
                    createdBy: new ObjectId(id),
                    endDate: { $lt: new Date().toISOString() } // Auctions that have ended
                }
            )
            .sort({ endDate: -1 })
            .limit(3)
            .project({ _id: 1, title: 1, endDate: 1 })
            .toArray();

        return auctions.map(a => ({
            _id: a._id.toString(),
            title: a.title,
            endDate: a.endDate, 
            bid: '', 
            bids: 0,
        })) as AuctionList[];

    } catch (e) {
        console.error("Failed to fetch fulfilled wishes (auctions):", e);
        return [];
    }
}

// --- Data Fetching Function for Active Auctions (Unchanged) ---
async function getActiveAuctions(id: string): Promise<AuctionList[]> {
    const isDev = process.env.NODE_ENV === 'development';
    const baseUrl = process.env.NEXTAUTH_URL || (isDev ? 'http://localhost:3000' : null);
    
    if (!baseUrl) return [];

    const apiURL = `${baseUrl}/api/auctions?createdBy=${id}`; 
    
    try {
        const res = await fetch(apiURL, { cache: 'no-store' });
        if (!res.ok) {
            console.error(`Failed to fetch auctions for creator ${id}. Status: ${res.status}`);
            return [];
        }
        
        const data: AuctionList[] = await res.json();

        const now = new Date();
        const liveAuctions = data
            .filter(a => new Date(a.endDate) > now)
            .slice(0, 3);

        return liveAuctions;

    } catch (e) {
        console.error("Error fetching active auctions:", e);
        return [];
    }
}

// --- Data Fetching Function for Top Fans/Bidders (Unchanged) ---
async function getTopFans(celebId: string): Promise<TopFan[]> {
    const isDev = process.env.NODE_ENV === 'development';
    const baseUrl = process.env.NEXTAUTH_URL || (isDev ? 'http://localhost:3000' : null);
    
    if (!baseUrl) return [];

    const apiURL = `${baseUrl}/api/leaderboard/celeb?celebId=${celebId}&timeframe=all`; 
    
    try {
        const res = await fetch(apiURL, { cache: 'no-store' });
        if (!res.ok) {
            console.error(`Failed to fetch top fans for creator ${celebId}. Status: ${res.status}`);
            return [];
        }
        
        const data: TopFan[] = await res.json();
        return data.slice(0, 5); 
        
    } catch (e) {
        console.error("Error fetching top fans:", e);
        return [];
    }
}


// --- Function to get Recommended Celebrities (Unchanged) ---
async function getRecommendedCelebs(currentUserId: string): Promise<Philanthropist[]> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 1. Fetch all celebrity users *excluding* the current user
    const celebs = await db.collection("users")
      .find({ role: 'celebrity', _id: { $ne: new ObjectId(currentUserId) } }) // Exclude current user
      .limit(5)
      .project({ _id: 1, name: 1 })
      .toArray();
      
    const celebIds = celebs.map(c => c._id);

    // 2. Aggregate stats from auctions collection
    const stats = await db.collection("auctions").aggregate([
        { 
            $match: { createdBy: { $in: celebIds } }
        },
        { 
            $group: {
                _id: "$createdBy", 
                totalRaised: { $sum: "$currentHighBid" },
                wishesFulfilled: { $sum: 1 },
            }
        }
    ]).toArray();

    // 3. Map stats back to celebrity user data
    const statsMap = new Map(stats.map(s => [s._id.toString(), s]));

    // 4. Combine and format data
    const recommendedPhilanthropists: Philanthropist[] = celebs.map((user) => {
        const userStats = statsMap.get(user._id.toString());
        
        return {
            id: user._id.toString(),
            name: user.name,
            username: user.name.toLowerCase().replace(/\s+/g, ''),
            amount: userStats?.totalRaised || 0, 
            wishes: userStats?.wishesFulfilled || 0,
        };
    }).sort((a, b) => b.amount - a.amount)
      .slice(0, 3); // Limit to top 3 recommended

    return recommendedPhilanthropists;

  } catch (error) {
    console.error("Failed to fetch recommended celebs:", error);
    return [];
  }
}
// -----------------------------------------------------------------------------


// Helper to calculate time ago string (Unchanged)
function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)} days ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}


// --- The Async Page Component ---
export default async function ProfilePage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id as string;

  // 5. Fetch all needed data in parallel
  const [userData, userStats, fulfilledWishes, activeAuctions, topFans, recommendedCelebs] = await Promise.all([
    getUserData(id),
    getUserStats(id),
    getFulfilledWishes(id),
    getActiveAuctions(id),
    getTopFans(id),
    getRecommendedCelebs(id), 
  ]);

  if (!userData) {
    notFound();
  }

  // --- Mock Data (for remaining sections we haven't implemented yet) ---
  const activity = [
    { text: "Mock: Fulfilled: School Supplies", ago: "2 months ago" },
    { text: "Mock: Bid: $340 on Vintage Art", ago: "10 hours ago" },
  ];
  // --- End Mock Data ---


  // --- 7. Render the Page with Real Data ---
  return (
    <div className="pt-10 grid gap-8 md:grid-cols-[1.1fr_1.4fr]">
      
      {/* LEFT PANEL */}
      <div>
        {/* Profile Card - NOW REAL DATA (Unchanged) */}
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

          {/* Stats - NOW REAL DATA (Unchanged) */}
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
          </div>
        </div>

        {/* Wishes Fulfilled - REAL DATA LIST (Unchanged) */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm border border-[#E8E3DB]">
          <h2 className="text-lg font-bold">Wishes Fulfilled</h2>
          <div className="mt-4 space-y-4">
            {fulfilledWishes.length > 0 ? (
                fulfilledWishes.map((wish) => (
                  <div key={wish._id} className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-green-100 rounded-xl flex items-center justify-center">
                        <span className="text-green-600 text-xl">🎉</span>
                    </div>
                    <div>
                      <p className="font-semibold">{wish.title}</p>
                      <p className="text-xs text-gray-500" suppressHydrationWarning>
                        Fulfilled {timeAgo(wish.endDate)}
                      </p>
                    </div>
                  </div>
                ))
            ) : (
                <p className="text-sm text-gray-500">No wishes (auctions) fulfilled yet.</p>
            )}
          </div>
        </div>

        {/* Testimonials (Mock) */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm border border-[#E8E3DB]">
          <h2 className="text-lg font-bold">Testimonials (Mock)</h2>
          <p className="mt-3 text-sm">
            “Your support changed 12 students' lives.” — Roshni NGO
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div>
        <div className="rounded-2xl bg-white px-8 py-7 shadow-sm border border-[#E8E3DB]">
          <div className="flex justify-between items-start">
            {/* Mock Rank/Donors */}
            <h2 className="text-xl font-bold">Activity & Impact (Mock)</h2>
            <div className="text-right">
              <p className="font-semibold text-sm">Rank #4</p>
              <p className="text-xs text-gray-500">Top donors this month</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Recent activity, contributions and auctions hosted by {userData.name}.
          </p>

          {/* Recent Activity (Mock) */}
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

          {/* Auctions - REAL DATA LIST (Unchanged) */}
          <h3 className="mt-10 mb-3 text-lg font-bold">Live Auctions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {activeAuctions.length > 0 ? (
                activeAuctions.map((auc) => (
                    <Link 
                        key={auc._id} 
                        href={`/auction/${auc._id}`}
                        className="rounded-xl border bg-[#FBFAF8] p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition"
                    >
                        <div className="h-20 w-full bg-gray-200 rounded-xl flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-500">Item</span>
                        </div>
                        <p className="mt-3 font-semibold text-sm truncate">{auc.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {auc.bid || "No Bids"} · {auc.bids} bids
                        </p>
                    </Link>
                ))
            ) : (
                <p className="text-sm text-gray-500 sm:col-span-3">No live auctions right now.</p>
            )}
          </div>

          {/* Recommended Philanthropists - NOW REAL DATA LIST */}
          <h3 className="mt-10 mb-3 text-lg font-bold">Recommended Philanthropists</h3>
          <div className="flex flex-wrap gap-4">
            {recommendedCelebs.length > 0 ? (
                recommendedCelebs.map((p) => (
                    <div key={p.id} className="text-center text-sm">
                      <div className="h-12 w-12 bg-gray-300 rounded-full" />
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-gray-500">₹{p.amount.toLocaleString('en-IN')}</p>
                    </div>
                ))
            ) : (
                <p className="text-sm text-gray-500">No other celebrities registered yet.</p>
            )}
          </div>

          {/* Top Fans - REAL DATA LIST (Unchanged) */}
          <h3 className="mt-10 mb-3 text-lg font-bold">Top Fans</h3>
          <div className="space-y-3">
            {topFans.length > 0 ? (
                topFans.map((f, i) => (
                    <div key={f.userId} className="flex items-center justify-between rounded-xl border p-3 bg-[#FBFAF8]">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#D4A017]">#{i + 1}</span>
                        <div className="h-10 w-10 bg-gray-300 rounded-full" /> {/* Placeholder for fan pic */}
                        <div>
                          <p className="font-semibold">{f.name}</p>
                          <p className="text-xs text-gray-500">
                            {f.bids} bids · ₹{f.points.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <button className="px-3 py-1 text-xs border rounded-full hover:bg-white">
                        Follow
                      </button>
                    </div>
                ))
            ) : (
                <p className="text-sm text-gray-500">No fan data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}