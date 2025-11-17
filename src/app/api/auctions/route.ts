// src/app/api/auctions/route.ts
import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Document, ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const DATABASE_NAME = process.env.MONGODB_DB;

interface AuctionDocument extends Document {
    _id: ObjectId;
    title: string;
    bid: string;
    bids: number;
    currentHighBid: number;
    startingBid: number;
    endDate: string;
    category: string;
    description: string;
    createdBy: ObjectId;
    bidsHistory: any[]; 
    createdAt: Date;
    titleImage: string | null; // <-- ADDED: Auction image URL/Base64
}

/**
 * GET: Fetch a list of all auctions for the main auction page.
 * NOW UPDATED to handle search queries AND createdBy user ID filter.
 */
export async function GET(request: NextRequest) { 
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("search");
    const createdBy = searchParams.get("createdBy"); // <--- ADDED: Get createdBy filter

    // 4. Build the MongoDB query
    const query: Document = {};
    
    // --- START: Filtering Logic ---
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: "i" } }, 
        { description: { $regex: searchQuery, $options: "i" } }, 
        { category: { $regex: searchQuery, $options: "i" } } 
      ];
    }

    if (createdBy) { // <--- ADDED: Filter by createdBy if provided
        try {
            query.createdBy = new ObjectId(createdBy);
        } catch (e) {
            // In a real app, this should log an error, but here we return a 400
            return NextResponse.json({ error: "Invalid createdBy user ID" }, { status: 400 });
        }
    }
    // --- END: Filtering Logic ---

    // 5. Use the query in the .find() method
    const auctions = await db
      .collection("auctions")
      .find(query) 
      .project({
        _id: 1,
        title: 1,
        bid: 1,
        bids: 1,
        currentHighBid: 1,
        endDate: 1,
        titleImage: 1, 
        createdAt: 1, // <--- ADDED: Include creation date to determine status
      })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedAuctions = auctions.map((auction) => ({
      ...auction,
      _id: auction._id.toString(),
      createdBy: auction.createdBy?.toString(),
    }));

    return NextResponse.json(formattedAuctions, { status: 200 });
  } catch (e) {
    console.error("Error fetching auctions list:", e);
    return NextResponse.json(
      { error: "Failed to fetch auctions" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new auction.
 * (Logic remains unchanged)
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as { role: string }).role !== "celebrity") {
        return NextResponse.json({ error: "Unauthorized. Only celebrities can create auctions." }, { status: 403 });
    }

    try {
        const { title, startingBid, category, description, endDate, titleImage } = await request.json(); // <--- MODIFIED: Destructure titleImage

        if (!title || !startingBid || !endDate) {
            return NextResponse.json({ error: "Missing required fields: title, starting bid, or end date." }, { status: 400 });
        }
        
        const numericBid = Number(startingBid);
        if (isNaN(numericBid) || numericBid <= 0) {
            return NextResponse.json({ error: "Starting bid must be a positive number." }, { status: 400 });
        }
        
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const userId = new ObjectId((session.user as { id: string }).id);
        
        const newAuction: AuctionDocument = {
            _id: new ObjectId(),
            title,
            startingBid: numericBid,
            currentHighBid: numericBid, 
            bid: `₹${numericBid.toLocaleString('en-IN')}`, 
            category: category || "Other",
            description: description || "",
            endDate: new Date(endDate).toISOString(),
            createdBy: userId,
            bids: 0,
            bidsHistory: [],
            createdAt: new Date(),
            titleImage: titleImage || null, // <--- ADDED: Store the image data (Base64)
        };

        const result = await db.collection("auctions").insertOne(newAuction);

        return NextResponse.json(
            { message: "Auction created successfully", auctionId: result.insertedId.toString() },
            { status: 201 }
        );

    } catch (e) {
        console.error("Error creating auction:", e);
        return NextResponse.json(
            { error: "Failed to create auction" },
            { status: 500 }
        );
    }
}