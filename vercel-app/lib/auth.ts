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
      token.role = roleFor(token.email);
      return token;
    },
    async session({ session, token }) {
      session.role = token.role ?? roleFor(token.email);
      return session;
    },
  },
};

export async function currentRole(): Promise<{ authenticated: boolean; email: string | null; role: Role }> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  return {
    authenticated: Boolean(email),
    email,
    role: session?.role ?? roleFor(email),
  };
}
