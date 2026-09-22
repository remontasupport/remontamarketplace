import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ---------------------------------------------------------------------------
  // These two suppressions REMAIN ON PURPOSE. They are not an oversight.
  //
  // The project carries a real backlog: 149 TypeScript errors and 523 ESLint
  // errors as of 2026-09-10. Turning either check on here would fail every
  // build immediately, so removing these flags is not a config change — it is a
  // prerequisite project.
  //
  // The gate lives elsewhere. `npm run quality` compares the current findings
  // against .quality-baseline/ and fails on anything NOT already recorded
  // there. Existing debt is tolerated; new debt is rejected. CI runs it on
  // every pull request (unit U3).
  //
  // Remove `ignoreBuildErrors` when .quality-baseline/typescript.txt is empty.
  // Remove `ignoreDuringBuilds` when .quality-baseline/eslint.txt is empty.
  // Until then, deleting these lines only breaks the build without improving
  // anything.
  //
  // Baseline counts are recorded in aidlc-docs/construction/U1/code/.
  // ---------------------------------------------------------------------------
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure Prisma engine binaries are included in Vercel deployment
  // CRITICAL: Must include for ALL routes that use Prisma (API routes + Server Components)
  outputFileTracingIncludes: {
    '/**': ['./node_modules/@prisma/client/**/*', './src/generated/auth-client/**/*'],
  },
  // Tell Next.js not to bundle Prisma Clients (BOTH main and auth)
  // CRITICAL: This prevents webpack from trying to bundle the native binaries
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  experimental: {
    // Increase Server Action body size limit for file uploads (default is 1MB)
    serverActions: {
      bodySizeLimit: '50mb', // Allow up to 50MB file uploads via Server Actions
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'www.zohoapis.com.au',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
    ],
    // Prefer AVIF (40% smaller than WebP), fall back to WebP
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images for 30 days on Vercel CDN
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        // Apply security headers to all dashboard routes
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, private',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
