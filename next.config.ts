import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  experimental: {viewTransition: true},
  // aldarb.co is paused: keep old links alive (temporary redirect — the case may return).
  async redirects() {
    return [
      {source: '/work/aldarb', destination: '/work', permanent: false},
      {source: '/en/work/aldarb', destination: '/en/work', permanent: false},
    ];
  },
  async headers() {
    return [
      {
        // Content-hashed filenames: safe to cache forever.
        source: '/fonts/:path*',
        headers: [{key: 'Cache-Control', value: 'public, max-age=31536000, immutable'}],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
