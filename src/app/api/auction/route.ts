// src/app/api/auctions/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Document } from "mongodb";

const DATABASE_NAME = process.env.MONGODB_DB;

// Defines the minimal structure of an auction for the list view
interface AuctionListItem extends Document {
    _id: string;
    title: string;
    bid: string;
    bids: number;
}

/**
 * GET: Fetch a list of all auctions for the main auction page.
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    // Fetch auctions, excluding the large bidsHistory array for better performance
    const auctions = await db
      .collection("auctions")
      .find({})
      .project({
        _id: 1,
        title: 1,
        bid: 1,
        bids: 1,
        createdAt: 1,
        // Optionally include these fields for sorting/filtering on the client side:
        currentHighBid: 1,
        endDate: 1,
      })
      .sort({ createdAt: -1 }) // Sort newest first
      .toArray();

    // Ensure _id is correctly cast to a string for the client-side interface
    const formattedAuctions: AuctionListItem[] = auctions.map((auction) => ({
      ...auction,
      _id: auction._id.toString(),
    })) as AuctionListItem[];


    return NextResponse.json(
      formattedAuctions,
      { status: 200 }
    );
  } catch (e) {
    console.error("Error fetching auctions:", e);
    return NextResponse.json(
      { error: "Failed to fetch auctions" },
      { status: 500 }
    );
  }
}

// POST: This is already handled by src/app/api/auctions/route.ts, 
// so we only need the GET here if the original file was overwritten.
// Assuming the original POST handling for creation is elsewhere or you only need GET here.
// If you only need GET, Next.js handles the POST implicitly if no POST is defined.