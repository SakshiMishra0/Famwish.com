// src/app/api/ngo/posts/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Db, MongoClient } from "mongodb";

// --- CONNECTION CACHING ---
let cached: { client: MongoClient; db: Db } | undefined;

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached) {
    return cached;
  }
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set.");
  }
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGODB_DB || "famwish";
  const db = client.db(dbName);
  cached = { client, db };
  return cached;
}

/**
 * Safely convert string id to ObjectId. Returns null if invalid.
 */
function toObjectId(id?: string): ObjectId | null {
  if (!id) return null;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

/**
 * GET /api/ngo/posts
 * Fetches all NGO posts, optionally filtered by ngoId.
 */
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const ngoId = searchParams.get("ngoId");
    
    const query: { ngoId?: ObjectId } = {};
    if (ngoId) {
        try {
            query.ngoId = new ObjectId(ngoId);
        } catch (e) {
            return NextResponse.json({ error: "Invalid NGO ID" }, { status: 400 });
        }
    }

    const posts = await db.collection("ngo_posts")
      .find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(50)
      .toArray();

    // Serialize ObjectIds for JSON response
    const formattedPosts = posts.map(post => ({
        ...post,
        _id: post._id.toString(),
        ngoId: post.ngoId.toString(),
        createdAt: post.createdAt.toISOString(),
        // --- IMPORTANT: Ensure mediaUrls defaults to an array
        mediaUrls: post.mediaUrls || [], 
    }));

    return NextResponse.json(formattedPosts, { status: 200 });
  } catch (err) {
    console.error("GET /api/ngo/posts error:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

/**
 * POST /api/ngo/posts
 * Creates a new NGO post. Must be an authenticated user with role 'ngo'.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user as { role: string }).role !== "ngo") {
    return NextResponse.json({ error: "Unauthorized. Only NGOs can create posts." }, { status: 403 });
  }

  try {
    const { db } = await connectToDatabase();
    // --- MODIFIED: Expect mediaUrls instead of mediaUrl
    const { title, content, mediaUrls } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Post content is required." }, { status: 400 });
    }

    const userId = (session.user as { id: string }).id;
    
    const ngoUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    const ngoName = ngoUser?.name || "Verified NGO";
    
    const newPost = {
      ngoId: new ObjectId(userId),
      ngoName: ngoName,
      title: title || null,
      content: content.trim(),
      mediaUrls: mediaUrls || [], // --- MODIFIED: Store the array
      createdAt: new Date(),
    };

    const result = await db.collection("ngo_posts").insertOne(newPost);

    return NextResponse.json(
      { message: "Post created successfully", postId: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/ngo/posts error:", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}