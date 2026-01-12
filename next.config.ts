import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
