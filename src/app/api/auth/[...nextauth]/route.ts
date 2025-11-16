// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions, SessionStrategy } from "next-auth"; // <-- 1. IMPORTED AuthOptions & SessionStrategy
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { MongoClient } from "mongodb";
import { Adapter } from "next-auth/adapters";

// Helper function to connect and get the DB
async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
}

export const authOptions: AuthOptions = { // <-- 2. ADDED :AuthOptions
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB,
  }) as Adapter,

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing credentials");
        }

        const db = await getDb();
        const user = await db.collection("users").findOne({
          email: credentials.email,
        });

        if (!user) {
          throw new Error("No user found.");
        }

        // Use 'as string' to satisfy bcrypt
        const isValid = await bcrypt.compare(credentials.password, user.password as string);

        if (!isValid) {
          throw new Error("Invalid password.");
        }

        // Return user object without the password
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role, // We'll use this later
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy, // <-- 3. ADDED 'as SessionStrategy'
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/", // We use our modal, so just redirect to home
  },
  // Add callbacks to include user.id and user.role in the session token
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };