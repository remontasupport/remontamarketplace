/**
 * Service Subcategories Query Hooks
 * Fetches available subcategories and worker's selected subcategories
 * Mutations for toggling subcategories with optimistic updates
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleWorkerSubcategory } from "@/services/worker/workerServices.service";

// Query Keys
export const subcategoriesKeys = {
  all: ["subcategories"] as const,
  byCategory: (categoryId: string) =>
    [...subcategoriesKeys.all, categoryId] as const,
};

export const workerServicesKeys = {
  all: ["worker-services"] as const,
  current: ["worker-services", "current"] as const,
};

// Types
export interface Subcategory {
  id: string;
  name: string;
  requiresRegistration: string | null;
}

export interface WorkerService {
  categoryId: string;
  categoryName: string;
  subcategories: Array<{
    subcategoryId: string;
    subcategoryName: string;
  }>;
}

// Fetch all available subcategories for a category
async function fetchSubcategories(categoryId: string): Promise<Subcategory[]> {
  const response = await fetch(`/api/subcategories?categoryId=${encodeURIComponent(categoryId)}`);

  if (!response.ok) {
    throw new Error("Failed to fetch subcategories");
  }

  return response.json();
}

// Fetch worker's selected services
async function fetchWorkerServices(): Promise<WorkerService[]> {
  const response = await fetch("/api/worker/services");

  if (!response.ok) {
    throw new Error("Failed to fetch worker services");
  }

  return response.json();
}

/**
 * Hook to fetch all available subcategories for a category
 */
export function useSubcategories(categoryId?: string) {
  return useQuery({
    queryKey: categoryId ? subcategoriesKeys.byCategory(categoryId) : subcategoriesKeys.all,
    queryFn: () => fetchSubcategories(categoryId!),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch worker's selected services with subcategories
 */
export function useWorkerServices() {
  return useQuery({
    queryKey: workerServicesKeys.current,
    queryFn: fetchWorkerServices,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

/**
 * Helper to get selected subcategory IDs for a specific category
 */
export function getSelectedSubcategoryIds(
  workerServices: WorkerService[] | undefined,
  categoryName: string
): string[] {
  if (!workerServices) return [];

  const service = workerServices.find(
    (s) => s.categoryName.toLowerCase() === categoryName.toLowerCase()
  );

  return service?.subcategories.map((sub) => sub.subcategoryId) || [];
}

/**
 * Helper to map category name to category ID
 */
export function getCategoryIdFromName(categoryName: string): string {
  // Normalize the category name to match database IDs
  return categoryName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "");
}

/**
 * Mutation: Toggle a subcategory for the worker
 * Uses optimistic updates for instant UI feedback
 */
export function useToggleSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      categoryName,
      subcategoryId,
      subcategoryName,
    }: {
      categoryId: string;
      categoryName: string;
      subcategoryId: string;
      subcategoryName: string;
    }) => {
      const result = await toggleWorkerSubcategory(
        categoryId,
        categoryName,
        subcategoryId,
        subcategoryName
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to update service");
      }

      return result;
    },
    onMutate: async ({ categoryId, categoryName, subcategoryId, subcategoryName }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: workerServicesKeys.current });

      // Snapshot the previous value
      const previousServices = queryClient.getQueryData<WorkerService[]>(
        workerServicesKeys.current
      );

      // Optimistically update the cache
      queryClient.setQueryData<WorkerService[]>(
        workerServicesKeys.current,
        (old) => {
          if (!old) return old;

          // Find the category
          const categoryIndex = old.findIndex((s) => s.categoryId === categoryId);

          if (categoryIndex === -1) {
            // Category doesn't exist, add it
            return [
              ...old,
              {
                categoryId,
                categoryName,
                subcategories: [{ subcategoryId, subcategoryName }],
              },
            ];
          }

          // Category exists, toggle the subcategory
          const category = old[categoryIndex];
          const subcategoryIndex = category.subcategories.findIndex(
            (sub) => sub.subcategoryId === subcategoryId
          );

          if (subcategoryIndex === -1) {
            // Add subcategory
            const newSubcategories = [
              ...category.subcategories,
              { subcategoryId, subcategoryName },
            ];

            const newCategory = {
              ...category,
              subcategories: newSubcategories,
            };

            return [
              ...old.slice(0, categoryIndex),
              newCategory,
              ...old.slice(categoryIndex + 1),
            ];
          } else {
            // Remove subcategory
            const newSubcategories = category.subcategories.filter(
              (sub) => sub.subcategoryId !== subcategoryId
            );

            // If no more subcategories, remove the entire category
            if (newSubcategories.length === 0) {
              return old.filter((s) => s.categoryId !== categoryId);
            }

            const newCategory = {
              ...category,
              subcategories: newSubcategories,
            };

            return [
              ...old.slice(0, categoryIndex),
              newCategory,
              ...old.slice(categoryIndex + 1),
            ];
          }
        }
      );

      // Return context with previous value
      return { previousServices };
    },
    onError: (err, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousServices) {
        queryClient.setQueryData(workerServicesKeys.current, context.previousServices);
      }
    },
    onSettled: () => {
      // Refetch to ensure we're in sync with server
      queryClient.invalidateQueries({ queryKey: workerServicesKeys.current });
    },
  });
}
