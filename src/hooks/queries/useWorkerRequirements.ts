/**
 * Worker Requirements Query Hook
 *
 * Fetches required documents based on worker's services from the database
 * Implements smart caching with TanStack Query
 */

"use client";

import { useQuery } from "@tanstack/react-query";

// Query Keys - centralized for consistency
export const workerRequirementsKeys = {
  all: ["worker-requirements"] as const,
  byServices: (services?: string[]) =>
    [...workerRequirementsKeys.all, { services }] as const,
  byServiceName: (serviceName?: string) =>
    [...workerRequirementsKeys.all, { serviceName }] as const,
};

// Types
export interface RequirementDocument {
  id: string;
  name: string;
  category: string;
  description: string | null;
  hasExpiration: boolean;
  documentType: 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL';
  serviceCategory: string;
  subcategory?: string;
  conditionKey?: string | null;
  requiredIfTrue?: boolean | null;
}

export interface WorkerRequirements {
  success: boolean;
  services: string[];
  workerServices?: string[];
  requirements: {
    baseCompliance: RequirementDocument[];
    trainings: RequirementDocument[];
    qualifications: RequirementDocument[];
    insurance: RequirementDocument[];
    transport: RequirementDocument[];
  };
}

// API Fetcher
async function fetchWorkerRequirements(
  services?: string[]
): Promise<WorkerRequirements> {
  const url = services && services.length > 0
    ? `/api/worker/requirements?services=${services.join(',')}`
    : '/api/worker/requirements';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch worker requirements");
  }

  return response.json();
}

/**
 * Hook to fetch worker requirements with smart caching
 *
 * Features:
 * - Caches data for 5 minutes (staleTime)
 * - Keeps cached data for 30 minutes (gcTime)
 * - Automatic background refetching when stale
 * - Deduplicates simultaneous requests
 * - Optional services parameter to override worker's saved services
 *
 * @param services - Optional array of services to fetch requirements for
 */
export function useWorkerRequirements(services?: string[]) {
  return useQuery({
    queryKey: workerRequirementsKeys.byServices(services),
    queryFn: () => fetchWorkerRequirements(services),
    staleTime: 30 * 1000, // 30 seconds - data is fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
    retry: 1, // Retry once on failure
  });
}

/**
 * Hook to fetch worker requirements for a specific service
 * OPTIMIZED: Prevents UI flash by using React Query instead of manual fetch
 *
 * @param serviceName - The name of the service to fetch requirements for
 */
export function useWorkerRequirementsByService(serviceName?: string) {
  return useQuery({
    queryKey: workerRequirementsKeys.byServiceName(serviceName),
    queryFn: async () => {
      if (!serviceName) {
        throw new Error("Service name is required");
      }
      const response = await fetch(
        `/api/worker/requirements?serviceName=${encodeURIComponent(serviceName)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch requirements");
      }
      return response.json() as Promise<WorkerRequirements>;
    },
    enabled: !!serviceName, // Only fetch when serviceName is provided
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
