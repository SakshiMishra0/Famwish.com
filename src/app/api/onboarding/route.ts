import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!session.user.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      role,
      fullName,
      orgName,
      regNumber,
      instagram,
      profilePicture,
    } = body;

    if (!role || !["bidder", "celebrity", "ngo"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role selected." },
        { status: 400 }
      );
    }

    if (role === "ngo" && !orgName) {
      return NextResponse.json(
        { error: "Organization name is required for NGO." },
        { status: 400 }
      );
    }

    if ((role === "bidder" || role === "celebrity") && !fullName) {
      return NextResponse.json(
        { error: "Full name is required for this role." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const email = session.user.email.toLowerCase();

    const updateData: Record<string, unknown> = {
      role,
      profileCompleted: true,
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      onboardingStep: 2,
      profilePicture: profilePicture ?? session.user.image ?? null,
    };

    if (role === "ngo") {
      updateData.fullName = orgName;
      updateData.regNumber = regNumber ?? "";
      updateData.instagram = "";
    } else {
      updateData.fullName = fullName;
      updateData.instagram = instagram ?? "";
      updateData.regNumber = "";
    }

    const result = await db.collection("users").updateOne(
      { email },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Profile updated." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to complete onboarding." },
      { status: 500 }
    );
  }
}
