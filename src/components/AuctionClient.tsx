// src/components/AuctionClient.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react"; // 1. Import useSession
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import { ArrowLeft, Clock, Zap, MessageCircle, TrendingUp, Hand, Heart } from "lucide-react";

// Register Chart.js components
Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip);

// --- Component for non-blocking UI messages (replaces alert) ---
const MessageModal = ({ message, onClose }: { message: string; onClose: () => void }) => {
  // (Component unchanged)
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center animate-slideUp">
        <p className="mb-4 text-lg font-semibold text-gray-800">{message}</p>
        <button onClick={onClose} className="bg-[#22163F] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#463985] transition">OK</button>
      </div>
    </div>
  );
};

// --- New Interfaces for Backend Data ---
interface BidHistoryItem {
    userId: string;
    userName: string;
    amount: number;
    timestamp: string;
}

interface AuctionDetails {
    _id: string;
    title: string;
    description: string;
    category: string;
    currentHighBid: number;
    startingBid: number;
    bids: number;
    topBidderId?: string;
    endDate: string;
    bidsHistory: BidHistoryItem[];
    // isWishlisted: boolean; // This was a placeholder, we'll manage it with state
}

interface Props {
    auctionId: string;
}

// --- Main Client Component ---
export default function AuctionClient({ auctionId }: Props) {
  const { data: session } = useSession(); // 2. Get user session

  // State for Fetched Data and Loading
  const [auction, setAuction] = useState<AuctionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // UI State
  const [currentBid, setCurrentBid] = useState(0);
  const [bidsTotal, setBidsTotal] = useState(0);
  const [watchers, setWatchers] = useState(143);
  const [topBidder, setTopBidder] = useState('N/A');
  const [yourTotalBid, setYourTotalBid] = useState(0); 
  const [yourBidsCount, setYourBidsCount] = useState(0);
  const [impactRaised, setImpactRaised] = useState(0);
  const [impactLives, setImpactLives] = useState(0);
  const [bidAmountInput, setBidAmountInput] = useState('');
  const [autoMaxInput, setAutoMaxInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [isAutoEnabled, setIsAutoEnabled] = useState(false);
  const [message, setMessage] = useState('');
  
  // 3. Add state for wishlist
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // CRITICAL FIX: Cooldown state
  const [cooldown, setCooldown] = useState(0); 

  // (rest of state definitions are unchanged)
  const [bidFeedItems, setBidFeedItems] = useState<any[]>([]); 
  const [comments, setComments] = useState([
    { id: 1, name: 'Riya', time: '5m ago', text: "This artwork looks beautiful! Can't wait to see who wins." },
  ]);

  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const yourUser = 'You';
  const otherNames = ['Riya', 'Aarav', 'Gagan', 'Neha', 'Priyanshu', 'Kabir', 'Rohit'];

  // --- Helpers (unchanged) ---
  const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const pushFeed = useCallback((text: string, bidder: string = 'System') => {
    setBidFeedItems(prev => {
      const newItem = { id: Date.now(), text, bidder }; 
      return [newItem, ...prev.slice(0, 39)]; 
    });
  }, []);

  const pushPrice = useCallback((newPrice: number) => {
    if (chartInstanceRef.current) {
      const chart = chartInstanceRef.current;
      const d = chart.data;
      d.labels = [...(d.labels || []), ''];
      d.datasets[0].data = [...(d.datasets[0].data || []), newPrice];
      if (d.labels.length > 20) {
        d.labels.shift();
        d.datasets[0].data.shift();
      }
      chart.update();
    }
  }, []);

  const updateImpact = useCallback((amount: number) => {
    const donated = Math.round(amount * 0.05);
    setImpactRaised(prev => prev + donated);
    setImpactLives(prev => prev + Math.max(1, Math.round(donated / 200)));
  }, []);

  const quickAdd = (amount: number) => {
    setBidAmountInput(String(currentBid + amount)); 
  };
  
  const postComment = () => {
    const txt = commentInput.trim();
    if (!txt) return;
    setComments(prev => [
      { id: Date.now(), name: yourUser, time: 'just now', text: txt },
      ...prev,
    ]);
    setCommentInput('');
  };
  
  // --- 4. Update fetchAuctionDetails ---
  const fetchAuctionDetails = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch auction data
      const res = await fetch(`/api/auctions/${auctionId}`);
      
      if (!res.ok) {
        // (error handling unchanged)
        try {
          const errorData = await res.json();
          throw new Error(errorData.error || `Server responded with status ${res.status}`);
        } catch(e) {
           throw new Error(`Server returned status ${res.status}.`);
        }
      }
      
      const data: AuctionDetails = await res.json();
      setAuction(data);

      // (rest of state mapping unchanged)
      const highBid = data.currentHighBid || data.startingBid || 0;
      setCurrentBid(highBid);
      setBidsTotal(data.bids);
      const initialFeed = data.bidsHistory.map((bid: BidHistoryItem, index: number) => ({
          id: bid.timestamp + index, 
          text: `${bid.userName} bid ${formatINR(bid.amount)}`,
          bidder: bid.userName,
          timestamp: bid.timestamp,
      }));
      setBidFeedItems(initialFeed.reverse()); 
      setTopBidder(data.bidsHistory?.[data.bidsHistory.length - 1]?.userName || 'N/A'); 
      setImpactRaised(highBid * 5 + 10000); 

      // 5. AFTER fetching auction, fetch wishlist if logged in
      if (session) {
        const wishlistRes = await fetch("/api/wishlist");
        if (wishlistRes.ok) {
          const wishlistData = await wishlistRes.json();
          const userWishlistIds = new Set(wishlistData.map((item: any) => item.auctionId));
          // Set the wishlist state for this specific auction
          setIsWishlisted(userWishlistIds.has(auctionId));
        }
      }

    } catch (err: any) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, [auctionId, session]); // 6. Add session as a dependency

  // --- API Logic Handler: Place Bid (unchanged) ---
  const placeBid = async () => {
    const raw = bidAmountInput.trim();
    setBidAmountInput('');
    if (!raw || isNaN(Number(raw))) {
      setMessage('Enter a valid numeric bid.');
      return;
    }
    const val = parseInt(raw, 10);
    const min = currentBid + 50;
    if (val < min) {
      setMessage(`Your bid must be at least ${formatINR(min)}`);
      return;
    }
    try {
        const response = await fetch(`/api/auctions/${auctionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bidAmount: val }),
        });
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 409 || response.status === 400) {
                fetchAuctionDetails(); 
                setCooldown(8);
                return; 
            }
            setMessage(data.error || "Failed to place bid. Please log in to bid.");
            return;
        }
        const serverHighBid = data.auction?.currentHighBid; 
        const newBidderName = data.newBid?.userName || yourUser;
        setCurrentBid(serverHighBid);
        setBidsTotal(data.auction?.bids);
        setTopBidder(newBidderName); 
        if (newBidderName === yourUser) {
          setYourBidsCount(prev => prev + 1);
          setYourTotalBid(serverHighBid);
        }
        pushFeed(`${newBidderName} bid ${formatINR(serverHighBid)} ${newBidderName === yourUser ? '— you are the top bidder!' : ''}`, newBidderName);
        pushPrice(serverHighBid); 
        updateImpact(val);
        setMessage("🎉 Bid placed successfully! You are the top bidder.");
    } catch (e) {
        setMessage("Network error. Could not place bid.");
    }
  };

  // 7. Add Wishlist Toggle Handler
  const handleWishlistToggle = useCallback(async () => {
    if (!session) {
      alert("Please log in to add items to your wishlist.");
      return;
    }

    const currentWishlistStatus = isWishlisted;
    // Optimistic UI update
    setIsWishlisted(!currentWishlistStatus);

    // Call the API
    try {
      await fetch("/api/wishlist", {
        method: currentWishlistStatus ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId: auctionId }),
      });
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      // Rollback UI on error
      setIsWishlisted(currentWishlistStatus);
    }
  }, [isWishlisted, session, auctionId]);

  // --- Effects ---

  // 1. Initial Data Fetch (dependency list updated)
  useEffect(() => {
    fetchAuctionDetails(); 
  }, [fetchAuctionDetails]); 

  // (Rest of useEffects are unchanged)
  // 2. Chart Initialization and Update
  useEffect(() => {
    if (chartCanvasRef.current && auction) {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy(); 
        }
        const ctx = chartCanvasRef.current.getContext('2d');
        if (!ctx) return;
        const prices = auction.bidsHistory.map(b => b.amount);
        let initialPrices = prices.slice(-12);
        let initialLabels = prices.slice(-12).map((_, i) => `${prices.length - initialPrices.length + i + 1}m`);
        chartInstanceRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: initialLabels,
                datasets: [{
                    label: 'Price',
                    data: initialPrices,
                    borderColor: '#22163F',
                    backgroundColor: 'rgba(34,22,63,0.08)',
                    tension: 0.35,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: { tooltip: { enabled: false }, legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } },
            }
        });
    }
    return () => {
        chartInstanceRef.current?.destroy();
        chartInstanceRef.current = null;
    };
  }, [auction]);
  
  // 3. Simulation Intervals
  useEffect(() => {
    if (!auction) return; 
    const watcherInterval = setInterval(() => {
      setWatchers(prev => Math.max(10, prev + Math.round((Math.random() - 0.4) * 5)));
    }, 3000);
    return () => {
      clearInterval(watcherInterval);
    };
  }, [auction]);
  
  // 4. Cooldown Timer for UI
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 5. Auto-Bid Logic
  useEffect(() => {
    if (!isAutoEnabled || topBidder === yourUser || !autoMaxInput || isNaN(Number(autoMaxInput))) return;
    const maxBid = parseInt(autoMaxInput, 10);
    const minBid = currentBid + 50;
    if (currentBid >= yourTotalBid && currentBid < maxBid) {
      const newBid = Math.min(maxBid, minBid); 
      const timeout = setTimeout(() => {
        setCurrentBid(newBid);
        setBidsTotal(prev => prev + 1);
        setYourBidsCount(prev => prev + 1);
        setYourTotalBid(newBid);
        pushFeed(`${yourUser} auto-bid ${formatINR(newBid)} (Top Bidder)`, yourUser);
        setTopBidder(yourUser);
        pushPrice(newBid);
        updateImpact(newBid);
      }, 1000); 
      return () => clearTimeout(timeout);
    }
  }, [isAutoEnabled, topBidder, currentBid, yourTotalBid, autoMaxInput, pushFeed, pushPrice, updateImpact, yourUser]);


  // Derived UI State (unchanged)
  const heatScore = (auction && bidsTotal) ? Math.min(100, Math.max(20, Math.round(bidsTotal * 2.5 + watchers * 0.1))) : 50; 
  const isTopBidder = topBidder === yourUser;
  const bidDiff = currentBid - yourTotalBid;
  const yourPositionContent = isTopBidder ? {
    rank: '#1',
    meta: `Top bidder • ${yourBidsCount} bids`,
    top: yourUser,
  } : {
    rank: '#2',
    meta: `Outbid by ${formatINR(bidDiff > 0 ? bidDiff : 50)} • ${yourBidsCount} bids`,
    top: topBidder,
  };
  const minBidForUI = currentBid + 50;


  // --- Main Render (using auction data) ---
  if (loading) {
    return <div className="text-center py-20 text-xl font-semibold text-[#22163F]">Loading Auction Details...</div>;
  }
  if (fetchError) {
    return <div className="text-center py-20 text-xl font-semibold text-red-600">Error: {fetchError}. Please ensure MongoDB is running and data exists.</div>;
  }
  if (!auction) {
    return <div className="text-center py-20 text-xl font-semibold text-gray-500">Auction not found.</div>;
  }
  
  // --- Main Render (using auction data) ---
  return (
    <div className="pt-4 pb-12 w-full">
      <MessageModal onClose={() => setMessage('')} message={message} />

      <Link href="/auction" className="flex items-center gap-2 text-lg font-bold mb-4 hover:text-[#463985] transition" style={{ color: 'var(--accent)' }}>
        <ArrowLeft size={20} /> Back to Auctions
      </Link>

      {/* NEW LAYOUT: Left (Details/Comments) vs Right (Live Feed/Bidding/Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] lg:gap-6">
        
        {/* =====================================================================
           LEFT COLUMN: Auction Details + Comments 
           ===================================================================== */}
        <div className="card bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-white px-3 py-1 rounded-xl font-extrabold text-sm flex items-center gap-1" style={{ background: '#FF4A4A' }}>
              <Clock size={16} /> LIVE
            </span>
            {/* 8. Wire up the Wishlist Button */}
            <button 
              onClick={handleWishlistToggle}
              className={`text-gray-400 hover:text-red-500 transition ${isWishlisted ? 'text-red-500' : ''}`}
            >
                <Heart size={24} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          <h1 className="text-3xl font-extrabold mt-3 mb-4" style={{ color: 'var(--accent)' }}>{auction.title}</h1>

          {/* (Rest of JSX is unchanged) */}
          <div className="big-img h-80 w-full rounded-2xl animate-fadeIn" style={{ background: 'linear-gradient(90deg,#efefef,#e6e6e6)' }} />
          <div className="flex justify-between items-center mt-4 text-sm" style={{ color: 'var(--muted)' }}>
            <div>
              <div className="text-sm">Current Bid</div>
              <div className="text-4xl font-extrabold mt-1" style={{ color: '#111' }}>{formatINR(currentBid)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-700 font-semibold">{bidsTotal} total bids</div>
              <div className="text-xs text-gray-500">{watchers} watching</div>
            </div>
          </div>
          <p className="mt-4 text-gray-700 leading-relaxed">{auction.description}</p>
          <div className="mt-4 p-4 rounded-xl border border-yellow-200 bg-yellow-50 text-sm" style={{ color: 'var(--muted)', lineHeight: '1.45' }}>
            <strong className="text-yellow-700">Impact:</strong> This auction supports <b>Education For All NGO</b>. <span id="impactLine">Your bid helps provide books to underprivileged girls.</span>
            <div className="mt-2 text-xs">
                <strong>Starting Price:</strong> {formatINR(auction.startingBid)} &nbsp;&nbsp;
                <strong>Bid Increment:</strong> {formatINR(50)} &nbsp;&nbsp;
                <strong>Ends:</strong> {new Date(auction.endDate).toLocaleString()}
            </div>
          </div>
          <div className="comments mt-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold" style={{ color: 'var(--accent)' }}>Comments</h3>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>{comments.length} comments</div>
            </div>
            <div className="mt-4 rounded-xl p-4 border shadow-md bg-gray-50">
              <div className="comment-list max-h-72 overflow-y-auto flex flex-col gap-3 pr-2">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-white border border-gray-100">
                    <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(#ddd,#bbb)' }} />
                    <div className="flex-1">
                      <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{c.name}<span className="text-xs text-gray-400 ml-2 font-normal">{c.time}</span></div>
                      <div className="mt-1 text-sm text-gray-700">{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-full mt-4">
                <textarea
                  className="w-full p-3 rounded-lg border text-sm focus:ring focus:ring-[#463985] focus:border-[#463985] min-h-[70px]"
                  style={{ borderColor: '#e2e2e2' }}
                  rows={2}
                  placeholder="Write a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                />
                <button
                  className="w-full py-3 rounded-xl text-white font-extrabold transition hover:opacity-90 mt-2 disabled:bg-gray-400"
                  style={{ background: 'var(--accent)' }}
                  onClick={postComment}
                  disabled={!commentInput.trim()}
                >
                  <MessageCircle size={20} className="inline-block mr-2" /> Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
           RIGHT COLUMN: Live Bidding + Analytics 
           ===================================================================== */}
        <div className="mt-6 lg:mt-0"> 
          <div className="card bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-5">
            <h3 className="text-xl font-bold" style={{ color: 'var(--accent)', margin: '0 0 12px' }}>Live Bid Feed</h3>
            <div className="feed max-h-[280px] overflow-y-auto flex flex-col gap-2 pr-2">
              {bidFeedItems.map((item, index) => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-200 flex justify-between items-center">
                    <div className="font-medium flex items-center gap-2">
                        {item.bidder === yourUser ? <Hand size={16} className="text-green-500" /> : <Hand size={16} className="text-blue-500" />}
                        {item.text}
                    </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-bold mb-2">Place Your Bid:</h4>
                {cooldown > 0 && (
                    <div className="text-center bg-red-100 text-red-700 py-2 rounded-lg mb-3 text-sm font-semibold">
                        Cooldown: Please wait {cooldown}s (Price just updated)
                    </div>
                )}
                <div className="bid-controls flex gap-2">
                <button 
                    className="flex-1 p-3 rounded-xl bg-gray-200 font-bold cursor-pointer transition hover:bg-gray-300 disabled:bg-gray-400" 
                    onClick={() => quickAdd(10)}
                    disabled={cooldown > 0}
                >
                    + ₹10
                </button>
                <button 
                    className="flex-1 p-3 rounded-xl bg-gray-200 font-bold cursor-pointer transition hover:bg-gray-300 disabled:bg-gray-400" 
                    onClick={() => quickAdd(50)}
                    disabled={cooldown > 0}
                >
                    + ₹50
                </button>
                <button 
                    className="flex-1 p-3 rounded-xl bg-gray-200 font-bold cursor-pointer transition hover:bg-gray-300 disabled:bg-gray-400" 
                    onClick={() => quickAdd(100)}
                    disabled={cooldown > 0}
                >
                    + ₹100
                </button>
                </div>
                <input
                id="bidAmount"
                className="w-full p-3 rounded-xl border mt-3 text-base focus:ring-2 focus:ring-[#463985] focus:border-[#463985] disabled:bg-gray-50"
                placeholder={`Enter your bid (min ${formatINR(minBidForUI)})`} 
                value={bidAmountInput}
                onChange={(e) => setBidAmountInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && placeBid()}
                disabled={cooldown > 0}
                />
                <button
                type="button" 
                className="w-full py-4 rounded-xl text-[#1E1635] font-extrabold transition disabled:bg-gray-400 bg-[#F4C15D] hover:bg-[#e4b24e]" 
                onClick={placeBid}
                disabled={!bidAmountInput.trim() || isNaN(Number(bidAmountInput.trim())) || cooldown > 0}
                >
                <Zap size={20} className="inline-block mr-2" /> {cooldown > 0 ? `Wait ${cooldown}s...` : 'Place Bid'}
                </button>
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm text-gray-700">
              <input
                type="checkbox"
                id="autoToggle"
                checked={isAutoEnabled}
                onChange={(e) => {
                    setIsAutoEnabled(e.target.checked);
                    if(e.target.checked && (!autoMaxInput || isNaN(Number(autoMaxInput)))) {
                        setMessage("Please set a numeric maximum auto-bid amount.");
                    }
                }}
                className="rounded border-gray-300 text-[#22163F] focus:ring-[#22163F]"
              /> Auto-Bid up to:
            </label>
            <input
              id="autoMax"
              className="w-full p-3 rounded-xl border mt-2 text-sm focus:ring-2 focus:ring-[#463985] focus:border-[#463985]"
              placeholder="Enter max auto-bid (optional)"
              value={autoMaxInput}
              onChange={(e) => setAutoMaxInput(e.target.value)}
              disabled={!isAutoEnabled}
            />
          </div>
          <div className="space-y-4">
            <div className="widget bg-white p-4 rounded-xl border shadow-sm">
              <h4 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                <TrendingUp size={20} /> Price Trend (last 10 mins)
              </h4>
              <div className="chart-wrap h-28 p-2 rounded-lg border mt-2">
                <canvas ref={chartCanvasRef} className="w-full h-full"></canvas>
              </div>
            </div>
            <div className="widget bg-white p-4 rounded-xl border shadow-sm">
              <h4 className="font-bold text-lg" style={{ color: 'var(--accent)' }}>Your Position</h4>
              <div className="pos-box flex items-center gap-4 p-4 rounded-xl mt-2 bg-gray-50 border">
                <div className="text-3xl font-extrabold w-12 text-center" style={{ color: 'var(--accent)' }}>{yourPositionContent.rank}</div>
                <div className="flex-1">
                  <div className="font-extrabold">{yourPositionContent.top === yourUser ? 'You' : yourPositionContent.top}</div>
                  <div className="text-sm text-gray-500">{yourPositionContent.meta}</div>
                </div>
                <div className={`text-sm font-semibold ${isTopBidder ? 'text-green-600' : 'text-red-600'}`}>{isTopBidder ? 'Winning' : 'Outbid'}</div>
              </div>
            </div>
            <div className="widget bg-white p-4 rounded-xl border shadow-sm">
              <h4 className="font-bold text-lg" style={{ color: 'var(--accent)' }}>Auction Heat</h4>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1">
                  <div className="heat-bar h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="heat-fill h-full transition-all duration-500" style={{ width: `${heatScore}%`, background: 'linear-gradient(90deg,#ff7a00,#ffcc33)' }} />
                  </div>
                </div>
                <div className="font-extrabold text-lg" style={{ color: 'var(--accent)' }}>{heatScore}%</div>
              </div>
              <div className="mt-2 text-sm text-gray-500">Based on watchers, bid tempo & recency.</div>
            </div>
            <div className="widget bg-white p-4 rounded-xl border shadow-sm">
              <h4 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                <Hand size={20} /> Impact Tracker
              </h4>
              <div className="mt-2 text-2xl font-extrabold text-green-700" id="impactRaised">{formatINR(impactRaised)}</div>
              <div className="text-sm text-gray-500 mt-1">{Math.round(impactLives)} lives impacted</div>
              <div className="mt-2 text-xs text-gray-500">This auction contributes a portion of proceeds to Education For All NGO.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}