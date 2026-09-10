/**
 * Main Prisma Client with Connection Pooling
 *
 * PRODUCTION-READY CONNECTION POOLING:
 * - Uses Neon's connection pooler (see -pooler in DATABASE_URL)
 * - Singleton pattern prevents connection exhaustion
 * - Optimized for serverless/Next.js API routes
 */

import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        // ACCELERATE_DATABASE_URL → Prisma Accelerate (production, eliminates cold starts)
        // Falls back to direct Neon URL for local development
        url: process.env.ACCELERATE_DATABASE_URL || process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  }).$extends(withAccelerate())
}

// Declare global type for development hot-reload protection
declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof createPrismaClient> | undefined
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
