import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const celebs = await db.collection("users")
      .find({ role: 'celebrity' })
      .project({ _id: 1, name: 1 })
      .toArray();
      
    // Format to match the frontend interface
    const formattedCelebs = celebs.map(c => ({
      id: c._id.toString(),
      name: c.name,
      desc: "VIP Partner", // Mock description
      followers: Math.floor(Math.random() * 500000) + 10000 // Mock follower count for UI
    }));

    return NextResponse.json(formattedCelebs, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch celebs list:", error);
    return NextResponse.json({ error: "Failed to load celebs" }, { status: 500 });
  }
}
