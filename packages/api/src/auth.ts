import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { getAdminStatusByEmail } from "@/lib/users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [Google],
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const row = await getAdminStatusByEmail(user.email);
      return Boolean(row?.admin);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const row = await getAdminStatusByEmail(user.email);
        if (row) {
          token.userId = row.id;
          token.admin = row.admin;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId;
      if (typeof token.admin === "boolean") session.user.admin = token.admin;
      return session;
    },
  },
});
