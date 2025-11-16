// src/app/api/wishlist/count/route.ts
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

    // Find the count of wishlist items for this user
    // (Assuming one document per user holding an array of items)
    // A simpler way is to just count documents matching the userId
    const count = await db.collection("wishlists").countDocuments({
      userId: new ObjectId(userId),
    });

    return NextResponse.json({ count });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch wishlist count" },
      { status: 500 }
    );
  }
}