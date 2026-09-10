/**
 * Custom hook for profile section navigation after save
 * Provides a consistent way to navigate to the next section after successful save
 */

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { getNextSection } from "@/utils/profileSectionNavigation";

export function useProfileSectionNavigation(currentSectionId: string) {
  const router = useRouter();

  /**
   * Navigate to the next section
   * @param delay - Optional delay in ms before navigation (default: 500ms)
   */
  const navigateToNext = useCallback((delay: number = 500) => {
    const nextSection = getNextSection(currentSectionId);

    if (nextSection) {
      setTimeout(() => {
        router.push(nextSection.href);
      }, delay);
    }
  }, [currentSectionId, router]);

  /**
   * Wrapper for save functions that automatically navigates on success
   * @param saveFunction - The async save function to execute
   * @param onSuccess - Optional callback after successful save (before navigation)
   * @param onError - Optional callback on save error
   */
  const saveAndNavigate = useCallback(async <T,>(
    saveFunction: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      navigationDelay?: number;
      skipNavigation?: boolean;
    }
  ): Promise<T | undefined> => {
    try {
      const result = await saveFunction();

      // Call success callback if provided
      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      // Navigate to next section unless explicitly skipped
      if (!options?.skipNavigation) {
        navigateToNext(options?.navigationDelay);
      }

      return result;
    } catch (error) {
      // Call error callback if provided
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }
      throw error;
    }
  }, [navigateToNext]);

  return {
    navigateToNext,
    saveAndNavigate,
  };
}
