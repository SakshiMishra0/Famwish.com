// src/app/api/auctions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId, Db } from "mongodb";

/**
 * Cached Mongo client for Next.js runtime to avoid connection explosion.
 */
let cached: { client: MongoClient; db: Db } | undefined;

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached) return cached;

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
 * Helper to normalize a Mongo document to JSON-friendly object
 */
function normalizeDoc(doc: any) {
  if (!doc) return doc;
  const copy: any = { ...doc };
  if (copy._id && typeof copy._id.toString === "function") copy._id = copy._id.toString();
  if (copy.createdBy && typeof copy.createdBy.toString === "function") copy.createdBy = copy.createdBy.toString();
  if (copy.topBidderId && typeof copy.topBidderId.toString === "function") copy.topBidderId = copy.topBidderId.toString();
  return copy;
}

/**
 * NOTE: Next.js generated types for route handlers expect `context.params` to be a Promise
 * in this app / version. So we use `context: { params: Promise<{ id: string }> }`
 * and `await context.params` to satisfy the type checker.
 */

/** GET /api/auctions/[id] */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { db } = await connectToDatabase();
    const { id } = await context.params;
    const oid = toObjectId(id);

    if (!oid) {
      return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
    }

    const auction = await db.collection("auctions").findOne({ _id: oid });
    if (!auction) return NextResponse.json({ error: "Auction not found" }, { status: 404 });

    return NextResponse.json(normalizeDoc(auction), { status: 200 });
  } catch (err: any) {
    console.error("GET /api/auctions/[id] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

/** PUT /api/auctions/[id] */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { db } = await connectToDatabase();
    const { id } = await context.params;
    const oid = toObjectId(id);

    if (!oid) {
      return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Prevent protected fields from being overwritten
    const { _id, createdAt, ...updates } = body;

    const result = await db
      .collection("auctions")
      .findOneAndUpdate({ _id: oid }, { $set: updates }, { returnDocument: "after" });

    if (!result || !result.value) {
  return NextResponse.json({ error: "Auction not found" }, { status: 404 });
}

const updated = result.value; // now TS knows it's present
return NextResponse.json(normalizeDoc(updated), { status: 200 });

  } catch (err: any) {
    console.error("PUT /api/auctions/[id] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

/** DELETE /api/auctions/[id] */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { db } = await connectToDatabase();
    const { id } = await context.params;
    const oid = toObjectId(id);

    if (!oid) {
      return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
    }

    const result = await db.collection("auctions").deleteOne({ _id: oid });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/auctions/[id] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
