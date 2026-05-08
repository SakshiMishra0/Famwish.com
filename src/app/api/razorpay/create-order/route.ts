import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Initialize Razorpay instance securely
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: Request) {
  // DEBUG: Check if Next.js is actually loading your .env.local file
  console.log("🔑 Keys loaded in Next.js?", { hasId: !!process.env.RAZORPAY_KEY_ID, hasSecret: !!process.env.RAZORPAY_KEY_SECRET });

  try {
    const body = await request.json();
    const { auctionId, emdAmount } = body; // emdAmount should be passed in INR

    if (!auctionId || !emdAmount) {
      return NextResponse.json({ error: "Missing auctionId or emdAmount" }, { status: 400 });
    }

    // Razorpay expects the amount in the smallest currency sub-unit (paise for INR)
    let amountInPaise = Math.round(emdAmount * 100);

    // MOCK BYPASS: Razorpay Test Mode often limits transactions to ₹50,000.
    // If the amount is higher, we cap it for the Razorpay order so the demo doesn't crash.
    const TEST_LIMIT_PAISE = 40000 * 100; 
    if (amountInPaise > TEST_LIMIT_PAISE) {
        amountInPaise = TEST_LIMIT_PAISE;
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      // Razorpay receipt length must be <= 40 chars.
      receipt: `emd_${auctionId.slice(-8)}_${Date.now()}`,
      // Note: For a full Escrow/Route implementation, you would pass transfer account details here
      // based on Razorpay's documentation for holding funds.
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
    
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}