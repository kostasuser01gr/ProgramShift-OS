// lib/auth.ts — NextAuth (Google) config + a helper to read the caller's role.
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getServerSession } from 'next-auth';
import { roleFor, type Role } from './config';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Attach the resolved role to the JWT and session so UI + API can gate on it.
    async jwt({ token }) {
      (token as any).role = roleFor(token.email);
      return token;
    },
    async session({ session, token }) {
      (session as any).role = (token as any).role as Role;
      return session;
    },
  },
};

export async function currentRole(): Promise<{ email: string | null; role: Role }> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  return { email, role: (session as any)?.role ?? roleFor(email) };
}
