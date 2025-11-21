// src/app/page.tsx
import TopPhilanthropists from "@/components/TopPhilanthropists";
import clientPromise from "@/lib/mongodb";
import { Document, ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AuctionCard from "@/components/AuctionCard";
import SearchBar from "@/components/SearchBar";

// Define the type for our auction data
interface Auction extends Document {
  _id: string;
  title: string;
  bid: string;
  bids: number;
  endDate: string;
  // --- ADDED IMAGE FIELD ---
  titleImage?: string | null;
  // -------------------------
}

// 1. Define the type for our philanthropist data
export interface Philanthropist {
  id: string;
  name: string;
  username: string;
  amount: number; // Total raised
  wishes: number; // Wishes fulfilled (auctions created)
}

// Function to fetch top auctions (MODIFIED to project image and remove mock)
async function getTopAuctions(): Promise<Auction[]> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const now = new Date().toISOString();

    const auctions = await db
      .collection("auctions")
      .find({ endDate: { $gt: now } }) // Only show auctions whose end date is in the future (LIVE auctions)
      // --- START FIX ---
      // Changed sort from { endDate: 1 } (ending soonest) to { currentHighBid: -1 } (highest value)
      .sort({ currentHighBid: -1 }) 
      // --- END FIX ---
      .limit(2)
      // Project the required fields. 
      .project({ _id: 1, title: 1, bid: 1, bids: 1, endDate: 1, titleImage: 1 }) 
      .toArray();

    return auctions.map((auction) => ({
      ...auction,
      _id: auction._id.toString(),
    })) as unknown as Auction[];
  } catch (error) {
    console.error("Failed to fetch top auctions:", error);
    return [];
  }
}

// Function to get the user's wishlist on the server (unchanged)
async function getWishlistedIds(userId: string | undefined): Promise<Set<string>> {
  if (!userId) {
    return new Set();
  }
  
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    const wishlistItems = await db.collection("wishlists")
      .find({ userId: new ObjectId(userId) })
      .project({ auctionId: 1 })
      .toArray();
      
    return new Set(wishlistItems.map(item => item.auctionId.toString()));
  } catch (error) {
    console.error("Failed to fetch wishlist:", error);
    return new Set();
  }
}

// 2. MODIFIED: Function to get registered celebrities with real stats
async function getRegisteredCelebs(): Promise<Philanthropist[]> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 1. Fetch all celebrity users
    const celebs = await db.collection("users")
      .find({ role: 'celebrity' })
      .limit(5)
      .project({ _id: 1, name: 1 })
      .toArray();
      
    const celebIds = celebs.map(c => c._id);

    // 2. Aggregate stats from auctions collection
    const stats = await db.collection("auctions").aggregate([
        { 
            // Only look at auctions created by the fetched celebrities
            $match: { createdBy: { $in: celebIds } }
        },
        { 
            $group: {
                _id: "$createdBy", // Group by the celebrity's ID
                totalRaised: { $sum: "$currentHighBid" }, // Sum total raised
                wishesFulfilled: { $sum: 1 }, // Count total auctions created
            }
        }
    ]).toArray();

    // 3. Map stats back to celebrity user data
    const statsMap = new Map(stats.map(s => [s._id.toString(), s]));

    // 4. Combine and format data
    const philanthropists: Philanthropist[] = celebs.map((user) => {
        const userStats = statsMap.get(user._id.toString());
        
        return {
            id: user._id.toString(),
            name: user.name,
            username: user.name.toLowerCase().replace(/\s+/g, ''), // Still mock username for linking
            amount: userStats?.totalRaised || 0, // Use real calculated value or 0
            wishes: userStats?.wishesFulfilled || 0, // Use real calculated value or 0
        };
    }).sort((a, b) => b.amount - a.amount); // Sort by amount raised to be "Top"

    return philanthropists;

  } catch (error) {
    console.error("Failed to fetch registered celebs:", error);
    return [];
  }
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string })?.id;
  
  // 3. Fetch all data in parallel
  const [topAuctions, wishlistedIds, philanthropists] = await Promise.all([
    getTopAuctions(),
    getWishlistedIds(userId),
    getRegisteredCelebs() // Call the MODIFIED function
  ]);

  return (
    <div className="pt-10 grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-10">
      
      {/* LEFT SECTION (Unchanged) */}
      <div>
        <h1 className="text-5xl font-extrabold leading-tight">
          Make Wishes Come True. <br />
          One Bid. One Act. One Impact.
        </h1>
        <p className="mt-3 text-lg text-[#6A6674]">
          Discover verified NGOs and meaningful auctions that change lives.
        </p>
        <SearchBar mode="global" />
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {[
            "Trending", "Art", "Experiences", "Merchandise",
            "Children", "Healthcare", "Education",
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white px-4 py-1.5 shadow-sm border border-[#E4E0DA]"
            >
              {tag}
            </span
          >
          ))}
        </div>
        <h2 className="mt-8 mb-3 text-2xl font-bold">Top Auctions</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {topAuctions.length > 0 ? (
            topAuctions.map((auction) => (
              <AuctionCard 
                key={auction._id}
                auction={auction} 
                isInitiallyWishlisted={wishlistedIds.has(auction._id)} 
              />
            ))
          ) : (
            <p className="text-gray-600 sm:col-span-2">
              No live auctions at the moment. Please check back soon!
            </p>
          )}
        </div>
        <h2 className="mt-10 text-xl font-bold">Featured NGO Partners</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#6A6674]">
          Famwish works with verified NGOs and organizations to ensure
          transparency and measurable impact for every auction.
        </p>
        <button className="mt-4 rounded-lg border px-4 py-2 text-sm hover:bg-white">
          View all NGOs →
        </button>
      </div>

      {/* 4. Pass the real philanthropist data to the component */}
      <TopPhilanthropists philanthropists={philanthropists} />
    </div>
  );
}