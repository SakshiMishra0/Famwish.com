// src/app/api/ngo/posts/[id]/like/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Db, MongoClient } from "mongodb";

// --- Connection Helper ---
let cached: { client: MongoClient; db: Db } | undefined;
async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached) return cached;
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!uri) throw new Error("MONGODB_URI environment variable is not set.");
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGODB_DB || "famwish";
  const db = client.db(dbName);
  cached = { client, db };
  return cached;
}
function toObjectId(id?: string): ObjectId | null {
  if (!id) return null;
  try { return new ObjectId(id); } catch { return null; }
}

/**
 * POST /api/ngo/posts/[id]/like
 * Toggles a like for the authenticated user on the specified post.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated to like a post." }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const resolvedParams = await context.params;
    const postId = resolvedParams.id;
    const postOid = toObjectId(postId);
    const userOid = new ObjectId((session.user as { id: string }).id);

    if (!postOid) {
      return NextResponse.json({ error: "Invalid Post ID" }, { status: 400 });
    }
    
    const post = await db.collection("ngo_posts").findOne({ _id: postOid });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Determine current status
    const likedBy: ObjectId[] = post.likedBy || [];
    const isCurrentlyLiked = likedBy.some(id => id.equals(userOid));
    
    let updateOperation;
    let newIsLiked: boolean;

    if (isCurrentlyLiked) {
        // UNLIKE: pull the user's ID from the array and decrement count
        updateOperation = { $pull: { likedBy: userOid }, $inc: { likesCount: -1 } };
        newIsLiked = false;
    } else {
        // LIKE: push the user's ID to the array and increment count
        updateOperation = { $push: { likedBy: userOid }, $inc: { likesCount: 1 } };
        newIsLiked = true;
    }

    // Update the post. 
    // FIX: Cast updateOperation to 'any' to resolve the TypeScript compilation error
    await db.collection("ngo_posts").updateOne(
        { _id: postOid }, 
        updateOperation as any, 
        { upsert: true } 
    );

    // Fetch the new count to return
    const updatedPost = await db.collection("ngo_posts").findOne({ _id: postOid }, { projection: { likesCount: 1 } });
    const newLikesCount = updatedPost?.likesCount || 0;

    return NextResponse.json({ 
        message: newIsLiked ? "Liked" : "Unliked",
        isLiked: newIsLiked,
        newLikesCount: newLikesCount
    }, { status: 200 });

  } catch (err) {
    console.error("POST /api/ngo/posts/[id]/like error:", err);
    return NextResponse.json({ error: "Server error toggling like" }, { status: 500 });
  }
}