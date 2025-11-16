// src/app/auction/[id]/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
// Import Chart.js essentials from package.json dependencies
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

// --- Main Page Component ---
export default function LiveAuctionPage({ params }: { params: { id: string } }) {
  // Auction ID from URL (e.g., 'vintage-art')
  const auctionId = params.id;

  // Initial State (converted from original HTML script's 'state' object)
  const [currentBid, setCurrentBid] = useState(4300);
  const [bidsTotal, setBidsTotal] = useState(32);
  const [watchers, setWatchers] = useState(143);
  const [topBidder, setTopBidder] = useState('Neha');
  const [yourTotalBid, setYourTotalBid] = useState(4100);
  const [yourBidsCount, setYourBidsCount] = useState(2);
  const [impactRaised, setImpactRaised] = useState(23546);
  const [impactLives, setImpactLives] = useState(118);
  const [bidAmountInput, setBidAmountInput] = useState('');
  const [autoMaxInput, setAutoMaxInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [isAutoEnabled, setIsAutoEnabled] = useState(false);
  const [message, setMessage] = useState('');

  const [bidFeedItems, setBidFeedItems] = useState([
    { id: 1, text: 'Neha bid ₹4,300 (top bidder)', bidder: 'Neha' },
    { id: 2, text: 'Rohit bid ₹4,250', bidder: 'Rohit' },
    { id: 3, text: 'Aarav bid ₹4,200', bidder: 'Aarav' },
    { id: 4, text: 'Priyanshu bid ₹4,100', bidder: 'Priyanshu' },
  ]);
  const [comments, setComments] = useState([
    { id: 1, name: 'Riya', time: '5m ago', text: "This artwork looks beautiful! Can't wait to see who wins." },
    { id: 2, name: 'Aarav', time: '12m ago', text: "Just increased my bid 🔥" },
  ]);

  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const yourUser = 'You';
  const otherNames = ['Riya', 'Aarav', 'Gagan', 'Neha', 'Priyanshu', 'Kabir', 'Rohit'];

  // --- Helpers ---
  const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const pushFeed = useCallback((text: string, bidder: string = 'System') => {
    setBidFeedItems(prev => {
      const newItem = { id: Date.now(), text, bidder };
      return [newItem, ...prev.slice(0, 39)]; // Keep max 40 items
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

  // --- Logic Handlers ---

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

  const placeBid = () => {
    const raw = bidAmountInput.trim();
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

    // Server-side update simulation
    setCurrentBid(val);
    setBidsTotal(prev => prev + 1);
    setYourBidsCount(prev => prev + 1);
    setYourTotalBid(val); // Assume this is the current active bid for you

    // UI updates
    pushFeed(`${yourUser} bid ${formatINR(val)} — you are the top bidder!`);
    setTopBidder(yourUser);
    pushPrice(val);
    updateImpact(val);

    setBidAmountInput('');
  };

  // --- Simulation Logic (wrapped in useCallback and useEffect) ---

  const updateHeat = useCallback(() => {
    const watcherFactor = Math.min(1, watchers / 500);
    const chartDataPoints = chartInstanceRef.current?.data.datasets[0].data as number[] || [];
    
    let tempo = 0;
    if (chartDataPoints.length > 2) {
      const last = chartDataPoints.slice(-6);
      tempo = last.reduce((acc, cur, idx, arr) => {
        if (idx === 0) return acc;
        return acc + Math.max(0, cur - arr[idx - 1]);
      }, 0);
    }
    const tempoNorm = Math.min(1, tempo / 500);
    const recency = Math.min(1, (bidsTotal % 30) / 30);

    let score = (watcherFactor * 0.45 + tempoNorm * 0.4 + recency * 0.15) * 100;
    score = Math.round(score);
    return score;
  }, [watchers, bidsTotal]);

  const simulateOtherBid = useCallback(() => {
    if (Math.random() < 0.6) {
      const incrementOptions = [50, 50, 100, 50, 20, 100];
      const inc = incrementOptions[Math.floor(Math.random() * incrementOptions.length)];
      const newVal = currentBid + inc;
      const who = otherNames[Math.floor(Math.random() * otherNames.length)];

      if (newVal > currentBid) {
        setCurrentBid(newVal);
        setBidsTotal(prev => prev + 1);
        setTopBidder(who);
        pushFeed(`${who} bid ${formatINR(newVal)}`, who);
        pushPrice(newVal);
        updateImpact(inc);
      }
    }
  }, [currentBid, pushFeed, pushPrice, updateImpact, otherNames]);

  // --- Effects ---

  // 1. Chart Initialization
  useEffect(() => {
    if (chartCanvasRef.current && !chartInstanceRef.current) {
      const ctx = chartCanvasRef.current.getContext('2d');
      if (!ctx) return;

      const initialLabels = Array.from({ length: 12 }).map((_, i) => `${12 - i}m`).reverse();
      const initialPrices = [3600, 3700, 3800, 3950, 4000, 4050, 4100, 4200, 4250, 4280, 4300, 4300].reverse();

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
  }, []);

  // 2. Simulation Intervals
  useEffect(() => {
    const bidInterval = setInterval(simulateOtherBid, 4000 + Math.random() * 4000);
    const watcherInterval = setInterval(() => {
      setWatchers(prev => Math.max(10, prev + Math.round((Math.random() - 0.4) * 5)));
    }, 3000);

    return () => {
      clearInterval(bidInterval);
      clearInterval(watcherInterval);
    };
  }, [simulateOtherBid]);

  // 3. Auto-Bid Logic (Client-side simulation)
  useEffect(() => {
    if (!isAutoEnabled || topBidder === yourUser || !autoMaxInput || isNaN(Number(autoMaxInput))) return;

    const maxBid = parseInt(autoMaxInput, 10);
    const minBid = currentBid + 50;

    if (currentBid >= yourTotalBid && currentBid < maxBid) {
      // Simulate placing a counter-bid
      const newBid = Math.min(maxBid, minBid); // Bid the minimum to win, up to max
      
      // Delay auto-bid to make it look realistic
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


  // Derived UI State
  const heatScore = updateHeat();
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

  return (
    <div className="pt-4 pb-12 w-full">
      <MessageModal message={message} onClose={() => setMessage('')} />

      <Link href="/auctions" className="flex items-center gap-2 text-lg font-bold mb-4 hover:text-[#463985] transition" style={{ color: 'var(--accent)' }}>
        <ArrowLeft size={20} /> Back to Auctions
      </Link>

      <div className="grid-layout">
        {/* LEFT: Item + Comments */}
        <div className="card bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-white px-3 py-1 rounded-xl font-extrabold text-sm flex items-center gap-1" style={{ background: '#FF4A4A' }}>
              <Clock size={16} /> LIVE
            </span>
            <button className="text-gray-400 hover:text-red-500 transition">
                <Heart size={24} />
            </button>
          </div>

          <h1 className="text-3xl font-extrabold mt-3 mb-4" style={{ color: 'var(--accent)' }}>Vintage Art — Charity Edition</h1>

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

          <div className="mt-4 p-4 rounded-xl border border-yellow-200 bg-yellow-50 text-sm" style={{ color: 'var(--muted)', lineHeight: '1.45' }}>
            <strong className="text-yellow-700">Impact:</strong> This auction supports <b>Education For All NGO</b>. <span id="impactLine">Your bid helps provide books to underprivileged girls.</span>
            <div className="mt-2 text-xs">
                <strong>Starting Price:</strong> {formatINR(1000)} &nbsp;&nbsp;
                <strong>Bid Increment:</strong> {formatINR(50)} &nbsp;&nbsp;
                <strong>Reserve:</strong> Reached
            </div>
          </div>

          {/* Comments */}
          <div className="comments mt-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold" style={{ color: 'var(--accent)', margin: 0 }}>Comments</h3>
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

        {/* RIGHT: Live bidding + analytics */}
        <div>
          <div className="card bg-white p-6 rounded-2xl shadow-xl border border-gray-100 sticky top-4">
            <h3 className="text-xl font-bold" style={{ color: 'var(--accent)', margin: '0 0 12px' }}>Live Bid Feed</h3>
            <div className="feed max-h-[280px] overflow-y-auto flex flex-col gap-2 pr-2">
              {bidFeedItems.map(item => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-200 flex justify-between items-center">
                    <div className="font-medium flex items-center gap-2">
                        {item.bidder === yourUser ? <Hand size={16} className="text-green-500" /> : <Hand size={16} className="text-blue-500" />}
                        {item.text}
                    </div>
                </div>
              ))}
            </div>

            <div className="bid-controls flex gap-2 mt-4">
              <button className="flex-1 p-3 rounded-xl bg-gray-200 font-bold cursor-pointer transition hover:bg-gray-300" onClick={() => quickAdd(10)}>+ ₹10</button>
              <button className="flex-1 p-3 rounded-xl bg-gray-200 font-bold cursor-pointer transition hover:bg-gray-300" onClick={() => quickAdd(50)}>+ ₹50</button>
              <button className="flex-1 p-3 rounded-xl bg-gray-200 font-bold cursor-pointer transition hover:bg-gray-300" onClick={() => quickAdd(100)}>+ ₹100</button>
            </div>

            <input
              id="bidAmount"
              className="w-full p-3 rounded-xl border mt-3 text-base focus:ring-2 focus:ring-[#463985] focus:border-[#463985]"
              placeholder={`Enter your bid (min ${formatINR(currentBid + 50)})`}
              value={bidAmountInput}
              onChange={(e) => setBidAmountInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && placeBid()}
            />

            <button
              className="w-full py-4 rounded-xl text-white font-extrabold transition hover:opacity-90 mt-3 disabled:bg-gray-400"
              style={{ background: 'var(--accent)' }}
              onClick={placeBid}
              disabled={!bidAmountInput.trim() || isNaN(Number(bidAmountInput.trim()))}
            >
              <Zap size={20} className="inline-block mr-2" /> Place Bid
            </button>

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

          {/* Analytics widgets container */}
          <div className="mt-5 space-y-4">
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
              <div className="text-sm text-gray-500 mt-1">{impactLives} lives impacted</div>
              <div className="mt-2 text-xs text-gray-500">This auction contributes a portion of proceeds to Education For All NGO.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}