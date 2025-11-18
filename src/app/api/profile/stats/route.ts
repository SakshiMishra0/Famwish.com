// src/app/api/profile/stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document, Db, MongoClient } from "mongodb";

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
 * GET /api/profile/stats
 * Fetches the current user's profile statistics (Total Raised, Wishes Fulfilled, NGOs Supported).
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as { id: string }).id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const userId = (session.user as { id: string }).id;
    const userIdString = userId; // Keep string ID for comparison in aggregation
    const userOid = new ObjectId(userId);

    // --- 1. Calculate Total Raised and Wishes Fulfilled (Celebrity Stats) ---
    const celebrityStats = await db.collection("auctions").aggregate([
      { $match: { createdBy: userOid } },
      { $group: {
          _id: null,
          totalRaised: { $sum: "$currentHighBid" },
          wishesFulfilled: { $sum: 1 }
      }}
    ]).toArray();

    const raised = celebrityStats[0]?.totalRaised || 0;
    const fulfilled = celebrityStats[0]?.wishesFulfilled || 0;

    // --- 2. Calculate Unique NGOs Supported (Bidder/Donor Stat) ---
    const ngoSupportedPipeline: Document[] = [
        // Find all auctions where the user has placed a bid AND the auction has an NGO partner
        { $match: { 
            "bidsHistory.userId": userIdString, 
            ngoPartnerId: { $exists: true, $ne: null } 
        }},
        // Group by the NGO partner ID (distinct count)
        { $group: {
            _id: "$ngoPartnerId"
        }},
        // Count the total number of unique groups (NGOs)
        { $count: "count" }
    ];

    const ngoCountResult = await db.collection("auctions").aggregate(ngoSupportedPipeline).toArray();
    const ngosSupported = ngoCountResult[0]?.count || 0;


    // --- 3. Return Combined Results ---
    return NextResponse.json({
        totalRaised: raised,
        wishesFulfilled: fulfilled,
        ngosSupported: ngosSupported, // <-- NEW STAT
    }, { status: 200 });

  } catch (e) {
    console.error("Failed to fetch user stats:", e);
    return NextResponse.json(
      { error: "Server error fetching user stats" },
      { status: 500 }
    );
  }
}