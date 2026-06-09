'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import type { Role } from '@/lib/config';

export function AppHeader({ role, email }: { role: Role; email: string | null }) {
  return (
    <header className="appbar">
      <Link className="brand" href="/">Shift Schedule</Link>
      <nav aria-label="Primary navigation">
        <Link href="/employee">Team week</Link>
        {role !== 'employee' && <Link href="/manager">Manager</Link>}
      </nav>
      <div className="account">
        <span>{email}</span>
        <button type="button" className="button subtle" onClick={() => signOut({ callbackUrl: '/' })}>
          Sign out
        </button>
      </div>
    </header>
  );
}
