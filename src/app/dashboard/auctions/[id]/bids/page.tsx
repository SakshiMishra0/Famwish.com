// src/app/dashboard/auctions/[id]/bids/page.tsx
import { ArrowLeft, Hand, Clock, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb"; // Import the MongoDB client
import { ObjectId } from "mongodb"; // Import ObjectId for database queries

// Helper to format currency
const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Helper to format timestamp
function formatTimestamp(timestamp: string): string {
    try {
        const date = new Date(timestamp);
        // Use a standard format that works across environments
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    } catch {
        return timestamp;
    }
}

// --- Data Interfaces ---

interface BidHistoryItem {
    userId: string;
    userName: string;
    amount: number;
    timestamp: string;
}

interface AuctionDetails {
    _id: string;
    title: string;
    bidsHistory: BidHistoryItem[];
}

interface Props {
  params: {
    id: string | Promise<string>;
  };
}

// --- Data Fetching Function for Auction Details ---

async function getAuctionDetails(auctionId: string): Promise<AuctionDetails | null> {
    const isDev = process.env.NODE_ENV === 'development';
    const baseUrl = process.env.NEXTAUTH_URL || (isDev ? 'http://localhost:3000' : null);
    
    if (!baseUrl) {
        console.error("CRITICAL: NEXTAUTH_URL is not defined.");
        return null;
    }
    
    const apiURL = `${baseUrl}/api/auctions/${auctionId}`;

    const res = await fetch(apiURL, { cache: 'no-store' });

    if (!res.ok) {
        console.error(`API Fetch FAILED for auction ${auctionId}. Status: ${res.status}`);
        return null;
    }

    const data: any = await res.json();
    
    if (!data || !data._id || !Array.isArray(data.bidsHistory)) {
        return null;
    }

    return {
        _id: data._id,
        title: data.title,
        bidsHistory: data.bidsHistory as BidHistoryItem[],
    };
}


// --- NEW: Data Fetching Function for Bidder Profiles ---
// Returns a map of { userId: profilePictureBase64Url }
async function getBidderProfiles(userIds: string[]): Promise<Map<string, string>> {
    const profileMap = new Map<string, string>();
    if (userIds.length === 0) return profileMap;

    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const uniqueObjectIds = userIds.map(id => new ObjectId(id));

        const users = await db.collection("users")
            .find({ _id: { $in: uniqueObjectIds } })
            .project({ _id: 1, profilePicture: 1 })
            .toArray();

        for (const user of users) {
            if (user.profilePicture) {
                // Store the Base64 URL using the string ID
                profileMap.set(user._id.toString(), user.profilePicture as string);
            }
        }
    } catch (e) {
        console.error("Failed to fetch bidder profiles:", e);
        // Return an empty map on error to prevent cascading failure
        return new Map();
    }

    return profileMap;
}

// --- Main Page Component ---

export default async function BidHistoryPage({ params }: Props) {
    const resolvedParams = await params;
    const auctionId = resolvedParams.id as string;
    
    if (!auctionId || auctionId === 'undefined') { 
        return notFound(); 
    }

    const auction = await getAuctionDetails(auctionId);
    
    if (!auction) {
        return notFound();
    }

    // 1. Get unique bidder IDs
    const uniqueBidders = [...new Set(auction.bidsHistory.map(bid => bid.userId))];

    // 2. Fetch all bidder profiles in parallel
    const bidderProfiles = await getBidderProfiles(uniqueBidders);
    
    // Reverse the history array to display the newest bids at the top
    const sortedBids = auction.bidsHistory.slice().reverse();
    
    const totalBids = sortedBids.length;

    return (
        <div className="max-w-4xl mx-auto py-10">
            <Link 
                href={`/dashboard/auctions/${auctionId}`} 
                className="flex items-center gap-2 text-lg font-bold mb-6 text-[#22163F] hover:text-[#463985] transition"
            >
                <ArrowLeft size={20} /> Back to Dashboard
            </Link>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#E8E3DB]">
                <h1 className="text-3xl font-extrabold mb-4 flex items-center gap-3 text-[#22163F]">
                    <Hand size={30} className="text-red-500" /> 
                    Bid History: {auction.title}
                </h1>
                
                <p className="text-sm text-gray-600 mb-6">
                    Showing all **{totalBids}** bids placed on this auction. The current highest bid is at the top.
                </p>

                {totalBids === 0 ? (
                    <div className="p-6 text-center text-gray-500 border rounded-xl bg-gray-50">
                        No bids have been placed on this auction yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedBids.map((bid, index) => {
                            // 3. Look up the profile picture
                            const profilePic = bidderProfiles.get(bid.userId);
                            
                            return (
                                <div 
                                    key={bid.timestamp + index} 
                                    className={`flex items-center justify-between p-4 rounded-xl border transition ${
                                        index === 0 ? 'bg-yellow-50 border-yellow-200 shadow-md' : 'bg-gray-50 border-gray-200 hover:bg-white'
                                    }`}
                                >
                                    {/* Bidder Info */}
                                    <div className="flex items-center gap-4">
                                        {/* --- MODIFIED: Profile Picture Display --- */}
                                        {profilePic ? (
                                            <img 
                                                src={profilePic}
                                                alt={`${bid.userName}'s profile`}
                                                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-white flex-shrink-0">
                                                <User size={18} />
                                            </div>
                                        )}
                                        {/* -------------------------------------- */}
                                        <div>
                                            <p className="font-semibold text-sm">
                                                {bid.userName}
                                                {index === 0 && <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-600">HIGH BID</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">User ID: {bid.userId.slice(0, 8)}...</p>
                                        </div>
                                    </div>

                                    {/* Bid Details */}
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-green-700">{formatINR(bid.amount)}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1" suppressHydrationWarning>
                                            <Clock size={12} /> {formatTimestamp(bid.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}