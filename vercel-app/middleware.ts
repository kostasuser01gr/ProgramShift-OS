// middleware.ts — require a session for the app routes (not the webhook/auth).
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/', '/employee/:path*', '/manager/:path*'],
};
