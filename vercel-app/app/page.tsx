// Landing — send each role to its home.
import { redirect } from 'next/navigation';
import { currentRole } from '@/lib/auth';

export default async function Home() {
  const { role } = await currentRole();
  redirect(role === 'employee' ? '/employee' : '/manager');
}
