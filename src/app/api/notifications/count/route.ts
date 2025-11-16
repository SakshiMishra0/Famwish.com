// src/app/api/notifications/count/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb"; // <-- We need this to search by user ID

export async function GET() {
  const session = await getServerSession(authOptions);

  // 1. Check if user is logged in
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 2. Get the user's ID from their session
    // We need to cast session.user to access the 'id' property we added in the callback
    const userId = (session.user as { id: string }).id;

    // 3. Find the count of unread notifications
    const count = await db.collection("notifications").countDocuments({
      userId: new ObjectId(userId),
      read: false, // Only count unread ones
    });

    return NextResponse.json({ count });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch notification count" },
      { status: 500 }
    );
  }
}