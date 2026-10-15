/**
 * The worker's chosen services with their sub-categories (api-review U3c): the profile read's `services`, in the shape
 * the Services pages read. Was GET /api/worker/services (a cached Next.js route); the toggles and the catalogue fetch
 * that lived here had no caller and went with it.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@remonta/api-contract";
import { PROFILE_QUERY_KEY, PROFILE_STALE_MS, readProfile } from "@/features/worker/profile";

export interface WorkerService {
  categoryId: string;
  categoryName: string;
  subcategories: Array<{
    subcategoryId: string;
    subcategoryName: string;
  }>;
}

export function workerServicesOf(p: Pick<Profile, "services">): WorkerService[] {
  return p.services.map((s) => ({
    categoryId: s.categoryId,
    categoryName: s.categoryName,
    subcategories: s.subcategoryIds.map((id, i) => ({ subcategoryId: id, subcategoryName: s.subcategoryNames[i] ?? "" })),
  }));
}

/**
 * `options.suspense` is accepted and ignored, as it always was: React Query 5 has no such option (the pages handle
 * the list while it loads).
 */
export function useWorkerServices(_options?: { suspense?: boolean }) {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: ({ signal }) => readProfile("default", signal),
    staleTime: PROFILE_STALE_MS,
    retry: 1,
    select: workerServicesOf,
  });
}
