// src/app/ngos/page.tsx
// This is now the "LinkedIn Feed" style page
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import NgoFeed from "@/components/NgoFeed";
import Link from "next/link";
import { Plus } from "lucide-react";

// Define type for NGO data (minimal projection)
interface NgoListing {
    id: string;
    name: string;
    profilePicture: string | null;
}

// Function to fetch NGO list for the sidebar (Server Component data fetching)
async function getRegisteredNgos(): Promise<NgoListing[]> {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        const ngos = await db.collection("users")
            .find({ role: 'ngo' })
            .limit(10) // Show top 10 in the sidebar
            .project({ _id: 1, name: 1, profilePicture: 1 })
            .toArray();

        // Map DB data to the listing format
        return ngos.map((user) => ({
            id: user._id.toString(),
            name: user.name,
            profilePicture: user.profilePicture || null,
        }));

    } catch (error) {
        console.error("Failed to fetch registered NGOs:", error);
        return [];
    }
}


export default async function NgosPage() {
    const session = await getServerSession(authOptions);
    const isNgo = (session?.user as { role: string })?.role === 'ngo';
    
    // Fetch NGO list for the sidebar
    const ngoList = await getRegisteredNgos();

    return (
        <div className="pt-10 grid grid-cols-1 lg:grid-cols-[1.5fr_0.9fr] gap-8">
            
            {/* LEFT COLUMN: NGO POST FEED */}
            <div>
                <h1 className="text-4xl font-extrabold mb-6 text-[#22163F]">
                    NGO Impact Feed
                </h1>

                {isNgo && (
                    <Link 
                        href="/ngo/create-post"
                        className="mb-6 py-3 px-5 bg-[#D9A441] text-[#22163F] font-bold rounded-xl shadow-md hover:bg-[#C8943D] transition flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> Create New Impact Post
                    </Link>
                )}

                <h2 className="text-2xl font-bold mb-4 text-[#22163F]">Recent Posts & Updates</h2>

                <NgoFeed />
            </div>

            {/* RIGHT COLUMN: NGO LISTING SIDEBAR */}
            <aside className="space-y-6 sticky top-6 h-fit">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E8E3DB]">
                    <h3 className="font-bold text-xl mb-4 text-[#22163F]">
                        Our NGO Partners
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4">
                        Click on an organization to see their full profile and contribution ledger.
                    </p>

                    <div className="space-y-3">
                        {ngoList.length > 0 ? (
                            ngoList.map((ngo) => (
                                <Link 
                                    key={ngo.id}
                                    // Links to the new dynamic profile page
                                    href={`/ngo/${ngo.id}`} 
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition border border-[#E8E3DB] bg-white shadow-sm"
                                >
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex-shrink-0">
                                        {/* Fallback avatar for now */}
                                        {ngo.profilePicture && (
                                             <img src={ngo.profilePicture} alt={ngo.name} className="w-full h-full object-cover rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{ngo.name}</p>
                                        <p className="text-xs text-gray-500">Verified Partner</p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No registered NGO partners found.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E8E3DB] text-center">
                    <h3 className="font-bold text-lg mb-2">Want to Partner?</h3>
                    <p className="text-sm text-gray-600">Register your charity on Famwish to start raising funds.</p>
                    <Link href="/auth?tab=signup" className="mt-4 inline-block py-2 px-5 bg-[#2F235A] text-white font-semibold rounded-lg hover:bg-[#463985] transition">
                        Register as NGO
                    </Link>
                </div>
            </aside>
        </div>
    );
}