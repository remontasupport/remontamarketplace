/**
 * Compliance Documents Query Hook
 *
 * Fetches uploaded compliance documents with smart caching
 * OPTIMIZED: Prevents UI flash by keeping previous data while refetching
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteComplianceDocument,
} from "@/services/worker/compliance.service";
import { backgroundUploadQueue } from "@/lib/backgroundUploadQueue";

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
    enabled: !!documentType,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

/**
 * Hook to upload a compliance document.
 *
 * Key behaviours:
 * - Optimistic update: document appears instantly while server processes in background
 * - Retry: up to 3 attempts with exponential backoff for transient failures
 * - Rollback: ALWAYS reverts the optimistic update on failure, including when there
 *   was no previous document (fixes: `if (context?.previousDocument)` was falsy for
 *   new uploads, leaving the UI stuck showing a dangling blob URL after a failure)
 * - Settled: invalidates the query after every attempt to verify server state
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
      // Route through the module-level BackgroundUploadQueue.
      //
      // The queue holds a strong reference to the running promise, so it is
      // never garbage-collected when this component unmounts or the user
      // navigates away. The upload always runs to completion (or exhausts
      // its 3 retries) regardless of page state.
      //
      // The callbacks below update the React Query cache directly on the
      // QueryClient singleton — this works even after component unmount,
      // ensuring the cache reflects the real server state when the user
      // eventually returns to a page that reads these documents.
      return backgroundUploadQueue.enqueue(
        { file, documentType, requirementName, expiryDate },
        {
          onSuccess: (result) => {
            if (result?.data) {
              queryClient.setQueryData(
                complianceDocumentsKeys.byType(documentType),
                {
                  document: {
                    id: result.data.id,
                    documentUrl: result.data.documentUrl,
                    documentType: result.data.documentType,
                    uploadedAt: result.data.uploadedAt,
                  },
                }
              );
            }
            import("@/hooks/queries/useWorkerProfile")
              .then(({ workerProfileKeys }) => {
                queryClient.invalidateQueries({ queryKey: workerProfileKeys.all });
              })
              .catch(() => {});
          },
          onError: () => {
            // Clear the optimistic entry and force a re-fetch from the server
            queryClient.setQueryData(
              complianceDocumentsKeys.byType(documentType),
              undefined
            );
            queryClient.invalidateQueries({
              queryKey: complianceDocumentsKeys.byType(documentType),
            });
            import("@/hooks/queries/useWorkerProfile")
              .then(({ workerProfileKeys }) => {
                queryClient.invalidateQueries({ queryKey: workerProfileKeys.all });
              })
              .catch(() => {});
          },
        }
      );
    },

    // Optimistic update: show document immediately while server processes
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: complianceDocumentsKeys.byType(variables.documentType),
      });

      // Snapshot previous value — may be undefined (no cache entry) or null (no doc)
      const previousData = queryClient.getQueryData(
        complianceDocumentsKeys.byType(variables.documentType)
      );

      const optimisticDocument = {
        id: "temp-" + Date.now(),
        documentUrl: URL.createObjectURL(variables.file),
        documentType: variables.documentType,
        uploadedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(
        complianceDocumentsKeys.byType(variables.documentType),
        { document: optimisticDocument }
      );

      // Optimistically update setupProgress checkmarks
      import("@/hooks/queries/useWorkerProfile")
        .then(({ workerProfileKeys }) => {
          const currentProfileData = queryClient.getQueryData(
            workerProfileKeys.all
          ) as any;

          if (currentProfileData && Array.isArray(currentProfileData)) {
            const profileData = currentProfileData[0];
            if (profileData?.setupProgress) {
              const isCompliance = [
                "right-to-work",
                "police-check",
                "ndis-screening-check",
                "abn-contractor",
              ].includes(variables.documentType);
              const isTraining = [
                "infection-control",
                "first-aid",
                "behaviour-support",
                "manual-handling",
                "ndis-worker-orientation",
              ].includes(variables.documentType);

              queryClient.setQueryData(workerProfileKeys.all, [
                {
                  ...profileData,
                  setupProgress: {
                    ...profileData.setupProgress,
                    ...(isCompliance && { compliance: true }),
                    ...(isTraining && { trainings: true }),
                  },
                },
              ]);
            }
          }
        })
        .catch(() => {});

      return { previousData };
    },

    // CRITICAL FIX: Always rollback the optimistic update on failure.
    //
    // The previous code used `if (context?.previousDocument)` which is falsy
    // when previousDocument is null or undefined (i.e. a brand-new upload with
    // no existing document in cache). This meant a failed first upload would
    // leave the UI showing the document as "uploaded" indefinitely via the
    // dangling blob URL set during onMutate.
    //
    // Fix: unconditionally restore previousData (null/undefined clears the entry)
    // and then invalidate so React Query re-fetches the real server state.
    onError: (_error, variables, context) => {
      // Restore the cache to whatever it was before the optimistic update.
      // Setting to undefined removes the entry; React Query will refetch.
      queryClient.setQueryData(
        complianceDocumentsKeys.byType(variables.documentType),
        context?.previousData ?? undefined
      );

      // Force a server-side verification fetch
      queryClient.invalidateQueries({
        queryKey: complianceDocumentsKeys.byType(variables.documentType),
      });

      // Rollback setupProgress optimistic update
      import("@/hooks/queries/useWorkerProfile")
        .then(({ workerProfileKeys }) => {
          queryClient.invalidateQueries({ queryKey: workerProfileKeys.all });
        })
        .catch(() => {});
    },

    // Replace optimistic data with real server data on success
    onSuccess: (result, variables) => {
      if (result.success && result.data) {
        queryClient.setQueryData(
          complianceDocumentsKeys.byType(variables.documentType),
          {
            document: {
              id: result.data.id,
              documentUrl: result.data.documentUrl,
              documentType: result.data.documentType,
              uploadedAt: result.data.uploadedAt,
            },
          }
        );
      }

      import("@/hooks/queries/useWorkerProfile")
        .then(({ workerProfileKeys }) => {
          queryClient.invalidateQueries({ queryKey: workerProfileKeys.all });
        })
        .catch(() => {});
    },

    // Safety net: after every upload attempt (success or error) re-validate
    // the specific document type so the cache never drifts from server state
    onSettled: (_data, _error, variables) => {
      // Small delay on success to avoid racing with the setQueryData in onSuccess
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: complianceDocumentsKeys.byType(variables.documentType),
        });
      }, 300);
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
      apiEndpoint, // Deprecated - kept for backward compatibility but ignored
    }: {
      documentId: string;
      documentType: string;
      apiEndpoint?: string; // Deprecated
    }) => {
      const result = await deleteComplianceDocument(documentId);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete document");
      }

      return result;
    },

    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: complianceDocumentsKeys.byType(variables.documentType),
      });

      const previousData = queryClient.getQueryData(
        complianceDocumentsKeys.byType(variables.documentType)
      );

      queryClient.setQueryData(
        complianceDocumentsKeys.byType(variables.documentType),
        { document: null, documents: [] }
      );

      return { previousData };
    },

    // Always rollback on delete failure (same fix as upload onError)
    onError: (_error, variables, context) => {
      queryClient.setQueryData(
        complianceDocumentsKeys.byType(variables.documentType),
        context?.previousData ?? undefined
      );

      queryClient.invalidateQueries({
        queryKey: complianceDocumentsKeys.byType(variables.documentType),
      });
    },

    onSettled: (_result, _error, variables) => {
      // Only invalidate the specific documentType — prevents race conditions
      // when multiple documents are deleted simultaneously
      queryClient.invalidateQueries({
        queryKey: complianceDocumentsKeys.byType(variables.documentType),
      });

      setTimeout(() => {
        import("@/hooks/queries/useWorkerProfile")
          .then(({ workerProfileKeys }) => {
            queryClient.invalidateQueries({ queryKey: workerProfileKeys.all });
          })
          .catch(() => {});
      }, 100);
    },
  });
}

/**
 * Hook for single document endpoints (Police Check, Worker Screening, etc.)
 */
export function useSingleComplianceDocument(
  apiEndpoint: string,
  documentType: string = "single-document"
) {
  return useQuery({
    queryKey: complianceDocumentsKeys.byType(documentType),
    queryFn: async () => {
      const isGenericEndpoint = apiEndpoint.includes("compliance-documents");
      const url = isGenericEndpoint
        ? `${apiEndpoint}?documentType=${encodeURIComponent(documentType)}&format=single`
        : apiEndpoint;

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
