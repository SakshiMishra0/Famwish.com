import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import clientPromise from "@/lib/mongodb";
import { getRoomCount } from "@/lib/socket";
import { isAuctionLocked } from "@/lib/auction-lock";

export async function GET() {
  await requireAdmin();

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const auctions = await db
    .collection("auctions")
    .find({})
    .sort({ createdAt: -1 })
    .limit(30)
    .toArray();

  const rows = await Promise.all(
    auctions.map(async (auction) => ({
      auctionId: auction._id.toString(),
      title: auction.title,
      currentHighBid: auction.currentHighBid || auction.startingBid || 0,
      topBidder:
        auction.bidsHistory?.[auction.bidsHistory.length - 1]?.userName || "N/A",
      viewers: getRoomCount(`auction:${auction._id.toString()}`),
      lockStatus: (await isAuctionLocked(auction._id.toString())) === true ? "locked" : "open",
      auctionType: auction.auctionType || "charity",
      ngoPartnerId: auction.ngoPartnerId?.toString() ?? null,
    }))
  );

  return NextResponse.json(rows);
}
