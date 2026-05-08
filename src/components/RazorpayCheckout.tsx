"use client";

import { useState } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";

interface RazorpayCheckoutProps {
  auctionId: string;
  emdAmount: number;
  onSuccess: () => void;
}

export default function RazorpayCheckout({ auctionId, emdAmount, onSuccess }: RazorpayCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // 1. Ask our backend to create a Razorpay Order
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId, emdAmount }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // 2. Initialize the Razorpay Checkout widget
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Make sure to add this to .env.local
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Famwish",
        description: `Earnest Money Deposit (EMD) for Auction`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 3. The user paid successfully. Now verify the signature on our backend!
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              auctionId,
              // Uses actual logged-in user's ID, fallback to mock id if missing for some reason
              userId: (session?.user as any)?.id || "000000000000000000000000", 
            }),
          });
          
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            onSuccess(); // Unlocks the "Place Bid" UI in the parent component
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        theme: {
          color: "#22163F", // Famwish primary accent color
        },
      };

      // @ts-ignore - Razorpay is attached to the window object by the script
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        alert(`Payment Failed: ${response.error.description}`);
      });
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Load the Razorpay SDK */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full rounded-xl bg-[var(--gold)] px-6 py-3 font-extrabold text-[var(--accent)] transition-all hover:brightness-110 disabled:opacity-60 shadow-md"
      >
        {isLoading ? "Processing Securely..." : `Pay ₹${emdAmount} EMD to Bid`}
      </button>
    </>
  );
}