"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type BlockType = "genesis" | "donation";

interface LedgerBlock {
  index: number;
  timestamp: string;
  type: BlockType;
  amount: number;
  donor: string;
  note: string;
  prevHash: string;
  hash: string;
}

const NGO_KEY = "ngo_ledger_education_for_all_v1";

const formatINR = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN");

const nowISO = () => new Date().toISOString();

async function sha256Hex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function NgoPage() {
  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [following, setFollowing] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorAmount, setDonorAmount] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorNote, setDonorNote] = useState("");
  const [ledgerNote, setLedgerNote] = useState("");
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* --------- load or seed ledger --------- */
  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;

      const stored = window.localStorage.getItem(NGO_KEY);
      if (stored) {
        setLedger(JSON.parse(stored));
        return;
      }

      const genesis: LedgerBlock = {
        index: 0,
        timestamp: nowISO(),
        type: "genesis",
        amount: 0,
        donor: "genesis",
        note: "Genesis block",
        prevHash: "0",
        hash: "",
      };
      genesis.hash = await sha256Hex(JSON.stringify(genesis));

      const ledgerDraft: LedgerBlock[] = [genesis];

      async function addSeed(amount: number, donor: string, note: string) {
        const last = ledgerDraft[ledgerDraft.length - 1];
        const block: LedgerBlock = {
          index: last.index + 1,
          timestamp: nowISO(),
          type: "donation",
          amount,
          donor,
          note,
          prevHash: last.hash,
          hash: "",
        };
        block.hash = await sha256Hex(JSON.stringify(block));
        ledgerDraft.push(block);
      }

      await addSeed(5000, "Aarav", "Back-to-school kits");
      await addSeed(18546, "Samayran Singh", "Auction proceeds - Vintage Art");

      window.localStorage.setItem(NGO_KEY, JSON.stringify(ledgerDraft));
      setLedger(ledgerDraft);
    })();
  }, []);

  /* --------- persist ledger --------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!ledger.length) return;
    window.localStorage.setItem(NGO_KEY, JSON.stringify(ledger));
  }, [ledger]);

  /* --------- derived values --------- */
  const totalFunds = useMemo(
    () => ledger.filter((b) => b.type === "donation").reduce((s, b) => s + b.amount, 0),
    [ledger]
  );

  const donorsCount = useMemo(() => {
    const set = new Set(
      ledger.filter((b) => b.type === "donation").map((b) => b.donor)
    );
    return set.size;
  }, [ledger]);

  const donorsLeaderboard = useMemo(() => {
    const map: Record<string, number> = {};
    ledger
      .filter((b) => b.type === "donation")
      .forEach((b) => {
        map[b.donor] = (map[b.donor] || 0) + b.amount;
      });
    return Object.entries(map)
      .map(([donor, amt]) => ({ donor, amt }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 6);
  }, [ledger]);

  /* --------- chart init/update --------- */
  useEffect(() => {
    if (!canvasRef.current || !ledger.length) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const monthly = Array(12).fill(0);
    ledger
      .filter((b) => b.type === "donation")
      .forEach((d) => {
        const m = new Date(d.timestamp).getMonth();
        monthly[m] += d.amount;
      });

    if (chartRef.current) {
      chartRef.current.data.datasets[0].data = monthly;
      chartRef.current.update();
      return;
    }

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        datasets: [
          {
            label: "Monthly funds",
            data: monthly,
            backgroundColor: "rgba(34,22,63,0.9)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { display: false },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [ledger]);

  /* --------- ledger ops --------- */
  async function appendDonation(amount: number, donor: string, note: string) {
    if (!ledger.length) return;
    const last = ledger[ledger.length - 1];
    const block: LedgerBlock = {
      index: last.index + 1,
      timestamp: nowISO(),
      type: "donation",
      amount,
      donor: donor || "Anonymous",
      note: note || "",
      prevHash: last.hash,
      hash: "",
    };
    block.hash = await sha256Hex(JSON.stringify(block));
    setLedger((prev) => [...prev, block]);
  }

  async function addMockDonation() {
    const amount = Math.round(200 + Math.random() * 5000);
    await appendDonation(
      amount,
      "Demo Donor " + Math.floor(Math.random() * 99),
      ledgerNote || "Demo donation"
    );
    setLedgerNote("");
  }

  /* --------- recent auctions (static demo) --------- */
  const recentAuctions = [
    { title: "Signed Guitar", bid: 3800 },
    { title: "Vintage Art", bid: 4300 },
    { title: "Cricket Kit (Signed)", bid: 2420 },
  ];

  /* --------- donate modal --------- */
  async function submitDonation() {
    const amount = Number(donorAmount || 0);
    if (!amount || amount <= 0) {
      alert("Enter a valid amount");
      return;
    }
    await appendDonation(amount, donorName || "Anonymous", donorNote || "");
    setDonorAmount("");
    setDonorEmail("");
    setDonorName("");
    setDonorNote("");
    setDonateOpen(false);
    alert("Thank you — donation recorded on public ledger.");
  }

  /* --------- export & verify --------- */
  function exportLedger() {
    const blob = new Blob([JSON.stringify(ledger, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ngo-ledger-education-for-all.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function verifyLedger() {
    if (!ledger.length) return;
    let ok = true;
    for (let i = 1; i < ledger.length; i++) {
      const b = ledger[i];
      const prev = ledger[i - 1];
      if (b.prevHash !== prev.hash) {
        ok = false;
        break;
      }
      const recomputed = await sha256Hex(JSON.stringify(b));
      if (recomputed !== b.hash) {
        ok = false;
        break;
      }
    }
    alert(ok ? "Ledger verification OK — chain intact." : "Ledger verification FAILED — chain tampered!");
  }

  /* --------- verify trust score (static now) --------- */
  const trustScore = 92;

  return (
    <div className="min-h-screen bg-[#F3F1EC]">
      <div className="max-w-[1200px] mx-auto px-5 pt-6 pb-8">
        {/* NAV (page-local, your global Navbar already exists – remove this if redundant) */}
        {/* You can remove this header if you're using the global Navbar */}
        <header className="flex items-center justify-between gap-3 py-3">
          <div className="font-extrabold text-[22px] text-[#22163F]">famwish</div>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <span className="text-[#6B6B6B] cursor-pointer">Home</span>
            <span className="text-[#6B6B6B] cursor-pointer">Auctions</span>
            <span className="text-[#6B6B6B] cursor-pointer">Leaderboard</span>
            <span className="text-[#6B6B6B] cursor-pointer">NGOs</span>
          </nav>
          <button className="bg-[#22163F] text-white rounded-xl px-4 py-2 text-sm font-semibold">
            Sign up
          </button>
        </header>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 mt-2">
          {/* LEFT MAIN */}
          <div>
            {/* HERO */}
            <div className="bg-white p-5 rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex gap-5 items-start">
              <div className="w-[120px] h-[120px] rounded-[12px] bg-gradient-to-b from-[#e9e9e9] to-[#d3d3d3]" />

              <div className="flex-1">
                <h1 className="text-[26px] font-extrabold text-[#22163F] leading-tight">
                  Education For All{" "}
                  <span className="text-[#D9A441] text-sm ml-2">● VERIFIED</span>
                </h1>

                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-[#F4F7FF] text-[#22163F] text-sm font-semibold">
                  Verified NGO — ID: <span className="font-bold ml-1">NGO-0143</span>
                </div>

                <p className="text-sm text-[#6B6B6B] mt-3 max-w-[70%]">
                  Registered charity focused on girls&apos; education, school supplies
                  and community learning programs.
                </p>

                {/* STATS */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="bg-[#FBF9F7] rounded-[10px] px-4 py-3 min-w-[120px] text-center">
                    <strong className="block text-[18px] text-[#22163F]">
                      {formatINR(totalFunds)}
                    </strong>
                    <span className="text-xs text-[#6B6B6B]">Total funds received</span>
                  </div>
                  <div className="bg-[#FBF9F7] rounded-[10px] px-4 py-3 min-w-[120px] text-center">
                    <strong className="block text-[18px] text-[#22163F]">
                      {donorsCount}
                    </strong>
                    <span className="text-xs text-[#6B6B6B]">Donors</span>
                  </div>
                  <div className="bg-[#FBF9F7] rounded-[10px] px-4 py-3 min-w-[120px] text-center">
                    <strong className="block text-[18px] text-[#22163F]">3</strong>
                    <span className="text-xs text-[#6B6B6B]">Active auctions</span>
                  </div>
                </div>

                {/* HERO ACTIONS */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    className="bg-[#22163F] text-white rounded-[10px] px-4 py-2 text-sm font-semibold"
                    onClick={() => setDonateOpen(true)}
                  >
                    Donate
                  </button>
                  <button
                    className="bg-transparent text-[#22163F] border border-[#e6e6e6] rounded-[10px] px-4 py-2 text-sm font-semibold"
                    onClick={() => alert("Open create auction flow")}
                  >
                    Create Auction
                  </button>
                  <button
                    className="bg-white text-[#22163F] border border-[#e6e6e6] rounded-[10px] px-4 py-2 text-sm font-semibold"
                    onClick={() => setFollowing((f) => !f)}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                </div>

                <p className="text-sm text-[#6B6B6B] mt-3">
                  Education For All partners with grassroots schools to provide books,
                  supplies and teacher training. Transparent public ledger and verified
                  partners. Join the mission — one auction, one child at a time.
                </p>
              </div>
            </div>

            {/* CHART + LEDGER */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4 mt-5">
              {/* CHART CARD */}
              <div className="bg-white rounded-[12px] shadow-[0_8px_26px_rgba(0,0,0,0.04)] border border-[#0001] p-4">
                <h3 className="text-[#22163F] font-semibold text-base">
                  Funds received (last 12 months)
                </h3>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  See monthly incoming donations and auction proceeds.
                </p>
                <div className="h-[220px] mt-3">
                  <canvas ref={canvasRef} className="w-full h-full" />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="font-extrabold text-[#22163F] text-sm">
                    {formatINR(totalFunds)}
                  </div>
                  <div className="text-xs text-[#6B6B6B]">Total raised</div>
                </div>
              </div>

              {/* LEDGER CARD */}
              <div className="bg-white rounded-[12px] shadow-[0_8px_26px_rgba(0,0,0,0.04)] border border-[#0001] p-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#22163F] font-semibold text-base">
                    Public Immutable Ledger
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={exportLedger}
                      className="px-3 py-2 rounded-lg border border-[#e6e6e6] bg-white text-xs"
                    >
                      Export
                    </button>
                    <button
                      onClick={verifyLedger}
                      className="px-3 py-2 rounded-lg bg-[#22163F] text-white text-xs"
                    >
                      Verify
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#6B6B6B] mt-2">
                  Every donation & auction payout is immutably chained. Each entry
                  shows a cryptographic hash — part of the public audit trail.
                </p>

                <div className="flex gap-2 mt-3">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg border border-[#e6e6e6] text-sm"
                    placeholder="Admin note (optional)"
                    value={ledgerNote}
                    onChange={(e) => setLedgerNote(e.target.value)}
                  />
                  <button
                    className="bg-[#22163F] text-white text-xs px-3 py-2 rounded-lg"
                    onClick={addMockDonation}
                  >
                    Add Demo Donation
                  </button>
                </div>

                <div className="mt-3 space-y-2 max-h-[360px] overflow-auto pr-1">
                  {ledger
                    .slice()
                    .reverse()
                    .map((block) => (
                      <div
                        key={block.index + block.hash}
                        className="bg-white border border-[#0001] rounded-[10px] p-3 text-[13px]"
                      >
                        <div className="flex justify-between gap-2">
                          <div>
                            <strong>
                              {block.type === "donation"
                                ? formatINR(block.amount)
                                : block.type}
                            </strong>
                            <div className="text-xs text-[#6B6B6B]">
                              {block.donor}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs">
                              {new Date(block.timestamp).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              #{block.index}
                            </div>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-600 break-all mt-1">
                          <strong>prev:</strong> {block.prevHash}
                        </div>
                        <div className="text-[11px] text-gray-600 break-all">
                          <strong>hash:</strong> {block.hash}
                        </div>
                        {block.note && (
                          <div className="mt-2 text-xs text-[#6B6B6B]">
                            {block.note}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* DONORS + AUCTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 mt-5">
              <div className="bg-white rounded-[12px] shadow-[0_8px_26px_rgba(0,0,0,0.04)] border border-[#0001] p-4">
                <h3 className="text-[#22163F] font-semibold text-base">Top Donors</h3>
                <div className="mt-3 flex flex-col gap-2">
                  {donorsLeaderboard.map((d) => (
                    <div
                      key={d.donor}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg"
                    >
                      <div className="w-11 h-11 rounded-full bg-gradient-to-b from-[#ddd] to-[#ccc]" />
                      <div>
                        <div className="font-semibold text-[#22163F] text-sm">
                          {d.donor}
                        </div>
                        <div className="text-xs text-[#6B6B6B]">
                          {formatINR(d.amt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[12px] shadow-[0_8px_26px_rgba(0,0,0,0.04)] border border-[#0001] p-4">
                <h3 className="text-[#22163F] font-semibold text-base">
                  Recent Auctions by NGO
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recentAuctions.map((a) => (
                    <div
                      key={a.title}
                      className="border border-[#0001] rounded-[10px] p-3 min-w-[180px] bg-white"
                    >
                      <div className="h-[84px] rounded-md bg-gradient-to-r from-[#eee] to-[#ddd]" />
                      <div className="font-semibold text-sm text-[#22163F] mt-2">
                        {a.title}
                      </div>
                      <div className="text-xs text-[#6B6B6B]">
                        {formatINR(a.bid)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="flex flex-col gap-3">
            <div className="bg-white rounded-[12px] shadow-[0_8px_26px_rgba(0,0,0,0.04)] border border-[#0001] p-4">
              <h3 className="text-[#22163F] font-semibold text-base">
                Trust & Verification
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <strong>Trust Score:</strong>{" "}
                  <span className="font-extrabold text-[#22163F]">
                    {trustScore}
                  </span>
                  /100
                </div>
                <p className="text-xs text-[#6B6B6B]">
                  Verified documents, audits and active partnerships.
                </p>
                <div className="mt-3">
                  <div className="text-xs text-[#6B6B6B]">Verified partners</div>
                  <div className="flex gap-2 mt-2">
                    <div className="w-[60px] h-[60px] rounded-md bg-[#eee]" />
                    <div className="w-[60px] h-[60px] rounded-md bg-[#eee]" />
                    <div className="w-[60px] h-[60px] rounded-md bg-[#eee]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[12px] shadow-[0_8px_26px_rgba(0,0,0,0.04)] border border-[#0001] p-4">
              <h3 className="text-[#22163F] font-semibold text-base">
                Documents & Audits
              </h3>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <button
                  onClick={() => alert("open audit 2024")}
                  className="text-left text-[#22163F] hover:underline"
                >
                  Audit Report 2024 (PDF)
                </button>
                <button
                  onClick={() => alert("open registration certificate")}
                  className="text-left text-[#22163F] hover:underline"
                >
                  Registration Certificate
                </button>
                <button
                  onClick={() => alert("open partner MOU")}
                  className="text-left text-[#22163F] hover:underline"
                >
                  Partner MOU
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[12px] shadow-[0_8px_26px_rgba(0,0,0,0.04)] border border-[#0001] p-4">
              <h3 className="text-[#22163F] font-semibold text-base">
                Quick Actions
              </h3>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  className="px-3 py-2 rounded-lg bg-[#D9A441] text-sm font-semibold"
                  onClick={() => setDonateOpen(true)}
                >
                  Donate Now
                </button>
                <button
                  className="px-3 py-2 rounded-lg bg-white border border-[#e6e6e6] text-sm"
                  onClick={() => alert("Open create auction flow")}
                >
                  Create Auction
                </button>
                <button
                  className="px-3 py-2 rounded-lg bg-[#22163F] text-white text-sm"
                  onClick={() => alert("Notify followers placeholder")}
                >
                  Notify Followers
                </button>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-6 text-center text-xs text-[#6B6B6B]">
          © FamWish — Transparent Giving Platform
        </footer>
      </div>

      {/* DONATE MODAL */}
      {donateOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-[420px] bg-white rounded-[12px] p-5">
            <h3 className="text-[#22163F] font-semibold text-base mb-2">
              Donate to Education For All
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <input
                className="px-3 py-2 rounded-lg border border-[#e6e6e6]"
                placeholder="Your name (optional)"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
              <input
                className="px-3 py-2 rounded-lg border border-[#e6e6e6]"
                placeholder="Amount (₹)"
                value={donorAmount}
                onChange={(e) => setDonorAmount(e.target.value)}
              />
              <input
                className="px-3 py-2 rounded-lg border border-[#e6e6e6]"
                placeholder="Email (optional)"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
              />
              <textarea
                className="px-3 py-2 rounded-lg border border-[#e6e6e6] min-h-[72px]"
                placeholder="Message (optional)"
                value={donorNote}
                onChange={(e) => setDonorNote(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button
                  className="flex-1 bg-[#22163F] text-white rounded-lg py-2 text-sm font-semibold"
                  onClick={submitDonation}
                >
                  Donate
                </button>
                <button
                  className="flex-1 bg-white border border-[#ddd] rounded-lg py-2 text-sm"
                  onClick={() => setDonateOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
