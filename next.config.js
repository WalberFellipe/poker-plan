const createNextIntlPlugin = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
    ],
  },
  env: {
    PULSE_API_KEY: process.env.PULSE_API_KEY,
  },
}

module.exports = createNextIntlPlugin(nextConfig); 