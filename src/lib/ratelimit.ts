import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ============================================
// RATE LIMITING CONFIGURATION
// ============================================

/**
 * Rate limiter for public API endpoints
 *
 * Limits:
 * - 100 requests per minute per IP
 * - Uses sliding window algorithm
 * - Stores data in Upstash Redis (or in-memory for development)
 */
export const publicApiRateLimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
      analytics: true,
      prefix: 'ratelimit:public',
    })
  : null // Disable in development if Redis not configured

/**
 * Stricter rate limiter for data-heavy endpoints
 *
 * Limits:
 * - 30 requests per minute per IP
 * - Use for endpoints that return large datasets
 */
export const strictApiRateLimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
      analytics: true,
      prefix: 'ratelimit:strict',
    })
  : null

/**
 * Database write rate limiter
 *
 * Limits:
 * - 20 requests per minute per user
 * - Protects Neon DB from being overwhelmed by write operations
 * - Use for server actions that write to database
 */
export const dbWriteRateLimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 writes per minute
      analytics: true,
      prefix: 'ratelimit:db:write',
    })
  : null

/**
 * Helper function to get client IP from request
 * Works with Vercel, Cloudflare, and standard deployments
 */
export function getClientIp(request: Request): string {
  // Try to get IP from headers (works with proxies/CDNs)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp.trim()
  }

  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  // Fallback to a default IP for development
  return 'anonymous'
}

/**
 * Apply rate limiting to an API route
 *
 * Usage:
 * ```typescript
 * const rateLimitResult = await applyRateLimit(request, publicApiRateLimit)
 * if (!rateLimitResult.success) {
 *   return rateLimitResult.response
 * }
 * ```
 */
export async function applyRateLimit(
  request: Request,
  limiter: Ratelimit | null
): Promise<{ success: boolean; response?: Response }> {
  // Skip rate limiting if not configured (development mode)
  if (!limiter) {

    return { success: true }
  }

  const identifier = getClientIp(request)

  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier)

    // Add rate limit headers to response
    const headers = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(reset).toISOString(),
    }

    if (!success) {
      // Rate limit exceeded


      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: 'Too many requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
              ...headers,
            },
          }
        ),
      }
    }

    // Rate limit OK, log for monitoring


    return { success: true }
  } catch (error) {
    // If rate limiting fails, log error but allow request (fail open)

    return { success: true }
  }
}

/**
 * Apply rate limiting to Server Actions
 *
 * Usage in server actions:
 * ```typescript
 * const rateLimitCheck = await checkServerActionRateLimit(userId, dbWriteRateLimit)
 * if (!rateLimitCheck.success) {
 *   return { success: false, error: rateLimitCheck.error }
 * }
 * ```
 */
export async function checkServerActionRateLimit(
  identifier: string,
  limiter: Ratelimit | null
): Promise<{ success: boolean; error?: string; retryAfter?: number }> {
  // Skip rate limiting if not configured (development mode)
  if (!limiter) {
    return { success: true }
  }

  try {
    const { success, reset } = await limiter.limit(identifier)

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return {
        success: false,
        error: `Too many requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      }
    }

    return { success: true }
  } catch (error) {
    // If rate limiting fails, log error but allow request (fail open)
    console.error('Rate limit check failed:', error)
    return { success: true }
  }
}
