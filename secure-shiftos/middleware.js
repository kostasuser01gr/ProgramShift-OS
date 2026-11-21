import {withAuth} from 'next-auth/middleware';
export default withAuth({pages:{signIn:'/login'},callbacks:{authorized:({token})=>Boolean(token?.role==='manager'||token?.role==='editor')}});
export const config={matcher:['/((?!login|demo|api/auth|_next|favicon.ico).*)']};
