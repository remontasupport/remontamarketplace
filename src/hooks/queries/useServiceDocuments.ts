/**
 * Service Documents Query Hook
 *
 * Implements data fetching for service qualification documents
 * - Smart caching with 5-minute stale time
 * - Background refetching for fresh data
 * - Cache invalidation on mutations
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Query Keys - centralized for consistency
export const serviceDocumentsKeys = {
  all: ["service-documents"] as const,
};

// Types
interface ServiceDocument {
  id: string;
  documentType: string;
  documentUrl: string;
  uploadedAt: string;
  status: string;
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
