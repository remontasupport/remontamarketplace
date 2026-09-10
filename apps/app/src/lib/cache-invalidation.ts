/**
 * Cache Invalidation Helpers
 * Call these functions when user data changes to ensure cache consistency
 */

import { invalidateCache, CACHE_KEYS } from './redis';

/**
 * Invalidate all caches for a specific user
 * Call this when user updates their profile, password, or any user data
 */
export async function invalidateUserCaches(userId: string, email: string): Promise<void> {
  await invalidateCache(
    CACHE_KEYS.user(email),
    CACHE_KEYS.workerProfile(userId),
    CACHE_KEYS.completionStatus(userId)
  );
}

/**
 * Invalidate worker profile cache
 * Call this when worker updates profile data (name, photo, etc.)
 */
export async function invalidateWorkerProfileCache(userId: string): Promise<void> {
  await invalidateCache(CACHE_KEYS.workerProfile(userId));
}

/**
 * Invalidate completion status cache
 * Call this when worker uploads documents, adds services, etc.
 */
export async function invalidateCompletionCache(userId: string): Promise<void> {
  await invalidateCache(CACHE_KEYS.completionStatus(userId));
}
