import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  experimental: {viewTransition: true},
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
