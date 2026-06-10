// lib/auth.ts — NextAuth config + a helper to read the caller's role.
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getServerSession } from 'next-auth';
import { roleFor, type Role } from './config';
import { authenticateCredentialAccount } from './accounts';
import { validateCredentials } from './account-validation';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth', error: '/auth' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = validateCredentials(credentials);
        if (!parsed) return null;
        return authenticateCredentialAccount(parsed.email, parsed.password);
      },
    }),
  ],
  callbacks: {
    // Attach the resolved role to the JWT and session so UI + API can gate on it.
    async jwt({ token }) {
      if (token.email) token.email = token.email.trim().toLowerCase();
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
