// src/app/page.tsx
import TopPhilanthropists from "@/components/TopPhilanthropists";
import clientPromise from "@/lib/mongodb";
import { Document, ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next"; // 1. Import server session
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // 2. Import auth options
import AuctionCard from "@/components/AuctionCard"; // 3. Import our new component

// Define the type for our auction data
interface Auction extends Document {
  _id: string;
  title: string;
  bid: string;
  bids: number;
  endDate: string;
}

// Function to fetch top auctions (unchanged)
async function getTopAuctions(): Promise<Auction[]> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const now = new Date().toISOString();

    const auctions = await db
      .collection("auctions")
      .find({ endDate: { $gt: now } })
      .sort({ endDate: 1 })
      .limit(2)
      .project({ _id: 1, title: 1, bid: 1, bids: 1, endDate: 1 })
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

// 4. Create a function to get the user's wishlist on the server
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

export default async function HomePage() {
  // 5. Fetch both auctions and the user's session
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string })?.id;
  
  // 6. Fetch auctions and wishlist data in parallel
  const [topAuctions, wishlistedIds] = await Promise.all([
    getTopAuctions(),
    getWishlistedIds(userId)
  ]);

  return (
    <div className="grid grid-cols-1 gap-10 pt-10 md:grid-cols-[1.6fr_1fr]">
      
      {/* LEFT SECTION (Unchanged) */}
      <div>
        {/* HERO */}
        <h1 className="text-5xl font-extrabold leading-tight">
          Make Wishes Come True. <br />
          One Bid. One Act. One Impact.
        </h1>
        <p className="mt-3 text-lg text-[#6A6674]">
          Discover verified NGOs and meaningful auctions that change lives.
        </p>
        {/* SEARCH */}
        <div className="mt-6 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search auctions, NGOs, causes..."
            className="w-full rounded-xl border border-[#D5D0C7] bg-white px-4 py-3 text-sm shadow-sm"
          />
          <button className="rounded-xl bg-[#1E1635] px-5 py-3 text-sm font-semibold text-white hover:bg-[#463985]">
            Explore
          </button>
        </div>
        {/* CATEGORIES */}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {[
            "Trending",
            "Art",
            "Experiences",
            "Merchandise",
            "Children",
            "Healthcare",
            "Education",
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white px-4 py-1.5 shadow-sm border border-[#E4E0DA]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* SECTION TITLE */}
        <h2 className="mt-8 mb-3 text-2xl font-bold">Top Auctions</h2>

        {/* 7. DYNAMIC AUCTIONS GRID (Updated) */}
        <div className="grid gap-5 sm:grid-cols-2">
          {topAuctions.length > 0 ? (
            topAuctions.map((auction) => (
              // 8. Use the new AuctionCard component
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

        {/* NGOs SECTION (Unchanged) */}
        <h2 className="mt-10 text-xl font-bold">Featured NGO Partners</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#6A6674]">
          Famwish works with verified NGOs and organizations to ensure
          transparency and measurable impact for every auction.
        </p>
        <button className="mt-4 rounded-lg border px-4 py-2 text-sm hover:bg-white">
          View all NGOs →
        </button>
      </div>

      {/* RIGHT SIDEBAR (Unchanged) */}
      <TopPhilanthropists />
    </div>
  );
}