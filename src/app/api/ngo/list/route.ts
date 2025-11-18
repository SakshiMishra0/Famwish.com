// src/app/api/ngos/list/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

/**
 * GET: Fetches a list of all registered NGO's ID and Name for the Create Auction dropdown.
 */
export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        const ngos = await db.collection("users")
            .find({ role: 'ngo' })
            .project({ _id: 1, name: 1 }) // Only project ID and Name
            .toArray();

        // Map ObjectId to string for client consumption
        const formattedNgos = ngos.map((ngo) => ({
            id: ngo._id.toString(),
            name: ngo.name,
        }));

        return NextResponse.json(formattedNgos);

    } catch (error) {
        console.error("Failed to fetch NGO list:", error);
        return NextResponse.json({ error: "Failed to load NGO list" }, { status: 500 });
    }
}