// src/app/dashboard/auctions/[id]/manage/page.tsx
// NOTE: NO "use client" directive here. This is an ASYNC SERVER COMPONENT.

import { ArrowLeft, Settings, Clock, FileText, Send } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState, FormEvent } from "react"; // Kept here, assuming the final compiled output relies on this scope.

// --- Interfaces ---

interface AuctionDetails {
    _id: string;
    title: string;
    description: string;
    endDate: string;
    currentHighBid: number;
    bids: number;
    titleImage?: string | null;
}

interface Props {
  params: {
    // We treat the ID as resolved string | Promise<string> for the Server Component
    id: string | Promise<string>; 
  };
}

// --- Data Fetching Utility (Runs only on the server) ---

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
    
    if (!data || !data._id) {
        return null;
    }

    return {
        _id: data._id,
        title: data.title,
        description: data.description,
        endDate: data.endDate,
        currentHighBid: data.currentHighBid || 0,
        bids: data.bids || 0,
        titleImage: data.titleImage || null,
    };
}


// --- Inner Client Component (Handles Form State and Interaction) ---

const ManageAuctionForm: React.FC<{ initialData: AuctionDetails }> = ({ initialData }) => {
    "use client"; // Explicitly mark this internal component as client-side
    
    // We use regular imports here, as the "use client" directive above protects them.
    
    const [formData, setFormData] = useState({
        title: initialData.title,
        description: initialData.description,
        // Format ISO string to local datetime string for input field
        endDate: initialData.endDate.substring(0, 16), 
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    
    const isLive = new Date(initialData.endDate) > new Date();
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value })); 
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        const updates = {
            title: formData.title,
            description: formData.description,
            // Convert back to ISO string for the API
            endDate: new Date(formData.endDate).toISOString(), 
        };

        try {
            const res = await fetch(`/api/auctions/${initialData._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update auction details.");
            }
            
            setMessageType('success');
            setMessage('Auction successfully updated!');
            
        } catch (err: any) {
            setMessageType('error');
            setMessage(err.message || 'An unexpected error occurred during update.');
        } finally {
            setLoading(false);
        }
    };
    
    const messageClass = messageType === 'success' 
        ? "bg-green-100 border-green-300 text-green-800" 
        : "bg-red-100 border-red-300 text-red-800";


    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#E8E3DB]">
            <h1 className="text-3xl font-extrabold mb-4 flex items-center gap-3 text-[#22163F]">
                <Settings size={30} className="text-[#D9A441]" /> 
                Manage Auction: {initialData.title}
            </h1>
            
            <div className="flex items-center gap-6 mb-8 p-4 border border-[#E8E3DB] rounded-xl bg-gray-50">
                <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
                    {initialData.titleImage ? (
                        <img src={initialData.titleImage} alt={initialData.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Image</div>
                    )}
                </div>
                <div>
                    <p className="text-xl font-bold text-[#22163F]">Current High Bid: ₹{initialData.currentHighBid.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-gray-600">{initialData.bids} total bids have been placed.</p>
                    {initialData.bids > 0 && (
                        <p className="text-xs text-red-500 font-semibold mt-1">Note: Bid details cannot be changed once bidding has started.</p>
                    )}
                </div>
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-xl border font-semibold text-sm ${messageClass}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Section 1: Item Details */}
                <h2 className="text-xl font-bold flex items-center gap-2 pt-4 border-t">
                    <FileText size={20} className="text-[#2F235A]" /> Item Details
                </h2>
                
                <div>
                    <label htmlFor="title" className="font-semibold text-sm mb-1 block text-[#22163F]">Auction Title</label>
                    <input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-[#D5D0C7] text-sm shadow-sm focus:border-[#2F235A] focus:ring-1 focus:ring-[#2F235A] transition"
                        required
                    />
                </div>
                
                <div>
                    <label htmlFor="description" className="font-semibold text-sm mb-1 block text-[#22163F]">Detailed Description</label>
                    <textarea
                        id="description"
                        name="description"
                        rows={6}
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-[#D5D0C7] text-sm shadow-sm focus:border-[#2F235A] focus:ring-1 focus:ring-[#2F235A] transition resize-none"
                        required
                    />
                </div>

                {/* Section 2: Timing */}
                <h2 className="text-xl font-bold flex items-center gap-2 pt-4 border-t">
                    <Clock size={20} className="text-[#2F235A]" /> Auction Timing
                </h2>

                <div className="md:grid md:grid-cols-2 md:gap-4">
                    <div>
                        <label htmlFor="endDate" className="font-semibold text-sm mb-1 block text-[#22163F]">End Date & Time</label>
                        <input
                            id="endDate"
                            name="endDate"
                            type="datetime-local"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-[#D5D0C7] text-sm shadow-sm focus:border-[#2F235A] focus:ring-1 focus:ring-[#2F235A] transition"
                            required
                        />
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                        <p className={`text-sm font-semibold p-3 rounded-xl border ${isLive ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                            {isLive 
                                ? `Auction is LIVE. Extending the end date will allow more bidding.` 
                                : `Auction is ENDED. Changing the end date will reopen bidding.`}
                        </p>
                    </div>
                </div>
                
                {/* Submit Button */}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-6 py-3 rounded-xl flex items-center justify-center gap-2 bg-[#D9A441] hover:bg-[#C8943D] text-[#22163F] font-extrabold disabled:bg-gray-400 disabled:text-gray-600 transition"
                >
                    <Send size={20} /> {loading ? "Saving Changes..." : "Save Changes"}
                </button>
                
            </form>
        </div>
    );
};


// --- Outer Server Component (Resolves Promise Error) ---

export default async function ManageAuctionPage({ params }: Props) {
    // ✅ CRITICAL FIX: The Server Component safely uses await to resolve the promise-like params object
    const resolvedParams = await params;
    const auctionId = resolvedParams.id as string;

    if (!auctionId || auctionId === 'undefined') { 
        return notFound(); 
    }

    const initialData = await getAuctionDetails(auctionId);

    if (!initialData) {
        return notFound();
    }

    return (
        <div className="max-w-4xl mx-auto py-10">
            <Link 
                href={`/dashboard/auctions/${auctionId}`} 
                className="flex items-center gap-2 text-lg font-bold mb-6 text-[#22163F] hover:text-[#463985] transition"
            >
                <ArrowLeft size={20} /> Back to Dashboard
            </Link>
            
            {/* Pass the fully resolved data to the inner Client Component */}
            <ManageAuctionForm initialData={initialData} />
            
        </div>
    );
}