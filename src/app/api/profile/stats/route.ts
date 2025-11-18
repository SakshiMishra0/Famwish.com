// src/app/api/profile/stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/profile/stats
 * Fetches the current user's profile statistics (Total Raised, Wishes Fulfilled).
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as { id: string }).id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const userId = (session.user as { id: string }).id;
    const userOid = new ObjectId(userId);

    // Use an aggregation pipeline to calculate stats
    const stats = await db.collection("auctions").aggregate([
      {
        // 1. Match auctions created by the current user
        $match: { createdBy: userOid }
      },
      {
        // 2. Group them to calculate the totals
        $group: {
          _id: null, // Group all found documents into one
          // Sum the current high bid for "Total Raised"
          totalRaised: { $sum: "$currentHighBid" }, 
          // Count the number of auctions created for "Wishes Fulfilled"
          wishesFulfilled: { $sum: 1 } 
        }
      }
    ]).toArray();

    // If no auctions, return zeros
    if (stats.length === 0) {
      return NextResponse.json({ totalRaised: 0, wishesFulfilled: 0 }, { status: 200 });
    }

    // Return the calculated stats
    // We only need to return totalRaised and wishesFulfilled
    return NextResponse.json({
        totalRaised: stats[0].totalRaised || 0,
        wishesFulfilled: stats[0].wishesFulfilled || 0,
    }, { status: 200 });

  } catch (e) {
    console.error("Failed to fetch user stats:", e);
    return NextResponse.json(
      { error: "Server error fetching user stats" },
      { status: 500 }
    );
  }
}