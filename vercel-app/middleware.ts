// middleware.ts — require a session for the app routes (not the webhook/auth).
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/', '/index.html', '/app/:path*', '/os/:path*', '/employee/:path*', '/manager/:path*'],
};
