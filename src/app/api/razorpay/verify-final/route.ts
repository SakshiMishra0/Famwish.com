import { NextResponse } from 'next/server';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      auctionId,
      userId
    } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET || '';

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const safeObjectId = (id: string) => {
      try { return ObjectId.isValid(id) ? new ObjectId(id) : id; } 
      catch { return id; }
    };

    const parsedAuctionId = safeObjectId(auctionId);
    
    // Create a ledger entry for the Escrow Settlement
    await db.collection("transactions").insertOne({
      auctionId: parsedAuctionId,
      winnerId: safeObjectId(userId),
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: "SETTLED_VIA_ESCROW",
      escrowSplit: {
          ngoSharePercent: 90,
          platformFeePercent: 10,
          status: "TRANSFERRED_TO_NGO_LINKED_ACCOUNT" // Mock status for MVP
      },
      verifiedAt: new Date()
    });

    // Mark the auction as paid/settled
    await db.collection("auctions").updateOne(
        { _id: parsedAuctionId as any },
        { $set: { status: "SETTLED" } }
    );

    return NextResponse.json({ success: true, message: "Final payment verified and funds routed to NGO" });
  } catch (error) {
    console.error("Error verifying final Razorpay payment:", error);
    return NextResponse.json({ error: "Failed to verify final payment" }, { status: 500 });
  }
}
