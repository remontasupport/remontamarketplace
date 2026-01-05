/**
 * Compliance Documents Query Hook
 *
 * Fetches uploaded compliance documents with smart caching
 * OPTIMIZED: Prevents UI flash by keeping previous data while refetching
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadComplianceDocument,
  deleteComplianceDocument,
} from "@/services/worker/compliance.service";

// Query Keys
export const complianceDocumentsKeys = {
  all: ["compliance-documents"] as const,
  byType: (documentType: string) =>
    [...complianceDocumentsKeys.all, { documentType }] as const,
};

// Types
export interface ComplianceDocument {
  id: string;
  documentType: string;
  documentUrl: string;
  uploadedAt: string;
  expiryDate?: string;
}

export interface ComplianceDocumentsResponse {
  success: boolean;
  documents: ComplianceDocument[];
  document?: ComplianceDocument; // For single document responses
  metadata?: any; // For Right to Work citizenship status and other flexible data
}

// API Fetcher
async function fetchComplianceDocuments(
  documentType: string,
  apiEndpoint: string = "/api/worker/compliance-documents"
): Promise<ComplianceDocumentsResponse> {
  const response = await fetch(
    `${apiEndpoint}?documentType=${encodeURIComponent(documentType)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch compliance documents");
  }

  return response.json();
}

/**
 * Hook to fetch compliance documents for a specific document type
 * OPTIMIZED: Prevents UI flash using React Query caching
 *
 * Features:
 * - Keeps previous data visible while refetching
 * - Smart caching (5 minutes stale time)
 * - Background refetching for fresh data
 * - No UI flash when navigating between steps
 *
 * @param documentType - The type of document to fetch
 * @param apiEndpoint - Optional custom API endpoint
 */
export function useComplianceDocuments(
  documentType?: string,
  apiEndpoint: string = "/api/worker/compliance-documents"
) {
  return useQuery({
    queryKey: complianceDocumentsKeys.byType(documentType || ""),
    queryFn: () => fetchComplianceDocuments(documentType!, apiEndpoint),
    enabled: !!documentType, // Only fetch when documentType is provided
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache
    retry: 1, // Retry once on failure
  });
}

/**
 * Hook to upload a compliance document
 * REFACTORED: Now uses server action instead of API endpoint
 */
export function useUploadComplianceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      documentType,
      requirementName,
      expiryDate,
      apiEndpoint, // Deprecated - kept for backward compatibility but ignored
    }: {
      file: File;
      documentType: string;
      requirementName?: string;
      expiryDate?: string;
      apiEndpoint?: string; // Deprecated
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      if (requirementName) {
        formData.append("documentName", requirementName); // Use documentName for consistency
      }
      if (expiryDate) {
        formData.append("expiryDate", expiryDate);
      }

      // Use server action instead of API endpoint
      const result = await uploadComplianceDocument(formData);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      return result;
    },
    // Cancel outgoing refetches to prevent race conditions
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: complianceDocumentsKeys.byType(variables.documentType),
      });
    },
    onSuccess: (result, variables) => {
      // OPTIMISTIC UPDATE: Immediately populate cache with uploaded document
      // This prevents the delay from refetching the same data we just uploaded
      if (result.success && result.data) {
        const documentData = {
          id: result.data.id,
          documentUrl: result.data.documentUrl,
          documentType: result.data.documentType,
          uploadedAt: result.data.uploadedAt,
        };

        // Update cache with the new document (prevents refetch delay)
        // Format must match API response exactly: { document: {...} }
        queryClient.setQueryData(
          complianceDocumentsKeys.byType(variables.documentType),
          {
            document: documentData,
          }
        );
      }

      // Still invalidate for eventual consistency (background refetch)
      // This ensures data stays in sync if there are any server-side transformations
      // NOTE: Only invalidate the specific documentType to prevent race conditions
      // when uploading multiple documents simultaneously
      queryClient.invalidateQueries({
        queryKey: complianceDocumentsKeys.byType(variables.documentType),
      });
      // REMOVED: complianceDocumentsKeys.all invalidation
      // Reason: Causes race condition when uploading multiple docs simultaneously
      // Each document type has its own cache entry, no need to invalidate all
    },
  });
}

/**
 * Hook to delete a compliance document
 * REFACTORED: Now uses server action instead of API endpoint
 */
export function useDeleteComplianceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      documentType,
      apiEndpoint, // Deprecated - kept for backward compatibility but ignored
    }: {
      documentId: string;
      documentType: string;
      apiEndpoint?: string; // Deprecated
    }) => {
      // Use server action instead of API endpoint
      const result = await deleteComplianceDocument(documentId);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete document");
      }

      return result;
    },
    // TRUE OPTIMISTIC UPDATE: Update cache BEFORE server call
    // This makes the UI update instantly while server processes in background
    onMutate: async (variables) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: complianceDocumentsKeys.byType(variables.documentType),
      });

      // Snapshot the previous value for rollback
      const previousDocument = queryClient.getQueryData(
        complianceDocumentsKeys.byType(variables.documentType)
      );

      // Optimistically update cache (INSTANT UI feedback)
      queryClient.setQueryData(
        complianceDocumentsKeys.byType(variables.documentType),
        {
          document: null,
        }
      );

      // Return snapshot for rollback if mutation fails
      return { previousDocument };
    },
    // If mutation fails, rollback to previous state
    onError: (error, variables, context) => {
      if (context?.previousDocument) {
        queryClient.setQueryData(
          complianceDocumentsKeys.byType(variables.documentType),
          context.previousDocument
        );
      }
    },
    // Always refetch after mutation completes (success or error)
    // This ensures cache is in sync with server
    // NOTE: Only invalidate the specific documentType to prevent race conditions
    // when deleting multiple documents simultaneously
    onSettled: (result, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: complianceDocumentsKeys.byType(variables.documentType),
      });
      // REMOVED: complianceDocumentsKeys.all invalidation
      // Reason: Causes race condition when deleting multiple docs simultaneously
      // If File 1 completes and invalidates ALL, it refetches File 2 while File 2
      // is still being deleted, causing File 2 to briefly reappear before disappearing
    },
  });
}

/**
 * Hook for single document endpoints (Police Check, Worker Screening, etc.)
 * These endpoints return { document } instead of { documents: [] }
 *
 * REFACTORED: Now supports both legacy endpoints and generic endpoint
 * - Legacy: Direct call to specific endpoint (e.g., /api/worker/police-check)
 * - Generic: Uses /api/worker/compliance-documents?documentType={type}&format=single
 */
export function useSingleComplianceDocument(
  apiEndpoint: string,
  documentType: string = "single-document"
) {
  return useQuery({
    queryKey: complianceDocumentsKeys.byType(documentType),
    queryFn: async () => {
      // Check if this is the generic endpoint or a legacy specific endpoint
      const isGenericEndpoint = apiEndpoint.includes("compliance-documents");

      let url: string;

      if (isGenericEndpoint) {
        // Using generic endpoint - add format=single parameter
        url = `${apiEndpoint}?documentType=${encodeURIComponent(documentType)}&format=single`;
      } else {
        // Legacy specific endpoint - use as-is for backward compatibility
        url = apiEndpoint;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }
      return response.json() as Promise<ComplianceDocumentsResponse>;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}
