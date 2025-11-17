// src/app/ngo/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NgoPost } from "@/types";
import PostCard from "@/components/PostCard";
import NgoProfileActions from "@/components/NgoProfileActions"; // <-- NEW IMPORT

// Helper to format currency
const formatINR = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN");

// --- Data Interfaces (kept for context) ---
interface LedgerBlock {
    index: number;
    timestamp: string;
    type: "genesis" | "donation";
    amount: number;
    donor: string;
    note: string;
    prevHash: string;
    hash: string;
}

interface NgoData {
    id: string;
    name: string; // Organization Name
    email: string;
    profilePicture: string | null;
    totalFunds: number;
    donorsCount: number;
    ledger: LedgerBlock[];
}

interface Props {
  params: {
    id: string | Promise<string>;
  };
}

// --- Data Fetching Functions ---

async function getNgoData(id: string): Promise<NgoData | null> {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const ngoOid = new ObjectId(id);

        // 1. Fetch NGO User Details
        const user = await db.collection("users").findOne(
            { _id: ngoOid, role: 'ngo' },
            { projection: { name: 1, email: 1, profilePicture: 1 } } 
        );

        if (!user) return null;

        // 2. Mock Ledger Data (since a dedicated ledger DB isn't set up yet)
        const mockLedger: LedgerBlock[] = [
            { index: 0, timestamp: new Date().toISOString(), type: "genesis", amount: 0, donor: "system", note: "Genesis block", prevHash: "0", hash: "a0a0a0" },
            { index: 1, timestamp: new Date(Date.now() - 86400000).toISOString(), type: "donation", amount: 5000, donor: "Aarav", note: "Back-to-school kits", prevHash: "a0a0a0", hash: "b1b1b1" },
            { index: 2, timestamp: new Date(Date.now() - 172800000).toISOString(), type: "donation", amount: 18546, donor: "Samayran Singh", note: "Auction proceeds - Vintage Art", prevHash: "b1b1b1", hash: "c2c2c2" },
        ];
        
        const totalFunds = mockLedger.filter((b) => b.type === "donation").reduce((s, b) => s + b.amount, 0);
        const donorsCount = new Set(mockLedger.filter((b) => b.type === "donation").map((b) => b.donor)).size;


        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture || null,
            totalFunds,
            donorsCount,
            ledger: mockLedger as LedgerBlock[],
        };

    } catch (e) {
        console.error("Failed to fetch NGO data:", e);
        return null;
    }
}

async function getNgoPosts(ngoId: string): Promise<NgoPost[]> {
    const isDev = process.env.NODE_ENV === 'development';
    const baseUrl = process.env.NEXTAUTH_URL || (isDev ? 'http://localhost:3000' : null);
    
    if (!baseUrl) return [];

    const apiURL = `${baseUrl}/api/ngo/posts?ngoId=${ngoId}`;
    try {
        // Fetch posts for this specific NGO
        const res = await fetch(apiURL, { cache: 'no-store' });
        if (!res.ok) {
            // Log the error but continue with an empty array
            console.error(`Failed to fetch posts for ${ngoId}. Status: ${res.status}`);
            return [];
        }
        const data: NgoPost[] = await res.json();
        return data;
    } catch (e) {
        console.error("Error fetching NGO posts:", e);
        return [];
    }
}

// --- Main Page Component ---
export default async function NgoProfilePage({ params }: Props) {
    const resolvedParams = await params;
    const ngoId = resolvedParams.id as string;

    if (!ngoId || ngoId === 'undefined') {
        return notFound();
    }

    // Fetch initial data in parallel
    const [ngoData, recentPosts] = await Promise.all([
        getNgoData(ngoId),
        getNgoPosts(ngoId),
    ]);

    if (!ngoData) {
        return notFound();
    }
    
    const { name, totalFunds, donorsCount, ledger } = ngoData;

    // Derived values from the old file, now calculated with fetched data
    const donorsLeaderboard = [
        { donor: "Aarav", amt: 5000 },
        { donor: "Samayran Singh", amt: 18546 },
    ].sort((a, b) => b.amt - a.amt)
     .slice(0, 6);

    const recentAuctions = [
        { title: "Signed Guitar", bid: 3800 },
        { title: "Vintage Art", bid: 4300 },
    ];
    
    // Reverse the ledger to show newest first for the list
    const sortedLedger = ledger.slice().reverse();


    return (
        <div className="min-h-screen bg-[#F6F3EC]">
          <div className="max-w-[1200px] mx-auto pt-6 pb-8">
            <Link 
                href="/ngos" 
                className="flex items-center gap-2 text-lg font-bold mb-6 text-[#22163F] hover:text-[#463985] transition"
            >
                <ArrowLeft size={20} /> Back to NGO Feed
            </Link>

            {/* GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
              
              {/* LEFT MAIN */}
              <div>
                {/* HERO */}
                <div className="bg-white p-5 rounded-2xl shadow-xl border border-[#E8E3DB] flex gap-5 items-start">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-b from-[#e9e9e9] to-[#d3d3d3] flex items-center justify-center text-xs text-gray-500">
                        {ngoData.profilePicture ? (
                            <img src={ngoData.profilePicture} alt={name} className="w-full h-full object-cover rounded-xl" />
                        ) : 'Logo'}
                    </div>

                  <div className="flex-1">
                    <h1 className="text-3xl font-extrabold text-[#22163F] leading-tight">
                      {name}{" "}
                      <span className="text-[#D9A441] text-sm ml-2">● VERIFIED</span>
                    </h1>

                    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-[#F4F7FF] text-[#22163F] text-sm font-semibold">
                      Verified NGO — ID: <span className="font-bold ml-1">{ngoId.slice(0, 8)}...</span>
                    </div>

                    <p className="text-sm text-[#6B6B6B] mt-3 max-w-[70%]">
                      Registered charity focused on girls&apos; education, school supplies
                      and community learning programs.
                    </p>

                    {/* STATS */}
                    <div className="flex flex-wrap gap-3 mt-4">
                      <div className="bg-[#FAF9F7] rounded-xl px-4 py-3 min-w-[120px] text-center border border-[#E8E3DB] shadow-sm">
                        <strong className="block text-[18px] text-[#22163F]">
                          {formatINR(totalFunds)}
                        </strong>
                        <span className="text-xs text-[#6B6B6B]">Total funds received</span>
                      </div>
                      <div className="bg-[#FAF9F7] rounded-xl px-4 py-3 min-w-[120px] text-center border border-[#E8E3DB] shadow-sm">
                        <strong className="block text-[18px] text-[#22163F]">
                          {donorsCount}
                        </strong>
                        <span className="text-xs text-[#6B6B6B]">Donors</span>
                      </div>
                      <div className="bg-[#FAF9F7] rounded-xl px-4 py-3 min-w-[120px] text-center border border-[#E8E3DB] shadow-sm">
                        <strong className="block text-[18px] text-[#22163F]">3</strong>
                        <span className="text-xs text-[#6B6B6B]">Active auctions</span>
                      </div>
                    </div>

                    {/* HERO ACTIONS - REPLACED WITH CLIENT COMPONENT */}
                    {/* Pass the ngoName so the component can use it in mock actions */}
                    <NgoProfileActions ngoName={name} />
                  </div>
                </div>

                {/* --- NGO POSTS SECTION --- */}
                <h2 className="text-2xl font-extrabold mt-8 mb-4 text-[#22163F]">Recent Impact Posts</h2>
                {recentPosts.length > 0 ? (
                    <div className="space-y-6">
                        {recentPosts.map(post => (
                            <PostCard key={post._id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-gray-600 border rounded-xl bg-white shadow-sm">
                        {name} has not published any impact posts yet.
                    </div>
                )}
                {/* ------------------------- */}
                
              </div>

              {/* RIGHT SIDEBAR (Donors and Auctions - Ledger actions are now in NgoProfileActions) */}
              <aside className="flex flex-col gap-8 sticky top-6 h-fit">

                {/* LEDGER/ACTION CARD CONTENT (The new NgoProfileActions component includes the Ledger Card now) */}
                <NgoProfileActions ngoName={name} />

                {/* DONORS + AUCTIONS (Combined Block) */}
                <div className="bg-white rounded-2xl shadow-xl border border-[#E8E3DB] p-5">
                    <h3 className="text-[#22163F] font-semibold text-xl mb-4">Top Donors (Mock)</h3>
                    <div className="flex flex-col gap-3 border-b pb-4 mb-4">
                        {donorsLeaderboard.map((d) => (
                            <div
                            key={d.donor}
                            className="flex items-center gap-3 px-2 py-1 rounded-lg"
                            >
                            <div className="w-10 h-10 rounded-full bg-gray-300" />
                            <div>
                                <div className="font-semibold text-[#22163F] text-sm">
                                {d.donor}
                                </div>
                                <div className="text-xs text-[#6B6B6B]">
                                {formatINR(d.amt)} donated
                                </div>
                            </div>
                            </div>
                        ))}
                    </div>

                    <h3 className="text-[#22163F] font-semibold text-xl mb-4">Recent Auctions for {name}</h3>
                    <div className="mt-3 flex flex-wrap gap-3">
                        {recentAuctions.map((a) => (
                            <div
                            key={a.title}
                            className="border border-[#E8E3DB] rounded-xl p-3 min-w-[120px] bg-[#FAF9F7] shadow-sm flex-1"
                            >
                            <div className="h-16 rounded-md bg-gray-200" />
                            <div className="font-semibold text-sm text-[#22163F] mt-2 leading-tight">
                                {a.title}
                            </div>
                            <div className="text-xs text-[#6B6B6B]">
                                {formatINR(a.bid)}
                            </div>
                            </div>
                        ))}
                    </div>
                </div>

              </aside>

            </div>
          </div>
        </div>
    );
}