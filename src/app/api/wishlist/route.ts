// src/app/api/wishlist/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET: Fetches the user's complete wishlist with joined auction details.
 */
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
      },
      { // <--- ADDED: Project only the required fields including titleImage
        $project: {
            _id: 1,
            userId: 1,
            auctionId: 1,
            notes: 1,
            auctionDetails: {
                _id: "$auctionDetails._id",
                title: "$auctionDetails.title",
                bid: "$auctionDetails.bid",
                bids: "$auctionDetails.bids",
                titleImage: "$auctionDetails.titleImage", // <--- Explicitly include the image
            }
        }
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

/**
 * POST: Adds an item to the user's wishlist.
 * (Logic remains unchanged)
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { auctionId } = await request.json();
    if (!auctionId) {
      return NextResponse.json({ error: "Missing auctionId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const userId = new ObjectId((session.user as { id: string }).id);

    // Check if it already exists
    const existing = await db.collection("wishlists").findOne({
      userId: userId,
      auctionId: new ObjectId(auctionId),
    });

    if (existing) {
      return NextResponse.json({ message: "Item already in wishlist" }, { status: 200 });
    }

    // Add new wishlist item
    const result = await db.collection("wishlists").insertOne({
      userId: userId,
      auctionId: new ObjectId(auctionId),
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Added to wishlist", id: result.insertedId }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}

/**
 * DELETE: Removes an item from the user's wishlist.
 * (Logic remains unchanged)
 */
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // We'll pass the auctionId in the request body for simplicity
    const { auctionId } = await request.json();
    if (!auctionId) {
      return NextResponse.json({ error: "Missing auctionId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const userId = new ObjectId((session.user as { id: string }).id);

    // Delete the item
    const result = await db.collection("wishlists").deleteOne({
      userId: userId,
      auctionId: new ObjectId(auctionId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found in wishlist" }, { status: 404 });
    }

    return NextResponse.json({ message: "Removed from wishlist" }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}