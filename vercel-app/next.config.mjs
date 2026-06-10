/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // googleapis is a server-only dep; keep it out of the client bundle.
  serverExternalPackages: ['googleapis'],
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
    ];
  },
};
export default nextConfig;
