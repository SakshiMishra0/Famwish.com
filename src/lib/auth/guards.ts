import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Session } from "next-auth";
import type { UserRole } from "@/types/next-auth";

const createErrorResponse = (
  status: number,
  error: string,
  message: string
) => {
  return NextResponse.json(
    {
      success: false,
      error,
      message,
    },
    {
      status,
    }
  );
};

export async function requireAuth(): Promise<Session> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw createErrorResponse(401, "Unauthorized", "Authentication required.");
  }

  if (!session.user.id || !session.user.email) {
    throw createErrorResponse(401, "Unauthorized", "Authentication required.");
  }

  if (typeof session.user.role === "undefined") {
    session.user.role = null;
  }

  if (typeof session.user.profileCompleted !== "boolean") {
    session.user.profileCompleted = false;
  }

  if (!session.user.authProvider) {
    session.user.authProvider = "credentials";
  }

  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();

  if (session.user.role !== "admin") {
    throw createErrorResponse(403, "Forbidden", "Admin access required.");
  }

  return session;
}

export async function requireRole(role: UserRole): Promise<Session> {
  const session = await requireAuth();

  if (session.user.role !== role) {
    throw createErrorResponse(403, "Forbidden", `Role ${role} required.`);
  }

  return session;
}

export async function requireAnyRole(roles: UserRole[]): Promise<Session> {
  const session = await requireAuth();

  if (!roles.includes(session.user.role)) {
    throw createErrorResponse(403, "Forbidden", "Access denied for current role.");
  }

  return session;
}
