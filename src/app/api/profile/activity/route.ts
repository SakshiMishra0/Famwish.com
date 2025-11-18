// src/app/api/profile/activity/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Db, MongoClient, Document } from "mongodb";

// --- Connection Helper (for robust connection management) ---
let cached: { client: MongoClient; db: Db } | undefined;

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached) return cached;
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!uri) throw new Error("MONGODB_URI environment variable is not set.");
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGODB_DB || "famwish";
  const db = client.db(dbName);
  cached = { client, db };
  return cached;
}
// ------------------------------------------------------------------

/**
 * GET /api/profile/activity
 * Fetches the last 5 bids placed by the authenticated user.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const userId = (session.user as { id: string }).id;
    const userOid = new ObjectId(userId);

    const pipeline: Document[] = [
      // 1. Match only bids placed by the current user
      { $match: { "bidsHistory.userId": userId } },
      // 2. Unwind the bidsHistory array
      { $unwind: "$bidsHistory" },
      // 3. Filter the unwound documents again to ensure we only keep the current user's bids
      { $match: { "bidsHistory.userId": userId } },
      // 4. Project the required fields from the bid and the auction
      {
        $project: {
          _id: 0,
          auctionId: { $toString: "$_id" },
          auctionTitle: "$title",
          bidAmount: "$bidsHistory.amount",
          timestamp: "$bidsHistory.timestamp",
          // Determine if this was the final (winning) bid (simplified check for topBidderId)
          isHighBid: { $eq: ["$topBidderId", userOid] } 
        }
      },
      // 5. Sort by timestamp descending (newest first)
      { $sort: { timestamp: -1 } },
      // 6. Limit to the latest 5 activities
      { $limit: 5 }
    ];

    const recentBids = await db.collection("auctions").aggregate(pipeline).toArray();
    
    const formattedActivity = recentBids.map(bid => ({
        type: "bid",
        ...bid,
    }));

    return NextResponse.json(formattedActivity, { status: 200 });

  } catch (e) {
    console.error("Failed to fetch user activity:", e);
    return NextResponse.json(
      { error: "Server error fetching activity" },
      { status: 500 }
    );
  }
}