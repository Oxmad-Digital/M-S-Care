import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        // Insensible à la casse : les adresses invitées sont enregistrées en minuscules.
        const user = await prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: "insensitive" } } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`.trim() };
      },
    }),
  ],
  callbacks: {
    // Le rôle n'est pas mis dans le jeton : il est relu en base à chaque requête
    // (voir current-user.ts) pour qu'un changement de droits s'applique aussitôt.
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
