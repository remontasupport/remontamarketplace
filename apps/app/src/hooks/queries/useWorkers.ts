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

// ============================================================================
// TYPES
// ============================================================================

export interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  role: string;
  bio: string;
  skills: string[];
  location: string;
  isNdisCompliant: boolean;
}

export interface WorkersSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  location?: string;
  services?: string[];
}

export interface WorkersResponse {
  success: boolean;
  data: Worker[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  cached?: boolean;
}

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
 * Fetch workers from API
 */
async function fetchWorkers(params: WorkersSearchParams): Promise<WorkersResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.search) searchParams.set('search', params.search);
  if (params.location) searchParams.set('location', params.location);
  if (params.services?.length) searchParams.set('services', params.services.join(','));

  const url = `/api/client/workers?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // Enable caching for GET requests
    cache: 'default',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to fetch workers: ${response.status}`);
  }

  return response.json();
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
