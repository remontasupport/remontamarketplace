import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This suppression REMAINS ON PURPOSE. There are 76 ESLint errors as of
  // 2026-09-10 (down from 1,174 before src/generated was excluded), so turning
  // the check on here would fail every build.
  //
  // The gate lives elsewhere: `npm run quality` runs tsc strictly -- this
  // product has ZERO type errors and needs no baseline -- and compares ESLint
  // findings against .quality-baseline/eslint.txt, failing on anything not
  // already recorded. Existing debt is tolerated; new debt is rejected.
  //
  // Remove this line when .quality-baseline/eslint.txt is empty.
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '98ycfc5t',
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://www.remontaservices.com.au',
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
    ],
  },
};

export default nextConfig;
