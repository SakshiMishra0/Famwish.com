import NextAuth, { DefaultSession } from "next-auth";

export type UserRole = "admin" | "bidder" | "celebrity" | "ngo" | null;
export type AuthProvider = "google" | "credentials" | string | null;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      profileCompleted: boolean;
      authProvider: AuthProvider;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    profileCompleted: boolean;
    authProvider: AuthProvider;
  }
}