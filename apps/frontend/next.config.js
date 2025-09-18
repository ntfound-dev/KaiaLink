// apps/frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // arahkan ke backend NestJS
      },
    ];
  },
};

module.exports = nextConfig;
