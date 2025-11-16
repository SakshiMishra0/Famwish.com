// src/app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const userId = (session.user as { id: string }).id;

    // Find all notifications for this user, sorted newest first
    const notifications = await db.collection("notifications")
      .find({
        userId: new ObjectId(userId),
      })
      .sort({ createdAt: -1 }) // <-- Show newest first
      .toArray();

    return NextResponse.json(notifications);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}