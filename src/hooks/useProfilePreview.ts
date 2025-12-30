import { useQuery } from "@tanstack/react-query";
import { getProfilePreviewData } from "@/services/worker/profilePreview.service";

/**
 * React Query Hook: Profile Preview Data
 * Fetches comprehensive profile data from worker_profiles, worker_services, and worker_additional_info
 */

// Query key
export const PROFILE_PREVIEW_KEY = ["profile-preview"];

/**
 * Hook to fetch complete profile preview data
 * Returns: profile, services (grouped by category), and additional info
 */
export function useProfilePreview() {
  return useQuery({
    queryKey: PROFILE_PREVIEW_KEY,
    queryFn: async () => {
      const result = await getProfilePreviewData();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || "Failed to fetch profile preview data");
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
  });
}
