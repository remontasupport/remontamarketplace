/**
 * Main Prisma Client with Connection Pooling
 *
 * PRODUCTION-READY CONNECTION POOLING:
 * - Uses Neon's connection pooler (see -pooler in DATABASE_URL)
 * - Singleton pattern prevents connection exhaustion
 * - Optimized for serverless/Next.js API routes
 */

import { PrismaClient } from '@prisma/client'

// Declare global type for development hot-reload protection
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

/**
 * Connection Pool Configuration for Neon
 *
 * Best Practices:
 * - Use Neon's pooler URL (already in .env with -pooler)
 * - Don't add duplicate params (already in .env)
 * - Use singleton pattern (prevents multiple instances)
 */
const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']  // Enable query logging in dev for debugging
      : ['error'],
  })
}

/**
 * Main Database Client
 *
 * Uses singleton pattern to prevent creating multiple instances
 * In development, stores in global to survive hot-reloads
 * In production, creates fresh instance
 */
export const prisma = global.prisma || createPrismaClient()

// In development, store in global to survive hot-reloads
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

/**
 * Graceful shutdown helper
 * Call this when your application shuts down
 */
export async function disconnectPrisma() {
  await prisma.$disconnect()
}

export default prisma
