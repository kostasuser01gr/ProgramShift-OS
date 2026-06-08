/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // googleapis is a server-only dep; keep it out of the client bundle.
  experimental: { serverComponentsExternalPackages: ['googleapis'] },
};
export default nextConfig;
