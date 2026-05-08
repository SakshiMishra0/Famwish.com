// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { AuthOptions, SessionStrategy } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcrypt";
import { Adapter } from "next-auth/adapters";
import clientPromise from "@/lib/mongodb";

import type { AuthProvider, UserRole } from "@/types/next-auth";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
}

const safeString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB,
  }) as Adapter,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "text",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing credentials");
        }

        const db = await getDb();

        const email = credentials.email.toLowerCase();

        const user = await db.collection("users").findOne({
          email,
        });

        if (!user) {
          throw new Error("No user found");
        }

        if (!user.password) {
          throw new Error("Please login with Google");
        }

        const valid = await bcrypt.compare(
          credentials.password,
          user.password as string
        );

        if (!valid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          name: user.name || "",
          email: user.email,
          role: (user.role as UserRole) ?? null,
          profileCompleted: Boolean(user.profileCompleted),
          authProvider:
            (user.authProvider as AuthProvider) ?? "credentials",
        } as any;
      },
    }),
  ],

  session: {
    strategy: "jwt" as SessionStrategy,
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/auth",
  },

  callbacks: {
    async signIn({ user, account }) {
      const db = await getDb();

      if (account?.provider === "google" && user.email) {
        const email = user.email.toLowerCase();

        const now = new Date();

        const isDevAdmin =
          process.env.NODE_ENV !== "production" &&
          process.env.ADMIN_EMAIL &&
          email === process.env.ADMIN_EMAIL.toLowerCase();

        await db.collection("users").updateOne(
          { email },

          {
            $set: {
              email,
              name: safeString(user.name) ?? "",
              profilePicture: safeString(user.image),
              authProvider: "google",
              updatedAt: now,
              lastLoginAt: now,
              role: isDevAdmin ? "admin" : null,
              profileCompleted: isDevAdmin,
            },

            $setOnInsert: {
              createdAt: now,
              password: null,
              bio: "",
              instagram: "",
              regNumber: "",
              onboardingStep: 1,
              isVerifiedCelebrity: false,
              isVerifiedNGO: false,
              banned: false,
              emailVerified: true,
            },
          },

          {
            upsert: true,
          }
        );
      }

      return true;
    },

    async jwt({ token, user }) {
      const db = await getDb();

      if (user) {
        const authUser = user as {
          role?: UserRole;
          profileCompleted?: boolean;
          authProvider?: AuthProvider;
        };

        token.id = user.id;

        token.role = authUser.role ?? null;

        token.profileCompleted = Boolean(
          authUser.profileCompleted
        );

        token.authProvider =
          authUser.authProvider ??
          token.authProvider ??
          "credentials";
      }

      if (token.email) {
        const dbUser = await db.collection("users").findOne({
          email: token.email.toLowerCase(),
        });

        if (dbUser) {
          token.id = dbUser._id.toString();

          token.role =
            (dbUser.role as UserRole) ?? null;

          token.profileCompleted = Boolean(
            dbUser.profileCompleted
          );

          token.authProvider =
            (dbUser.authProvider as AuthProvider) ??
            token.authProvider ??
            "credentials";
        }
      }

      token.role = token.role ?? null;

      token.profileCompleted = Boolean(
        token.profileCompleted
      );

      token.authProvider =
        token.authProvider ?? "credentials";

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        session.user.role =
          (token.role as UserRole) ?? null;

        session.user.profileCompleted = Boolean(
          token.profileCompleted
        );

        session.user.authProvider =
          (token.authProvider as AuthProvider) ??
          "credentials";
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };