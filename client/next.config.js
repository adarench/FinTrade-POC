/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    domains: ['randomuser.me'],
  },
  reactStrictMode: true,
  distDir: 'out',
  // Rewrites are not supported in static exports
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://localhost:5001/api/:path*',
  //     },
  //   ];
  // },
}

module.exports = nextConfig