// src/app/api/auctions/route.ts
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";
import { Document, ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { emitAuctionEvent } from "@/lib/socket";

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
        const body = await request.json();
        const auctionSchema = z.object({
            title: z.string().min(1),
            startingBid: z.preprocess((value) => Number(value), z.number().positive()),
            category: z.string().optional().default("Other"),
            description: z.string().optional().default(""),
            endDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
              message: "Invalid end date.",
            }),
            titleImage: z.string().nullable().optional(),
            auctionType: z.enum(["charity", "artist", "celebrity", "collectible"]).default("charity"),
            ngoPartnerId: z.string().optional(),
        });
        const data = auctionSchema.parse(body);

        if (data.auctionType === "charity" && !data.ngoPartnerId) {
            return NextResponse.json({ error: "NGO partner ID is required for charity auctions." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const userId = new ObjectId((session.user as { id: string }).id);

        let ngoOid: ObjectId | null = null;
        if (data.ngoPartnerId) {
            try {
                ngoOid = new ObjectId(data.ngoPartnerId);
            } catch (error) {
                return NextResponse.json({ error: "Invalid NGO partner ID format." }, { status: 400 });
            }
        }

        const newAuction = {
            title: data.title,
            description: data.description,
            category: data.category,
            auctionType: data.auctionType,
            startingBid: data.startingBid,
            currentHighBid: data.startingBid,
            bid: `₹${data.startingBid.toLocaleString("en-IN")}`,
            endDate: new Date(data.endDate).toISOString(),
            createdBy: userId,
            ngoPartnerId: ngoOid,
            bids: 0,
            bidsHistory: [],
            createdAt: new Date(),
            titleImage: data.titleImage || null,
            closed: false,
        };

        const result = await db.collection("auctions").insertOne(newAuction);
        emitAuctionEvent(result.insertedId.toString(), "auction_created", {
          auctionId: result.insertedId.toString(),
          title: data.title,
          auctionType: data.auctionType,
        });

        return NextResponse.json(
            { message: "Auction created successfully", auctionId: result.insertedId.toString() },
            { status: 201 }
        );

    } catch (e: any) {
        console.error("Error creating auction:", e);
        return NextResponse.json(
            { error: e?.message || "Failed to create auction" },
            { status: 500 }
        );
    }
}