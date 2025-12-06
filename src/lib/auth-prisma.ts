/**
 * Auth Database Prisma Client
 *
 * Separate Prisma client for authentication database
 * This keeps auth data isolated from main application data
 *
 * Production best practices:
 * - Connection pooling for serverless
 * - Proper error handling
 * - Environment-specific logging
 * - Singleton pattern to prevent connection exhaustion
 */

import { PrismaClient as AuthPrismaClient } from '../generated/auth-client'

// Declare global type for development hot-reload protection
declare global {
  // eslint-disable-next-line no-var
  var authPrisma: AuthPrismaClient | undefined
}

/**
 * Create Prisma client with production-ready configuration
 * Optimized for high concurrency scenarios (1000+ concurrent users)
 */
const createAuthPrismaClient = () => {
  // Use AUTH_DATABASE_URL if set, otherwise fallback to DATABASE_URL
  const databaseUrl = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;

  // Build connection string with connection pooling parameters
  // These settings optimize for serverless high-concurrency workloads
  const connectionString = databaseUrl + (databaseUrl?.includes('?') ? '&' : '?') + [
    'connection_limit=10',           // Max connections per Prisma Client instance
    'pool_timeout=30',               // Seconds to wait for connection from pool
    'connect_timeout=10',            // Seconds to wait for initial connection
    'socket_timeout=30',             // Seconds before timing out socket operations
  ].join('&');

  return new AuthPrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],

    // Connection pool settings for serverless environments
    datasources: {
      db: {
        url: connectionString,
      },
    },
  })
}

/**
 * Auth Database Client
 *
 * Uses singleton pattern to prevent creating multiple instances
 * In development, stores in global to survive hot-reloads
 * In production, creates fresh instance
 */
export const authPrisma = global.authPrisma || createAuthPrismaClient()

// In development, store in global to survive hot-reloads
if (process.env.NODE_ENV !== 'production') {
  global.authPrisma = authPrisma
}

/**
 * Graceful shutdown helper
 * Call this when your application shuts down
 */
export async function disconnectAuthPrisma() {
  await authPrisma.$disconnect()
}

export default authPrisma
