
// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { AuthOptions, SessionStrategy } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

import bcrypt from "bcrypt";
import { Adapter } from "next-auth/adapters";

// Helper function to connect and get DB
async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
}

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB,
  }) as Adapter,

  providers: [
    // GOOGLE LOGIN
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // EMAIL/PASSWORD LOGIN
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

        const user = await db.collection("users").findOne({
          email: credentials.email.toLowerCase(),
        });

        if (!user) {
          throw new Error("No user found.");
        }

        // IMPORTANT:
        // Google users don't have passwords
        if (!user.password) {
          throw new Error("Please login using Google.");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password as string
        );

        if (!isValid) {
          throw new Error("Invalid password.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,

          role: user.role || null,

          profileCompleted:
            user.profileCompleted || false,

          authProvider:
            user.authProvider || "credentials",
        };
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
      // GOOGLE USER AUTO CREATION
      if (
        account?.provider === "google" &&
        user.email
      ) {
        const db = await getDb();

        const existingUser =
          await db.collection("users").findOne({
            email: user.email.toLowerCase(),
          });

        if (!existingUser) {
          await db.collection("users").insertOne({
            name: user.name || "",

            email: user.email.toLowerCase(),

            password: null,

            authProvider: "google",

            role: null,

            profileCompleted: false,

            emailVerified: true,

            profilePicture: user.image || null,

            bio: "",

            instagram: "",

            regNumber: "",

            onboardingStep: 1,

            isVerifiedCelebrity: false,

            isVerifiedNGO: false,

            banned: false,

            createdAt: new Date(),

            updatedAt: new Date(),

            lastLoginAt: new Date(),
          });
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      // First login only
      if (user) {
        token.id = user.id;

        token.role = (user as any).role;

        token.profileCompleted =
          (user as any).profileCompleted;

        token.authProvider =
          (user as any).authProvider;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        session.user.role =
          token.role as string;

        session.user.profileCompleted =
          token.profileCompleted as boolean;

        session.user.authProvider =
          token.authProvider as string;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
