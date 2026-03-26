import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getProfilePreviewData } from "@/services/worker/profilePreview.service";

/**
 * React Query Hook: Profile Preview Data
 * Fetches comprehensive profile data from worker_profiles, worker_services, and worker_additional_info
 */

// Query key
export const PROFILE_PREVIEW_KEY = ["profile-preview"];

/**
 * Hook to fetch complete profile preview data.
 * Reactive via three layers:
 *  1. staleTime: 0  — always considered stale, refetches on every mount
 *  2. refetchOnWindowFocus  — auto-refetch when user returns from another tab/route
 *  3. 'remonta:profile-updated' event — immediate refetch after any section save
 */
export function useProfilePreview() {
  const queryClient = useQueryClient();

  // Layer 3: listen for saves fired from any section component
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_PREVIEW_KEY });
    };
    window.addEventListener('remonta:profile-updated', handler);
    return () => window.removeEventListener('remonta:profile-updated', handler);
  }, [queryClient]);

  return useQuery({
    queryKey: PROFILE_PREVIEW_KEY,
    queryFn: async () => {
      const result = await getProfilePreviewData();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || "Failed to fetch profile preview data");
    },
    staleTime: 0,              // Layer 1: always stale → refetches on mount
    refetchOnWindowFocus: true, // Layer 2: refetch when user returns to the window
  });
}
