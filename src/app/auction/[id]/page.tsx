"use client";

import { useState, useEffect, use } from "react";
import RazorpayCheckout from "@/components/RazorpayCheckout";
import RazorpayFinalCheckout from "@/components/RazorpayFinalCheckout";
import { useSession } from "next-auth/react";

export default function LiveAuctionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const auctionId = resolvedParams.id;
  const { data: session } = useSession();

  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isKycVerified, setIsKycVerified] = useState(false);
  const [isKycLoading, setIsKycLoading] = useState(false);
  const [isEmdPaid, setIsEmdPaid] = useState(false);
  const [currentBid, setCurrentBid] = useState(0);
  const [timeLeft, setTimeLeft] = useState("Loading...");

  // Fetch auction data on mount
  useEffect(() => {
    async function fetchAuction() {
      try {
        const res = await fetch(`/api/auctions/${auctionId}`);
        if (!res.ok) throw new Error("Auction not found");
        const data = await res.json();
        setAuction(data);
        setCurrentBid(data.currentHighBid || data.startingBid || 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAuction();
  }, [auctionId]);

  // Timer logic
  useEffect(() => {
    if (!auction?.endDate) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(auction.endDate).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft("EXPIRED");
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  // Real-time Bidding Sync (Short-Polling for Serverless environments)
  useEffect(() => {
    if (!auctionId || timeLeft === "EXPIRED" || timeLeft === "Loading...") return;

    const pollInterval = setInterval(async () => {
      try {
        // Prevent aggressive caching so we get fresh bids
        const res = await fetch(`/api/auctions/${auctionId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          
          // Only update state if someone else placed a higher bid
          if (data.currentHighBid > currentBid) {
            setCurrentBid(data.currentHighBid);
            setAuction((prev: any) => ({
              ...prev,
              bidsHistory: data.bidsHistory,
              topBidderId: data.topBidderId,
              currentHighBid: data.currentHighBid,
            }));
          }
        }
      } catch (err) {
        console.error("Real-time sync error:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [auctionId, timeLeft, currentBid]);

  const handleEmdSuccess = () => {
    setIsEmdPaid(true);
  };

  const handleKycVerification = () => {
    setIsKycLoading(true);
    // Simulate API call to DigiLocker or Aadhaar API
    setTimeout(() => {
      setIsKycVerified(true);
      setIsKycLoading(false);
    }, 2000);
  };

  const handlePlaceBid = async () => {
    try {
      const defaultIncrement = Math.max(100, Math.round(currentBid * 0.05));
      const incrementAmount = auction?.bidIncrement || defaultIncrement;
      const bidAmount = currentBid + incrementAmount;
      
      const res = await fetch(`/api/auctions/${auctionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidAmount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setCurrentBid(bidAmount);
      // In Phase 2 this will be updated via WebSockets instead!
      setAuction(data.auction);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-lg">Loading Auction Room...</div>;
  if (error) return <div className="p-8 text-center text-red-500 text-lg">Error: {error}</div>;

  // Calculate Dynamic EMD based on tiers
  const basePrice = auction.startingBid || 0;
  let emdPercent = 0.15; // 15% for <= 10 Lakhs
  if (basePrice > 5000000) emdPercent = 0.05; // 5% for > 50 Lakhs
  else if (basePrice > 1000000) emdPercent = 0.10; // 10% for > 10 Lakhs up to 50 Lakhs
  
  const emdAmount = Math.round(basePrice * emdPercent);

  // Check if the current user is the creator
  const userId = (session?.user as any)?.id;
  const isCreator = auction.createdBy === userId;

  return (
    <div className="mx-auto max-w-[var(--max)] p-4 md:p-8">
      <div className="mb-6 text-sm font-semibold text-[var(--muted)]">
        <a href="/" className="hover:text-[var(--accent)]">Home</a> / Auctions / {auction.title}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        
        {/* LEFT COLUMN: Main Video/Image Feed */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-[var(--radius)] bg-black shadow-xl aspect-video flex items-center justify-center">
            {timeLeft !== "EXPIRED" && (
              <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-[#FF3B3B] px-3 py-1.5 text-xs font-extrabold text-white shadow-lg">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white"></span>
                LIVE
              </div>
            )}
            
            {auction.titleImage ? (
              <img src={auction.titleImage} alt={auction.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900"></div>
            )}
          </div>

          <div className="rounded-[var(--radius)] bg-[var(--card)] p-6 shadow-sm">
            <h1 className="text-2xl font-extrabold text-[var(--accent)] md:text-3xl">
              {auction.title}
            </h1>
            <p className="mt-2 text-[var(--muted)] whitespace-pre-wrap">
              {auction.description}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Bidding Engine */}
        <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius)] bg-[var(--card)] shadow-md">
          
          <div className="flex justify-between border-b border-gray-100 bg-[#fafafa] p-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Current Bid</div>
              <div className="mt-1 text-3xl font-extrabold text-[var(--accent)]">₹{currentBid.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Ends In</div>
              <div className="mt-1 text-xl font-bold text-[#FF3B3B]">{timeLeft}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 min-h-[300px]">
            {auction.bidsHistory && auction.bidsHistory.length > 0 ? (
              auction.bidsHistory.map((b: any, i: number) => (
                <div key={i} className="text-sm">
                  <span className="font-bold text-[var(--accent)]">{b.userName || "Anonymous"}</span> bid ₹{b.amount.toLocaleString()}
                </div>
              )).reverse()
            ) : (
              <div className="text-sm italic text-[var(--muted)]">No bids yet. Be the first!</div>
            )}
          </div>

          <div className="border-t border-gray-100 p-6 bg-white">
            {timeLeft === "EXPIRED" ? (
              <div className="text-center py-2">
                <div className="font-bold text-red-500 mb-2">This auction has ended.</div>
                {auction.topBidderId === userId ? (
                  <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-xl animate-fadeIn">
                    <h3 className="font-bold text-green-700 text-lg mb-2">🎉 You Won!</h3>
                    <p className="text-sm text-green-600 mb-4">
                      Congratulations! Please complete the final payment to claim your item and send the funds directly to the NGO.
                    </p>
                    <RazorpayFinalCheckout
                      auctionId={auctionId as string}
                      finalAmount={currentBid}
                      onSuccess={(txId) => {
                        alert("Escrow Payment Successful! Funds routed to NGO. Tx: " + txId);
                        window.location.reload();
                      }}
                    />
                  </div>
                ) : auction.topBidderId ? (
                  <div className="text-sm text-gray-500">The winning bid was ₹{currentBid.toLocaleString()}.</div>
                ) : (
                  <div className="text-sm text-gray-500">No bids were placed.</div>
                )}
              </div>
            ) : isCreator ? (
              <div className="text-center font-bold text-gray-500 py-4">You cannot bid on your own auction.</div>
            ) : !isKycVerified ? (
              <div className="animate-fadeIn rounded-xl border border-blue-100 bg-blue-50 p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-blue-900">Identity Verification Required</h3>
                <p className="mb-6 text-sm text-blue-700">
                  To maintain the integrity of our high-value auctions, Famwish requires a one-time KYC verification via DigiLocker / Aadhaar before you can participate.
                </p>
                <button 
                  onClick={handleKycVerification}
                  disabled={isKycLoading}
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 font-extrabold text-white transition-all hover:bg-blue-700 disabled:opacity-70"
                >
                  {isKycLoading ? "Connecting to DigiLocker..." : "Verify via DigiLocker (Mock MVP)"}
                </button>
              </div>
            ) : !isEmdPaid ? (
              <div className="animate-fadeIn">
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-center text-sm font-semibold text-green-700 border border-green-200">
                  ✅ KYC Verified Successfully
                </div>
                <p className="mb-4 text-center text-sm font-medium text-[var(--muted)]">
                  EMD Tier applied: {emdPercent * 100}% of base price. Refundable deposit required.
                </p>
                <RazorpayCheckout 
                  auctionId={auctionId} 
                  emdAmount={emdAmount} 
                  onSuccess={handleEmdSuccess} 
                />
              </div>
            ) : (
              <button 
                onClick={handlePlaceBid}
                className="w-full rounded-xl bg-purple-700 px-6 py-4 text-lg font-extrabold text-white transition-transform hover:scale-[1.02] hover:bg-purple-800 shadow-xl active:scale-[0.98]"
              >
                Place Bid (₹{(currentBid + (auction?.bidIncrement || Math.max(100, Math.round(currentBid * 0.05)))).toLocaleString()})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
