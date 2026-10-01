import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sessionEstValide } from "@/lib/session";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Pas `iat` : Auth.js le renouvelle à chaque rafraîchissement de session.
        token.emisLe = Date.now();
        return token;
      }
      if (!token.id) return token;

      // Relu à chaque appel : un changement de mot de passe ou une suppression
      // de compte déconnecte les sessions plus anciennes (null efface le cookie).
      const organisateur = await prisma.organisateur.findUnique({
        where: { id: token.id },
        select: { motDePasseModifieLe: true },
      });
      return sessionEstValide(token.emisLe, organisateur) ? token : null;
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
          where: { email: email.trim().toLowerCase() },
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
