/**
 * Service Documents Query Hook
 *
 * Implements data fetching for service qualification documents
 * - Smart caching with 5-minute stale time
 * - Background refetching for fresh data
 * - Cache invalidation on mutations
 * - Optimistic updates for instant UI feedback
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  uploadServiceDocument,
  deleteServiceDocument,
} from "@/services/worker/serviceDocuments.service";

// Query Keys - centralized for consistency
export const serviceDocumentsKeys = {
  all: ["service-documents"] as const,
  byType: (requirementType: string) =>
    [...serviceDocumentsKeys.all, { requirementType }] as const,
};

// Types
interface ServiceDocument {
  id: string;
  documentType: string;
  documentUrl: string;
  uploadedAt: string;
  status: string;
  serviceTitle?: string | null;
}

interface ServiceDocumentsResponse {
  success: boolean;
  documents: ServiceDocument[];
}

// API Fetcher using axios
async function fetchServiceDocuments(): Promise<ServiceDocumentsResponse> {
  const response = await axios.get("/api/worker/service-documents");
  return response.data;
}

/**
 * Hook to fetch service qualification documents with smart caching
 *
 * Features:
 * - Caches data for 5 minutes (staleTime)
 * - Keeps cached data for 30 minutes (gcTime)
 * - Automatic background refetching when stale
 * - Deduplicates simultaneous requests
 */
export function useServiceDocuments() {
  return useQuery({
    queryKey: serviceDocumentsKeys.all,
    queryFn: fetchServiceDocuments,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache
    retry: 1, // Retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
}

/**
 * Hook to upload a service document
 * OPTIMIZED: Uses optimistic updates for instant UI feedback
 */
export function useUploadServiceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      serviceTitle,
      requirementType,
    }: {
      file: File;
      serviceTitle: string;
      requirementType: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("serviceTitle", serviceTitle);
      formData.append("requirementType", requirementType);

      const result = await uploadServiceDocument(formData);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      return result;
    },
    // TRUE OPTIMISTIC UPDATE: Update cache BEFORE server responds
    // This makes preview links appear INSTANTLY while upload happens in background
    onMutate: async (variables) => {
      // 1. Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: serviceDocumentsKeys.all,
      });

      // 2. Snapshot previous value for rollback on error
      const previousDocuments = queryClient.getQueryData(serviceDocumentsKeys.all);

      // 3. OPTIMISTICALLY update document cache (INSTANT UI feedback)
      const optimisticDocument = {
        id: 'temp-' + Date.now(), // Temporary ID until server responds
        documentType: variables.requirementType, // Base type
        documentUrl: URL.createObjectURL(variables.file), // Preview URL
        uploadedAt: new Date().toISOString(),
        status: "SUBMITTED",
        serviceTitle: variables.serviceTitle,
      };

      queryClient.setQueryData(
        serviceDocumentsKeys.all,
        (old: any) => {
          if (!old?.documents) {
            return { success: true, documents: [optimisticDocument] };
          }

          // Add new document or update existing
          const existingIndex = old.documents.findIndex(
            (doc: ServiceDocument) =>
              doc.documentType === variables.requirementType &&
              doc.serviceTitle === variables.serviceTitle
          );

          if (existingIndex >= 0) {
            // Update existing
            const updated = [...old.documents];
            updated[existingIndex] = { ...updated[existingIndex], ...optimisticDocument };
            return { ...old, documents: updated };
          } else {
            // Add new
            return { ...old, documents: [optimisticDocument, ...old.documents] };
          }
        }
      );

      // 4. OPTIMISTICALLY update setupProgress checkmarks (INSTANT checkmark!)
      import("@/hooks/queries/useWorkerProfile").then(({ workerProfileKeys }) => {
        const currentProfileData = queryClient.getQueryData(
          workerProfileKeys.all
        ) as any;

        if (currentProfileData && Array.isArray(currentProfileData)) {
          const profileData = currentProfileData[0];
          if (profileData?.setupProgress) {
            // Optimistically mark services as complete
            const optimisticProgress = {
              ...profileData.setupProgress,
              services: true, // Will be verified by server
            };

            queryClient.setQueryData(
              workerProfileKeys.all,
              [{
                ...profileData,
                setupProgress: optimisticProgress,
              }]
            );
          }
        }
      }).catch(() => {
        // Silently fail - not critical
      });

      // Return context for rollback
      return { previousDocuments };
    },
    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          serviceDocumentsKeys.all,
          context.previousDocuments
        );
      }

      // Rollback setupProgress optimistic update
      import("@/hooks/queries/useWorkerProfile").then(({ workerProfileKeys }) => {
        queryClient.invalidateQueries({
          queryKey: workerProfileKeys.all,
        });
      }).catch(() => {});
    },
    // Update with real data from server
    onSuccess: (result) => {
      if (result.success && result.data) {
        // Parse composite requirementType to extract base type
        const requirementParts = result.data.requirementType.split(':');
        const baseRequirementType = requirementParts.length > 1
          ? requirementParts[requirementParts.length - 1]
          : result.data.requirementType;

        // Replace optimistic data with real server data
        queryClient.setQueryData(
          serviceDocumentsKeys.all,
          (old: any) => {
            const newDocument = {
              id: result.data.id || `doc-${Date.now()}`,
              documentType: baseRequirementType,
              documentUrl: result.data.documentUrl,
              uploadedAt: result.data.uploadedAt,
              status: "SUBMITTED",
              serviceTitle: result.data.serviceTitle,
            };

            if (!old?.documents) {
              return { success: true, documents: [newDocument] };
            }

            // Replace temporary document with real one
            const withoutTemp = old.documents.filter((doc: ServiceDocument) => !doc.id.startsWith('temp-'));
            return { ...old, documents: [newDocument, ...withoutTemp] };
          }
        );
      }

      // Invalidate to refetch fresh setupProgress from server (with real-time calculation)
      import("@/hooks/queries/useWorkerProfile").then(({ workerProfileKeys }) => {
        queryClient.invalidateQueries({
          queryKey: workerProfileKeys.all,
        });
      }).catch(() => {});
    },
  });
}

/**
 * Hook to delete a service document
 * OPTIMIZED: Uses true optimistic updates with automatic rollback
 */
export function useDeleteServiceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      requirementType,
      documentUrl,
    }: {
      userId: string;
      requirementType: string;
      documentUrl: string;
    }) => {
      const result = await deleteServiceDocument(userId, requirementType, documentUrl);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete document");
      }

      return result;
    },
    // TRUE OPTIMISTIC UPDATE: Update cache BEFORE server call
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: serviceDocumentsKeys.all,
      });

      // Snapshot the previous value for rollback
      const previousDocuments = queryClient.getQueryData(serviceDocumentsKeys.all);

      // Optimistically remove document from cache (INSTANT UI feedback)
      queryClient.setQueryData(
        serviceDocumentsKeys.all,
        (old: any) => {
          if (!old?.documents) return old;

          return {
            ...old,
            documents: old.documents.filter(
              (doc: ServiceDocument) => doc.documentType !== variables.requirementType
            ),
          };
        }
      );

      // Return snapshot for rollback if mutation fails
      return { previousDocuments };
    },
    // If mutation fails, rollback to previous state
    onError: (error, variables, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          serviceDocumentsKeys.all,
          context.previousDocuments
        );
      }
    },
    // Always refetch after mutation completes (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: serviceDocumentsKeys.all,
      });

      // Also invalidate worker profile to update setupProgress checkmarks
      // Using .then() to avoid making onSettled async
      // Small delay to prevent race conditions
      setTimeout(() => {
        import("@/hooks/queries/useWorkerProfile").then(({ workerProfileKeys }) => {
          queryClient.invalidateQueries({
            queryKey: workerProfileKeys.all,
          });
        }).catch(() => {
          // Silently fail if import fails - not critical
        });
      }, 100);
    },
  });
}
