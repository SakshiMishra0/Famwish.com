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
      userId // In a complete app, this should securely come from the NextAuth session
    } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET || '';

    // 1. Generate our own signature using the secret to verify authenticity
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // 2. Compare signatures
    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 3. Signature is valid. Update MongoDB to unlock bidding for this user.
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Helper to safely cast or fallback to string
    const safeObjectId = (id: string) => {
      try {
        return ObjectId.isValid(id) ? new ObjectId(id) : id;
      } catch {
        return id;
      }
    };

    // Create or update an EMD record linking the user to the auction
    await db.collection("emds").updateOne(
      { 
        auctionId: safeObjectId(auctionId), 
        userId: safeObjectId(userId) 
      },
      {
        $set: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          status: "HELD_IN_ESCROW", // This indicates the money is safely held
          verifiedAt: new Date()
        }
      },
      { upsert: true } // Creates the document if it doesn't exist
    );

    return NextResponse.json({ success: true, message: "EMD payment verified and bidding unlocked" });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}