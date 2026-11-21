import {getServerSession} from 'next-auth';
import {redirect} from 'next/navigation';
import {authOptions} from '../lib/auth.js';
import Dashboard from './dashboard.jsx';
export const dynamic='force-dynamic';
export default async function Home(){
  if(!process.env.NEXTAUTH_SECRET || !process.env.AZURE_AD_CLIENT_ID)redirect('/login');
  const session=await getServerSession(authOptions);
  if(!['manager','editor'].includes(session?.user?.role))redirect('/login');
  return <Dashboard displayName={session.user?.name||'Authorized user'} role={session.user.role}/>;
}
