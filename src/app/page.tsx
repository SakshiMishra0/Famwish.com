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

// 1. Define the type for our philanthropist data (unchanged)
export interface Philanthropist {
  id: string;
  name: string;
  username: string;
  amount: number;
  wishes: number;
}

// Function to fetch top auctions (MODIFIED to project image and remove mock)
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
      // Project the required fields. 
      .project({ _id: 1, title: 1, bid: 1, bids: 1, endDate: 1, titleImage: 1 }) // <--- MODIFIED: Added titleImage to projection
      .toArray();

    return auctions.map((auction) => ({
      ...auction,
      _id: auction._id.toString(),
      // --- MOCK IMAGE URL REMOVED ---
      // titleImage: "https://via.placeholder.com/300x200?text=Top+Auction+Image",
      // ----------------------------
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

// 2. NEW: Function to get registered celebrities (unchanged)
async function getRegisteredCelebs(): Promise<Philanthropist[]> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const celebs = await db.collection("users")
      .find({ role: 'celebrity' })
      .limit(5) // Get the top 5
      .project({ _id: 1, name: 1 })
      .toArray();

    // Map DB data to the format our component expects
    // NOTE: 'amount' and 'wishes' are mocked here, as they
    // aren't in the 'users' table. A full implementation
    // would require a complex aggregation to calculate this.
    return celebs.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      // Create a mock username from the name for the profile link
      username: user.name.toLowerCase().replace(/\s+/g, ''),
      // Add mock data to keep the UI consistent
      amount: Math.floor(Math.random() * 20000) + 5000,
      wishes: Math.floor(Math.random() * 10) + 1,
    }));

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
    getRegisteredCelebs() // Call the new function
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
        <SearchBar />
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