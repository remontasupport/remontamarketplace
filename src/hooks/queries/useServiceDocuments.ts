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
    // Cancel outgoing refetches to prevent race conditions
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: serviceDocumentsKeys.all,
      });
    },
    onSuccess: (result) => {
      // OPTIMISTIC UPDATE: Immediately populate cache with uploaded document
      // This prevents the delay from refetching the same data we just uploaded
      if (result.success && result.data) {
        // Update the documents list cache
        queryClient.setQueryData(
          serviceDocumentsKeys.all,
          (old: any) => {
            const newDocument = {
              id: `temp-${Date.now()}`, // Temporary ID until refetch
              documentType: result.data.requirementType,
              documentUrl: result.data.documentUrl,
              uploadedAt: result.data.uploadedAt,
              status: "SUBMITTED",
              serviceTitle: result.data.serviceTitle,
            };

            if (!old?.documents) {
              return { success: true, documents: [newDocument] };
            }

            // Add new document or update existing
            const existingIndex = old.documents.findIndex(
              (doc: ServiceDocument) => doc.documentType === result.data.requirementType
            );

            if (existingIndex >= 0) {
              // Update existing
              const updated = [...old.documents];
              updated[existingIndex] = { ...updated[existingIndex], ...newDocument };
              return { ...old, documents: updated };
            } else {
              // Add new
              return { ...old, documents: [newDocument, ...old.documents] };
            }
          }
        );
      }

      // Still invalidate for eventual consistency (background refetch)
      // NOTE: Only invalidate service documents, not all queries
      queryClient.invalidateQueries({
        queryKey: serviceDocumentsKeys.all,
      });
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
    },
  });
}
