import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        motDePasse: {},
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const motDePasse = credentials?.motDePasse;
        if (typeof email !== "string" || typeof motDePasse !== "string") {
          return null;
        }

        const organisateur = await prisma.organisateur.findUnique({
          where: { email },
        });
        if (!organisateur) return null;

        const motDePasseValide = await bcrypt.compare(
          motDePasse,
          organisateur.motDePasseHash
        );
        if (!motDePasseValide) return null;

        return { id: organisateur.id, email: organisateur.email };
      },
    }),
  ],
});
