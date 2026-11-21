import {withAuth} from 'next-auth/middleware';
import {NextResponse} from 'next/server';
const authenticated=withAuth({pages:{signIn:'/login'},callbacks:{authorized:({token})=>Boolean(token?.role==='manager'||token?.role==='editor')}});
export default function middleware(request){
  // Avoid NextAuth NO_SECRET runtime faults; fail closed before authentication initializes.
  if(!process.env.NEXTAUTH_SECRET){
    if(new URL(request.url).pathname.startsWith('/api/'))return NextResponse.json({error:'Corporate authentication unavailable'},{status:503});
    return NextResponse.redirect(new URL('/login',request.url));
  }
  return authenticated(request);
}
export const config={matcher:['/((?!login|demo|api/auth|_next|favicon.ico).*)']};
