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
// Best practices:
// - User-facing dynamic data: 1-5 minutes (balances performance with freshness)
// - Status/progress data: 1 minute (needs to be very fresh)
// - Semi-static data: 5-30 minutes
// - Static data (credentials): 1 hour
export const CACHE_TTL = {
  USER_DATA: 3600,         // 1 hour - user credentials rarely change
  WORKER_PROFILE: 300,     // 5 minutes - profile data can change (services, photos, personal info)
  COMPLETION_STATUS: 60,   // 1 minute - completion status changes frequently as users complete steps
  SESSION_DATA: 900,       // 15 minutes - session data
  ACTIVE_JOBS: 7200,       // 2 hours safety-net TTL — explicit invalidation on every sync is the
                           // primary freshness mechanism; this is just a backstop if it fails
} as const;

// Cache key generators
// Version the keys when query structure changes to force cache refresh
const CACHE_VERSION = 'v2'; // Increment when changing query structure

export const CACHE_KEYS = {
  user: (email: string) => `user:${CACHE_VERSION}:${email.toLowerCase()}`,
  workerProfile: (userId: string) => `worker_profile:${CACHE_VERSION}:${userId}`,
  completionStatus: (userId: string) => `completion_status:${CACHE_VERSION}:${userId}`,
  // Shared across ALL users — one entry, invalidated on every sync-jobs run
  activeJobs: () => `active_jobs:${CACHE_VERSION}`,
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
  
    } else {
     
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
    
  } catch (error) {
   
  }
}

/**
 * Invalidate (delete) cached data
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (!redis) {
    console.warn('[REDIS] Redis not configured - cache invalidation skipped');
    return;
  }

  try {
    if (keys.length === 0) return;

    const result = await redis.del(...keys);
  
    // Verify deletion worked
    for (const key of keys) {
      const stillExists = await redis.exists(key);
      if (stillExists) {
        
      } else {
        
      }
    }
  } catch (error) {

    throw error; // Re-throw so caller knows it failed
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
    
  } catch (error) {
    
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

  const data = await fetcher();

  // Cache the result (don't await - fire and forget)
  setCached(key, data, ttlSeconds).catch(() => {});

  return data;
}

export default redis;
