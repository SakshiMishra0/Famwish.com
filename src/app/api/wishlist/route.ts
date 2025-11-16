// src/app/api/wishlist/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const userId = (session.user as { id: string }).id;

    // Use an "aggregation pipeline" to join wishlists with auctions
    const wishlistItems = await db.collection("wishlists").aggregate([
      {
        // 1. Find wishlist items for the current user
        $match: {
          userId: new ObjectId(userId),
        },
      },
      {
        // 2. "Join" with the auctions collection
        $lookup: {
          from: "auctions",         // The collection to join
          localField: "auctionId",   // The field from 'wishlists'
          foreignField: "_id",       // The field from 'auctions'
          as: "auctionDetails",      // Call the new array 'auctionDetails'
        },
      },
      {
        // 3. Deconstruct the 'auctionDetails' array
        $unwind: "$auctionDetails"
      }
    ]).toArray();

    return NextResponse.json(wishlistItems);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}