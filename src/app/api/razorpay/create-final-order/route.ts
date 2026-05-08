import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { auctionId, finalAmount } = body;

    if (!auctionId || !finalAmount) {
      return NextResponse.json({ error: "Missing auctionId or finalAmount" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    // Validate auction
    const safeObjectId = ObjectId.isValid(auctionId) ? new ObjectId(auctionId) : auctionId;
    const auction = await db.collection("auctions").findOne({ _id: safeObjectId as any });
    
    if (!auction) {
       return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    let amountInPaise = Math.round(finalAmount * 100);

    // MOCK BYPASS: Razorpay Test Mode often limits transactions to ₹50,000.
    // If the amount is higher, we cap it for the Razorpay order so the demo doesn't crash.
    const TEST_LIMIT_PAISE = 40000 * 100; 
    if (amountInPaise > TEST_LIMIT_PAISE) {
        amountInPaise = TEST_LIMIT_PAISE;
    }

    // --- RBI COMPLIANCE MVP MOCK LOGIC ---
    // In production, we fetch the NGO's Linked Account ID from the database:
    // const ngoAccountId = auction.ngoLinkedAccountId; // e.g. 'acc_Gstz10XXXX'
    //
    // Then we pass the transfers array to tell Razorpay to route funds automatically:
    // const transfers = [
    //   {
    //     account: ngoAccountId, 
    //     amount: Math.round(amountInPaise * 0.90), // 90% goes straight to the NGO
    //     currency: "INR",
    //     notes: { type: "NGO_SETTLEMENT", auction: auctionId }
    //   }
    // ];
    //
    // For this MVP, we omit the transfers array so the test API key works without real linked accounts,
    // but the architecture remains the exact same.
    // -------------------------------------

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `final_${auctionId.toString().slice(-8)}_${Date.now()}`,
      // transfers: transfers // <-- Uncomment for production
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
    
  } catch (error) {
    console.error("Error creating final Razorpay order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
