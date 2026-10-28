/**
 * useWorkers Hook
 *
 * React Query hook for fetching and caching worker data.
 *
 * Features:
 * - Automatic caching (5 minutes stale time)
 * - Background refetching
 * - Optimistic updates support
 * - Pagination support
 * - Search/filter support
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClientWorkerCard, ClientWorkerResponse } from '@remonta/api-contract';
import { searchApi } from '@/lib/api/search';

// ============================================================================
// TYPES
// ============================================================================

/** A worker card, as GET /v1/client/workers returns it (search-locations U2). */
export type Worker = ClientWorkerCard;

export interface WorkersSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  location?: string;
  services?: string[];
}

export type WorkersResponse = ClientWorkerResponse;

// ============================================================================
// CONSTANTS
// ============================================================================

const QUERY_KEY = 'workers';
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

// ============================================================================
// API FUNCTION
// ============================================================================

/**
 * Fetch workers from apps/api (GET /v1/client/workers, with the signed-in user's token).
 * Anything but a result throws, so React Query's retry and error state work as before.
 */
async function fetchWorkers(params: WorkersSearchParams): Promise<WorkersResponse> {
  const outcome = await searchApi.searchWorkersForClient({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    location: params.location,
    services: params.services?.length ? params.services.join(',') : undefined,
  });
  if (outcome.kind === 'ok') return outcome.body;
  throw new Error(`Failed to fetch workers: ${outcome.kind === 'failed' ? outcome.status : outcome.kind}`);
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch workers with search/filter support
 *
 * @param params - Search parameters
 * @param options - Additional React Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useWorkers({
 *   search: 'John',
 *   location: 'Melbourne',
 *   page: 1,
 *   pageSize: 20,
 * });
 * ```
 */
export function useWorkers(
  params: WorkersSearchParams = {},
  options?: {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
  }
) {
  return useQuery<WorkersResponse, Error>({
    queryKey: [QUERY_KEY, params],
    queryFn: () => fetchWorkers(params),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook to prefetch workers (for pagination)
 *
 * @example
 * ```tsx
 * const prefetch = usePrefetchWorkers();
 *
 * // Prefetch next page on hover
 * onMouseEnter={() => prefetch({ page: currentPage + 1 })}
 * ```
 */
export function usePrefetchWorkers() {
  const queryClient = useQueryClient();

  return (params: WorkersSearchParams) => {
    queryClient.prefetchQuery({
      queryKey: [QUERY_KEY, params],
      queryFn: () => fetchWorkers(params),
      staleTime: STALE_TIME,
    });
  };
}

/**
 * Hook to invalidate workers cache
 * Useful after mutations that affect worker data
 */
export function useInvalidateWorkers() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  };
}
