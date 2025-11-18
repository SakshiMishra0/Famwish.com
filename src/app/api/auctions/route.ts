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
    ngoPartnerId?: ObjectId; // Field for NGO ID association
    bidsHistory: any[]; 
    createdAt: Date;
    titleImage: string | null; 
}

/**
 * GET: Fetch a list of all auctions for the main auction page.
 * (Logic for GET route remains functional)
 */
export async function GET(request: NextRequest) { 
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("search");
    const createdBy = searchParams.get("createdBy");
    const ngoPartnerId = searchParams.get("ngoPartnerId"); 

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

    if (createdBy) { // Filter by createdBy if provided
        try {
            query.createdBy = new ObjectId(createdBy);
        } catch (e) {
            return NextResponse.json({ error: "Invalid createdBy user ID" }, { status: 400 });
        }
    }
    
    if (ngoPartnerId) { // Filter by ngoPartnerId if provided
        try {
            query.ngoPartnerId = new ObjectId(ngoPartnerId);
        } catch (e) {
            return NextResponse.json({ error: "Invalid ngoPartnerId ID" }, { status: 400 });
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
        createdAt: 1, 
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
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as { role: string }).role !== "celebrity") {
        return NextResponse.json({ error: "Unauthorized. Only celebrities can create auctions." }, { status: 403 });
    }

    try {
        // --- MODIFIED: Destructure ngoPartnerId from the body ---
        const { title, startingBid, category, description, endDate, titleImage, ngoPartnerId } = await request.json(); 

        if (!title || !startingBid || !endDate || !ngoPartnerId) {
            return NextResponse.json({ error: "Missing required fields: title, starting bid, end date, or NGO partner." }, { status: 400 });
        }
        
        const numericBid = Number(startingBid);
        if (isNaN(numericBid) || numericBid <= 0) {
            return NextResponse.json({ error: "Starting bid must be a positive number." }, { status: 400 });
        }
        
        // Validate ngoPartnerId as a valid ObjectId
        let ngoOid: ObjectId;
        try {
            ngoOid = new ObjectId(ngoPartnerId);
        } catch (e) {
            return NextResponse.json({ error: "Invalid NGO partner ID format." }, { status: 400 });
        }
        
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const userId = new ObjectId((session.user as { id: string }).id);
        
        const newAuction: Omit<AuctionDocument, 'bid'> & { bid: string } = {
            _id: new ObjectId(),
            title,
            startingBid: numericBid,
            currentHighBid: numericBid, 
            bid: `₹${numericBid.toLocaleString('en-IN')}`, 
            category: category || "Other",
            description: description || "",
            endDate: new Date(endDate).toISOString(),
            createdBy: userId,
            ngoPartnerId: ngoOid, // <--- SAVING THE NGO ID
            bids: 0,
            bidsHistory: [],
            createdAt: new Date(),
            titleImage: titleImage || null, 
        } as Omit<AuctionDocument, 'bid'> & { bid: string }; 

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