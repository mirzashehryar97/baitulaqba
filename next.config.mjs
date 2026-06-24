// @ts-check
import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve('.', 'src');
    return config;
  },
  turbopack: {
    resolveAlias: {
      '@': path.resolve('.', 'src'),
    },
  },
};

export default nextConfig;
