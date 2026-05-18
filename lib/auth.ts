import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";
import { assignUsernameForUser } from "@/lib/username";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database"
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true }
      });

      if (existingUser) {
        return true;
      }

      const userCount = await prisma.user.count();
      return userCount === 0;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = user.username;
        session.user.displayName = user.displayName;
      }

      return session;
    }
  },
  events: {
    async createUser({ user }) {
      await assignUsernameForUser({
        userId: user.id,
        email: user.email,
        name: user.name
      });
    }
  }
};
