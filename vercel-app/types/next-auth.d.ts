import type { DefaultSession } from 'next-auth';
import type { Role } from '@/lib/config';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
  }
}
