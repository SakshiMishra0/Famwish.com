// src/app/api/leaderboard/global/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Document } from "mongodb";

/**
 * GET: Fetch the global leaderboard.
 * Aggregates all bids from the 'bidsHistory' in all auctions.
 * Groups them by user and sums their total bid amount.
 */
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "all";

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

    // Unwind the bidsHistory array
    pipeline.push({ $unwind: "$bidsHistory" });

    // Filter by date if not 'all'
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
        points: { $sum: "$bidsHistory.amount" }, // Sum their total bid amount
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
        wishes: 0, // We don't track this yet, so default to 0
    }));

    return NextResponse.json(formattedLeaderboard, { status: 200 });
  } catch (e) {
    console.error("Error fetching global leaderboard:", e);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}