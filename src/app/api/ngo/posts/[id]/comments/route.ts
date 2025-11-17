// src/app/api/ngo/posts/[id]/comments/route.ts
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
 * GET /api/ngo/posts/[id]/comments
 * Fetches all comments for a specific post, enriched with user data.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { db } = await connectToDatabase();
    const resolvedParams = await context.params;
    const postId = resolvedParams.id;
    const postOid = toObjectId(postId);

    if (!postOid) {
      return NextResponse.json({ error: "Invalid Post ID" }, { status: 400 });
    }

    // Use aggregate pipeline to join with users collection
    const comments = await db.collection("ngo_post_comments") 
      .aggregate([
        { $match: { postId: postOid } },
        { $sort: { createdAt: -1 } }, 
        { $limit: 50 },
        // 1. Join with users collection
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails"
          }
        },
        // 2. Deconstruct userDetails (should only be one user)
        { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
        // 3. Project the necessary fields
        {
          $project: {
            _id: 1,
            postId: 1,
            userId: 1,
            userName: 1,
            text: 1,
            createdAt: 1,
            // Extract the profilePicture from the userDetails array
            profilePicture: { $ifNull: ["$userDetails.profilePicture", null] } 
          }
        }
      ])
      .toArray();

    // Serialize ObjectIds for JSON response
    const formattedComments = comments.map(comment => ({
        ...comment,
        _id: comment._id.toString(),
        postId: comment.postId.toString(), 
        userId: comment.userId.toString(),
        userName: comment.userName || 'User',
        createdAt: comment.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedComments, { status: 200 });
  } catch (err) {
    console.error("GET /api/ngo/posts/[id]/comments error:", err);
    return NextResponse.json({ error: "Server error fetching comments" }, { status: 500 });
  }
}

/**
 * POST /api/ngo/posts/[id]/comments
 * (This function remains unchanged, as it only handles creation)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated. Please log in to comment." }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const resolvedParams = await context.params;
    const postId = resolvedParams.id;
    const postOid = toObjectId(postId);
    
    const userId = (session.user as { id: string }).id;
    const userName = (session.user as { id: string, name: string }).name;

    if (!postOid) {
      return NextResponse.json({ error: "Invalid Post ID" }, { status: 400 });
    }

    const { text } = await request.json();
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Comment text is empty" }, { status: 400 });
    }
    
    const newComment = {
      postId: postOid,
      userId: new ObjectId(userId),
      userName: userName,
      text: text.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection("ngo_post_comments").insertOne(newComment);

    return NextResponse.json(
      { message: "Comment posted successfully", commentId: result.insertedId.toString() },
      { status: 201 }
    );

  } catch (err) {
    console.error("POST /api/ngo/posts/[id]/comments error:", err);
    return NextResponse.json({ error: "Server error posting comment" }, { status: 500 });
  }
}