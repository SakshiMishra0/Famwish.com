// src/app/api/ngo/[id]/donors/route.ts
import { NextResponse, NextRequest } from "next/server";
import { MongoClient, ObjectId, Db, Document } from "mongodb";

/**
 * Cached Mongo client for Next.js runtime to avoid connection explosion.
 */
let cached: { client: MongoClient; db: Db } | undefined;

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached) return cached;

  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set.");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGODB_DB || "famwish";
  const db = client.db(dbName);

  cached = { client, db };
  return cached;
}

/**
 * Safely convert string id to ObjectId. Returns null if invalid.
 */
function toObjectId(id?: string): ObjectId | null {
  if (!id) return null;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

/** GET /api/ngo/[id]/donors */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { db } = await connectToDatabase();
    const resolvedParams = await context.params;
    const ngoId = resolvedParams.id;
    const ngoOid = toObjectId(ngoId);

    if (!ngoOid) {
      return NextResponse.json({ error: "Invalid NGO ID" }, { status: 400 });
    }

    const pipeline: Document[] = [
      // 1. Match auctions associated with this NGO (using ngoPartnerId field)
      { $match: { ngoPartnerId: ngoOid } },
      // 2. Unwind the bids history to treat each bid as a separate document
      { $unwind: "$bidsHistory" },
      // 3. Group by the user who placed the bid (the donor)
      {
        $group: {
          _id: "$bidsHistory.userId", 
          totalDonated: { $sum: "$bidsHistory.amount" },
          bidsCount: { $sum: 1 }
        },
      },
      // 4. Sort by the total amount donated
      { $sort: { totalDonated: -1 } },
      // 5. Limit to the top 10 donors
      { $limit: 10 },
      // 6. Join with users collection to get the donor's name and picture
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "donorDetails",
        },
      },
      // 7. Deconstruct the donorDetails array
      { $unwind: "$donorDetails" },
      // 8. Project the final shape
      {
        $project: {
          _id: 0,
          userId: { $toString: "$_id" }, // Convert ObjectId to string for client
          donor: "$donorDetails.name",
          amt: "$totalDonated",
          profilePicture: { $ifNull: ["$donorDetails.profilePicture", null] },
        }
      }
    ];

    const donors = await db.collection("auctions").aggregate(pipeline).toArray();

    return NextResponse.json(donors, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/ngo/[id]/donors error:", err);
    return NextResponse.json({ error: err?.message || "Server error fetching donors" }, { status: 500 });
  }
}