/**
 * Auth Database Prisma Client
 *
 * Separate Prisma client for authentication database.
 * Configured for serverless (Next.js) + Neon pooler:
 * - connection_limit=1  → each serverless instance uses 1 connection;
 *   Neon's PgBouncer pooler handles the real multiplexing.
 * - pool_timeout=30     → wait up to 30 s before giving up.
 */

import { PrismaClient as AuthPrismaClient } from '@/generated/auth-client'

// Declare global type for development hot-reload protection
declare global {
  // eslint-disable-next-line no-var
  var authPrisma: AuthPrismaClient | undefined
}

const createAuthPrismaClient = () => {
  const rawUrl = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL || ''

  // Inject serverless-safe pool settings if not already present.
  // With Neon's pooler (-pooler URL) the real connection multiplexing happens
  // in PgBouncer, so each app instance only needs 1 Prisma-level connection.
  let databaseUrl = rawUrl
  try {
    const url = new URL(rawUrl)
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '1')
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '30')
    }
    databaseUrl = url.toString()
  } catch {
    // Non-parseable URL — use as-is
  }

  return new AuthPrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: { db: { url: databaseUrl } },
  })
}

/**
 * Singleton Prisma client.
 * In development, stored in global to survive hot-reloads.
 */
export const authPrisma = global.authPrisma ?? createAuthPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.authPrisma = authPrisma
}

/**
 * Graceful shutdown helper.
 */
export async function disconnectAuthPrisma() {
  await authPrisma.$disconnect()
}

/**
 * withRetry — retries authPrisma calls on Neon cold-start errors.
 * Neon free tier suspends after inactivity; the first query hits a sleeping
 * database and gets "Can't reach database server". We retry with back-off
 * (1 s → 2 s → 4 s) to give Neon time to wake up.
 */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const MAX_RETRIES = 4
  let lastError: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      lastError = err
      const name = (err as { name?: string })?.name ?? ''
      const msg  = (err as { message?: string })?.message ?? ''
      const isColdStart =
        name === 'PrismaClientInitializationError' ||
        msg.includes("Can't reach database server") ||
        msg.includes('connect ECONNREFUSED') ||
        msg.includes('connection pool')
      if (isColdStart && attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
        continue
      }
      throw err
    }
  }
  throw lastError
}

export default authPrisma
