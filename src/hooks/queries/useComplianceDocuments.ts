/**
 * Compliance Documents Query Hook
 *
 * Fetches uploaded compliance documents with smart caching
 * OPTIMIZED: Prevents UI flash by keeping previous data while refetching
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadComplianceDocument } from "@/services/worker/compliance.service";

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
    onSuccess: (_, variables) => {
      // Invalidate and refetch compliance documents for this type
      queryClient.invalidateQueries({
        queryKey: complianceDocumentsKeys.byType(variables.documentType),
      });
      // Also invalidate all compliance documents
      queryClient.invalidateQueries({
        queryKey: complianceDocumentsKeys.all,
      });
    },
  });
}

/**
 * Hook to delete a compliance document
 */
export function useDeleteComplianceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      documentType,
      apiEndpoint = "/api/worker/compliance-documents",
    }: {
      documentId: string;
      documentType: string;
      apiEndpoint?: string;
    }) => {
      const response = await fetch(`${apiEndpoint}?id=${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate compliance documents for this type
      queryClient.invalidateQueries({
        queryKey: complianceDocumentsKeys.byType(variables.documentType),
      });
    },
  });
}

/**
 * Hook for single document endpoints (Police Check, Worker Screening, etc.)
 * These endpoints return { document } instead of { documents: [] }
 */
export function useSingleComplianceDocument(
  apiEndpoint: string,
  documentType: string = "single-document"
) {
  return useQuery({
    queryKey: complianceDocumentsKeys.byType(documentType),
    queryFn: async () => {
      const response = await fetch(apiEndpoint);
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
