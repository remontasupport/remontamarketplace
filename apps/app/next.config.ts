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
  // Ensure the Prisma query engines reach the deployed functions.
  //
  // CORRECTED IN U8. This previously listed ./node_modules/@prisma/client/**/*, which
  // stopped being the resolution path in U6 when each schema was given an explicit
  // output -- the app imports @/generated/client and @/generated/auth-client and does
  // not reach node_modules for either. Worse, ./src/generated/client/**/* was MISSING,
  // so the main client was never traced at all. Production kept working only because
  // vercel.json includeFiles covers src/generated/** wholesale, which meant a real gap
  // sat here unnoticed behind a config that happened to be redundant.
  //
  // Both clients are now listed explicitly, and both are inside apps/app -- which is
  // what U8 Q1=A preserves, because Vercel cannot address paths outside the project
  // Root Directory. See packages/db/README.md.
  outputFileTracingIncludes: {
    '/**': ['./src/generated/client/**/*', './src/generated/auth-client/**/*'],
  },
  // Keep webpack away from the native engine binaries.
  //
  // @prisma/client stays listed because the generated clients require it internally at
  // runtime even though no application file imports it directly. .prisma/client is its
  // default-output sibling -- cheap insurance if a future schema is generated without
  // an explicit output.
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
