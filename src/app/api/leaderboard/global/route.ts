// src/app/api/leaderboard/global/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Document } from "mongodb";

/**
 * GET: Fetch the global leaderboard.
 * Aggregates auctions won by users.
 * SORTS by AUCTIONS WON (highest number of topBidderId occurrences in completed auctions).
 */
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "all";

    // --- 1. Set Date Range & Match Ended Auctions ---
    let dateMatch: Document = {};
    const now = new Date();
    // Only count auctions that have ended
    dateMatch.endDate = { $lte: now.toISOString() }; 

    if (timeframe === "week") {
      const startDate = new Date(now.setDate(now.getDate() - 7));
      dateMatch.endDate.$gte = startDate.toISOString();
    } else if (timeframe === "month") {
      const startDate = new Date(now.setMonth(now.getMonth() - 1));
      dateMatch.endDate.$gte = startDate.toISOString();
    } else if (timeframe === "year") {
      const startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      dateMatch.endDate.$gte = startDate.toISOString();
    }

    // --- 2. Build Aggregation Pipeline ---
    const pipeline: Document[] = [];

    // Filter only completed auctions that have a winner
    pipeline.push({ 
        $match: {
            topBidderId: { $exists: true, $ne: null },
            ...dateMatch
        } 
    });

    // Group by the winner (topBidderId)
    pipeline.push({
      $group: {
        _id: "$topBidderId", // Group by the user's ID who won the auction
        auctionsWon: { $sum: 1 }, // Count the number of auctions won
      },
    });

    // 3. Sort by auctions won descending (THE NEW REQUIREMENT)
    pipeline.push({ $sort: { auctionsWon: -1 } });

    // Limit to top 50
    pipeline.push({ $limit: 50 });
    
    // 4. Join with users collection to get the winner's name
    pipeline.push({
        $lookup: {
          from: "users",
          localField: "_id", 
          foreignField: "_id", 
          as: "userDetails"
        }
    });
    
    // Deconstruct and filter out users not found 
    pipeline.push({ $unwind: "$userDetails" });

    // 5. Final Project stage (Mocking points/bids for front-end compatibility)
    pipeline.push({
        $project: {
            id: { $toString: "$_id" }, 
            name: "$userDetails.name",
            // Mock points/bids based on wins
            points: { $multiply: ["$auctionsWon", 1000] }, 
            bids: { $multiply: ["$auctionsWon", 5] }, 
            wishes: 0, 
            auctionsWon: "$auctionsWon", // Keep the key for clarity
        }
    });
    
    const leaderboard = await db
      .collection("auctions")
      .aggregate(pipeline)
      .toArray();

    // Format the data to match the 'Fan' interface
    const formattedLeaderboard = leaderboard.map(user => ({
        id: user.id, 
        name: user.name,
        points: user.points, 
        bids: user.bids, 
        wishes: user.wishes,
        // The auctionsWon metric is now the primary ranking factor
        auctionsWon: user.auctionsWon, 
    }));

    return NextResponse.json(formattedLeaderboard, { status: 200 });
  } catch (e) {
    console.error("Error fetching global leaderboard (wins sorted):", e);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}