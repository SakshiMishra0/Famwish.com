"use client";

import { useState } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";

interface RazorpayFinalCheckoutProps {
  auctionId: string;
  finalAmount: number;
  onSuccess: (transactionId: string) => void;
}

export default function RazorpayFinalCheckout({ auctionId, finalAmount, onSuccess }: RazorpayFinalCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // 1. Ask our backend to create a Razorpay Order with Escrow/Route intent
      const orderRes = await fetch("/api/razorpay/create-final-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId, finalAmount }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create final order");
      }

      // 2. Initialize the Razorpay Checkout widget
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Famwish MVP",
        description: `Final Auction Payment & Escrow Settlement`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 3. The user paid successfully. Verify the signature and trigger the mock Escrow split!
          const verifyRes = await fetch("/api/razorpay/verify-final", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              auctionId,
              userId: (session?.user as any)?.id || "mock_user_id",
            }),
          });
          
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            onSuccess(response.razorpay_payment_id);
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        theme: {
          color: "#22163F", // Famwish primary accent color
        },
      };

      // @ts-ignore
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full rounded-xl bg-green-600 px-6 py-3 font-extrabold text-white transition-all hover:bg-green-700 shadow-md disabled:opacity-60"
      >
        {isLoading ? "Initiating Secure Escrow..." : `Proceed to Final Checkout (₹${finalAmount.toLocaleString()})`}
      </button>
    </>
  );
}
