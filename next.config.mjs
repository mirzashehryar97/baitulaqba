// @ts-check
import path from 'node:path';

import withBundleAnalyzer from '@next/bundle-analyzer';

// Only active when ANALYZE=true (e.g. `npm run analyze`) so it never affects
// normal builds. Emits treemap reports under `.next/analyze/`.
const analyze = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // Per-icon / per-export module resolution so a named import like
    // `import { Menu } from 'lucide-react'` pulls only that icon instead of
    // risking the whole barrel, and framer-motion imports stay tightly scoped.
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async redirects() {
    return [
      // The "Mosques & Schools" initiative was renamed to "Mosques" (schools are
      // covered by the separate Tent Schools initiative). Permanently redirect the
      // old path so existing links and any indexed URL resolve to the new page.
      {
        source: '/mosques-schools',
        destination: '/mosques',
        permanent: true,
      },
    ];
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

export default analyze(nextConfig);
