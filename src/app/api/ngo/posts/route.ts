// src/app/api/ngo/posts/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Db, MongoClient } from "mongodb";

// --- Connection Helper (copied from other API routes) ---
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
 * GET /api/ngo/posts
 * Fetches all NGO posts, optionally filtered by ngoId, and enriches with stats (likes, comments, profile pic).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let userOid: ObjectId | null = null;
  if (session && session.user) {
      userOid = toObjectId((session.user as { id: string }).id);
  }
  
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const ngoId = searchParams.get("ngoId");
    
    const initialQuery: { ngoId?: ObjectId } = {};
    if (ngoId) {
        try {
            initialQuery.ngoId = new ObjectId(ngoId);
        } catch (e) {
            return NextResponse.json({ error: "Invalid NGO ID" }, { status: 400 });
        }
    }

    const posts = await db.collection("ngo_posts")
      .aggregate([
          { $match: initialQuery },
          { $sort: { createdAt: -1 } },
          { $limit: 50 },
          
          // 1. Join with users collection to get NGO Profile Picture
          {
              $lookup: {
                  from: "users",
                  localField: "ngoId", 
                  foreignField: "_id", 
                  as: "ngoDetails"
              }
          },
          // 2. Deconstruct ngoDetails
          { $unwind: { path: "$ngoDetails", preserveNullAndEmptyArrays: true } },
          
          // 3. --- FIXED Intermediate Project Stage to discard large user fields (no exclusion mixing) ---
          {
              $project: {
                  // Keep all existing fields (inclusion)
                  _id: 1,
                  ngoId: 1,
                  ngoName: 1,
                  title: 1,
                  content: 1,
                  mediaUrls: 1,
                  createdAt: 1,
                  likesCount: 1,
                  likedBy: 1, // Keep for final isLiked calculation
                  commentsCount: 1, // Keep if already initialized
                  
                  // Extract only the profile picture from the joined field
                  ngoProfilePicture: { $ifNull: ["$ngoDetails.profilePicture", null] },
                  
                  // ngoDetails is now implicitly excluded by default inclusion projection behavior
              }
          },
          // -----------------------------------------------------------------------------------------

          // 4. LEFT JOIN to get comments count (references the minimized document)
          {
              $lookup: {
                  from: "ngo_post_comments", 
                  localField: "_id",
                  foreignField: "postId", 
                  as: "comments"
              }
          },
          
          // 5. Final PROJECT stage
          {
              $project: {
                  _id: 1,
                  ngoId: 1,
                  ngoName: 1,
                  title: 1,
                  content: 1,
                  mediaUrls: 1,
                  createdAt: 1,
                  likesCount: { $ifNull: ["$likesCount", 0] },
                  commentsCount: { $size: "$comments" },
                  isLiked: {
                      $in: [userOid, { $ifNull: ["$likedBy", []] }]
                  },
                  ngoProfilePicture: 1 
              }
          }
      ])
      .toArray();

    // Serialize ObjectIds for JSON response
    const formattedPosts = posts.map(post => ({
        ...post,
        _id: post._id.toString(),
        ngoId: post.ngoId.toString(),
        createdAt: post.createdAt.toISOString(),
        mediaUrls: post.mediaUrls || [], 
        ngoProfilePicture: post.ngoProfilePicture || null,
    }));

    return NextResponse.json(formattedPosts, { status: 200 });
  } catch (err) {
    console.error("CRITICAL: Failed to run NGO posts aggregation pipeline:", err);
    return NextResponse.json({ 
        error: "Failed to fetch NGO posts (check console for server error details).",
        detail: err instanceof Error ? err.message : "Unknown database error"
    }, { status: 500 });
  }
}

/**
 * POST /api/ngo/posts
 * (Remains unchanged)
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user as { role: string }).role !== "ngo") {
    return NextResponse.json({ error: "Unauthorized. Only NGOs can create posts." }, { status: 403 });
  }

  try {
    const { db } = await connectToDatabase();
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
      mediaUrls: mediaUrls || [],
      likesCount: 0,
      likedBy: [],
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