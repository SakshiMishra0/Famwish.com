// src/app/api/leaderboard/celeb/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Document, ObjectId } from "mongodb";

/**
 * GET: Fetch the fan leaderboard for a specific celebrity.
 * Aggregates all bids from auctions created by the celebrity.
 */
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "all";
    const celebId = searchParams.get("celebId"); // Required celeb ID

    if (!celebId) {
        return NextResponse.json({ error: "Missing celebrity ID" }, { status: 400 });
    }

    let celebOid: ObjectId;
    try {
        celebOid = new ObjectId(celebId);
    } catch (e) {
        return NextResponse.json({ error: "Invalid celebrity ID format" }, { status: 400 });
    }

    // --- 1. Set Date Range ---
    let startDate: Date | null = null;
    const now = new Date();

    if (timeframe === "week") {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (timeframe === "month") {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    } else if (timeframe === "year") {
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }

    // --- 2. Build Aggregation Pipeline ---
    const pipeline: Document[] = [];

    // Filter by celebrity's created auctions first
    pipeline.push({
      $match: {
        createdBy: celebOid,
      },
    });

    // Unwind the bidsHistory array
    pipeline.push({ $unwind: "$bidsHistory" });

    // Filter bids by date if not 'all'
    if (startDate) {
      pipeline.push({
        $match: {
          "bidsHistory.timestamp": { $gte: startDate.toISOString() },
        },
      });
    }

    // Group by user
    pipeline.push({
      $group: {
        _id: "$bidsHistory.userId", // Group by the user's ID
        name: { $first: "$bidsHistory.userName" }, // Get their name
        points: { $sum: "$bidsHistory.amount" }, // Sum their total bid amount (points)
        bids: { $sum: 1 }, // Count the number of bids they've placed
      },
    });

    // Sort by total points (amount) descending
    pipeline.push({ $sort: { points: -1 } });

    // Limit to top 50
    pipeline.push({ $limit: 50 });

    const leaderboard = await db
      .collection("auctions")
      .aggregate(pipeline)
      .toArray();

    // Format the data to match the 'Fan' interface
    const formattedLeaderboard = leaderboard.map(user => ({
        id: user._id.toString(), // Use the user ID as the 'id'
        name: user.name,
        points: user.points,
        bids: user.bids,
        wishes: Math.floor(Math.random() * 5), // Mock wishes, as this data isn't in bidsHistory
    }));

    return NextResponse.json(formattedLeaderboard, { status: 200 });
  } catch (e) {
    console.error("Error fetching celebrity leaderboard:", e);
    return NextResponse.json(
      { error: "Failed to fetch celebrity leaderboard" },
      { status: 500 }
    );
  }
}