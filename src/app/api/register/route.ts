// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { fullName, email, password, role } = await request.json();

    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const result = await db.collection("users").insertOne({
      name: fullName,
      email: email,
      password: hashedPassword,
      role: role, // 'bidder', 'celebrity', 'ngo'
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "User created successfully", userId: result.insertedId },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}