import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { getSocketServer, emitAuctionEvent } from "@/lib/socket";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { trackAuctionActivity } from "@/lib/observability";
import { acquireAuctionLock, releaseAuctionLock } from "@/lib/auction-lock";

const actionSchema = z.object({
  action: z.enum(["create_fake_auction", "place_test_bid", "close_auction", "emit_test_event", "inspect_redis"]),
  auctionId: z.string().optional(),
  bidAmount: z.number().optional(),
  auctionType: z.enum(["charity", "artist", "celebrity", "collectible"]).optional(),
  ngoPartnerId: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await requireAdmin();
  const payload = await request.json();
  const parsed = actionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Bad Request", message: parsed.error.message }, { status: 400 });
  }

  const { action, auctionId, bidAmount, auctionType, ngoPartnerId } = parsed.data;
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  const adminId = new ObjectId(session.user.id);

  if (action === "inspect_redis") {
    const redisStatus = await import("@/lib/redis").then((mod) => mod.getRedisStatus());
    return NextResponse.json({ success: true, redisStatus });
  }

  if (action === "create_fake_auction") {
    const type = auctionType || "charity";
    if (type === "charity" && !ngoPartnerId) {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "NGO partner ID is required for charity auction tests." },
        { status: 400 }
      );
    }

    const newAuction = {
      title: `Test Auction ${Date.now()}`,
      description: `This is a backend-generated test auction for ${type}.`,
      category: type === "celebrity" ? "Entertainment" : "Philanthropy",
      auctionType: type,
      startingBid: 1000,
      currentHighBid: 1000,
      bid: "₹1,000",
      bids: 0,
      bidsHistory: [],
      createdBy: adminId,
      ngoPartnerId: ngoPartnerId ? new ObjectId(ngoPartnerId) : null,
      titleImage: null,
      createdAt: new Date(),
      closed: false,
    };

    const result = await db.collection("auctions").insertOne(newAuction);
    emitAuctionEvent(result.insertedId.toString(), "auction_created", {
      auctionId: result.insertedId.toString(),
      title: newAuction.title,
    });

    return NextResponse.json({ success: true, message: "Fake auction created", auctionId: result.insertedId.toString() });
  }

  if (action === "close_auction") {
    if (!auctionId) {
      return NextResponse.json({ success: false, error: "Bad Request", message: "auctionId is required." }, { status: 400 });
    }
    const auctionOid = new ObjectId(auctionId);
    const result = await db
      .collection("auctions")
      .findOneAndUpdate(
        { _id: auctionOid },
        { $set: { closed: true, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
    if (!result || !result.value) {
      return NextResponse.json({ success: false, error: "Not Found", message: "Auction not found." }, { status: 404 });
    }
    emitAuctionEvent(auctionId, "auction_ended", { auctionId });
    return NextResponse.json({ success: true, message: "Auction closed." });
  }

  if (action === "emit_test_event") {
    if (!auctionId) {
      return NextResponse.json({ success: false, error: "Bad Request", message: "auctionId is required." }, { status: 400 });
    }
    emitAuctionEvent(auctionId, "admin_event", {
      type: "test_event",
      auctionId,
      createdBy: session.user.name || "admin",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, message: "Test event emitted." });
  }

  if (action === "place_test_bid") {
    if (!auctionId || typeof bidAmount !== "number") {
      return NextResponse.json({ success: false, error: "Bad Request", message: "auctionId and bidAmount are required." }, { status: 400 });
    }

    const auctionOid = new ObjectId(auctionId);
    const auction = await db.collection("auctions").findOne({ _id: auctionOid });
    if (!auction) {
      return NextResponse.json({ success: false, error: "Not Found", message: "Auction not found." }, { status: 404 });
    }

    const lockToken = await acquireAuctionLock(auctionId, 5000);
    if (!lockToken) {
      return NextResponse.json({ success: false, error: "Too Many Requests", message: "Unable to acquire lock. Try again." }, { status: 429 });
    }

    try {
      const minBid = (auction.currentHighBid || auction.startingBid || 0) + 50;
      if (bidAmount < minBid) {
        return NextResponse.json(
          { success: false, error: "Bad Request", message: `Bid must be at least ₹${minBid.toLocaleString("en-IN")}` },
          { status: 400 }
        );
      }

      const bidEntry = {
        userId: adminId.toString(),
        userName: session.user.name || "Admin Tester",
        amount: bidAmount,
        timestamp: new Date().toISOString(),
      };

      const updated = await db.collection("auctions").findOneAndUpdate(
        {
          _id: auctionOid,
          currentHighBid: { $lt: bidAmount },
        },
        {
          $set: {
            currentHighBid: bidAmount,
            bid: `₹${bidAmount.toLocaleString("en-IN")}`,
            updatedAt: new Date(),
          },
          $push: { bidsHistory: bidEntry },
          $inc: { bids: 1 },
        },
        { returnDocument: "after" }
      );

      if (!updated.value) {
        return NextResponse.json({ success: false, error: "Conflict", message: "Test bid failed due to a stale price." }, { status: 409 });
      }

      emitAuctionEvent(auctionId, "bid_placed", {
        auctionId,
        bid: bidEntry,
        newHighBid: bidAmount,
      });

      trackAuctionActivity(auctionId, {
        type: "test_bid",
        bidAmount,
      });
      return NextResponse.json({ success: true, message: "Test bid placed.", auction: updated.value });
    } finally {
      await releaseAuctionLock(auctionId, lockToken);
    }
  }

  return NextResponse.json({ success: false, error: "Bad Request", message: "Unknown action." }, { status: 400 });
}
