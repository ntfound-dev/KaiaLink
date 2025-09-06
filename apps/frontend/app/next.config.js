// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Variabel lingkungan yang akan diekspos ke browser
  // Pastikan nama variabel diawali dengan NEXT_PUBLIC_
  env: {
    NEXT_PUBLIC_LIFF_ID: process.env.NEXT_PUBLIC_LIFF_ID,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  },

  // Konfigurasi untuk gambar eksternal jika diperlukan
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'profile.line-scdn.net',
  //     },
  //   ],
  // },
};

module.exports = nextConfig;