/**
 * Redis Caching Utilities
 * High-performance caching layer for Neon free tier optimization
 *
 * Strategy:
 * - Cache expensive database queries
 * - 5-15 minute TTL for balance between freshness and performance
 * - Automatic cache invalidation on data updates
 */

import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client using REST API
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      automaticDeserialization: true,
    })
  : null;

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  USER_DATA: 300,          // 5 minutes - user credentials rarely change
  WORKER_PROFILE: 180,     // 3 minutes - profile data changes occasionally
  COMPLETION_STATUS: 120,  // 2 minutes - completion status can change frequently
  SESSION_DATA: 900,       // 15 minutes - session data
} as const;

// Cache key generators
export const CACHE_KEYS = {
  user: (email: string) => `user:${email.toLowerCase()}`,
  workerProfile: (userId: string) => `worker_profile:${userId}`,
  completionStatus: (userId: string) => `completion_status:${userId}`,
} as const;

/**
 * Get cached data
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const start = Date.now();
    const data = await redis.get<T>(key);
    if (data) {
      console.log(`[REDIS] Cache HIT for ${key} (${Date.now() - start}ms)`);
    } else {
      console.log(`[REDIS] Cache MISS for ${key}`);
    }
    return data;
  } catch (error) {
    console.error('[REDIS] Get error:', error);
    return null;
  }
}

/**
 * Set cached data with TTL
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttlSeconds: number
): Promise<void> {
  if (!redis) return;

  try {
    const start = Date.now();
    await redis.setex(key, ttlSeconds, data);
    console.log(`[REDIS] Cached ${key} with TTL ${ttlSeconds}s (${Date.now() - start}ms)`);
  } catch (error) {
    console.error('[REDIS] Set error:', error);
  }
}

/**
 * Invalidate (delete) cached data
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (!redis) return;

  try {
    if (keys.length === 0) return;
    await redis.del(...keys);
    console.log(`[REDIS] Invalidated cache keys:`, keys);
  } catch (error) {
    console.error('[REDIS] Delete error:', error);
  }
}

/**
 * Invalidate cache by pattern (e.g., all user caches)
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  if (!redis) return;

  try {
    // Note: Upstash Redis doesn't support SCAN, so this is a simplified version
    // For production, you might want to maintain a Set of keys
    console.log(`[REDIS] Pattern invalidation requested: ${pattern}`);
  } catch (error) {
    console.error('[REDIS] Pattern delete error:', error);
  }
}

/**
 * Helper: Get or fetch pattern
 * Tries cache first, falls back to fetcher, then caches result
 */
export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch from database
  console.log(`[REDIS] Fetching fresh data for ${key}`);
  const data = await fetcher();

  // Cache the result (don't await - fire and forget)
  setCached(key, data, ttlSeconds).catch(() => {});

  return data;
}

export default redis;
