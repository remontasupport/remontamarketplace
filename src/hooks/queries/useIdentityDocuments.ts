/**
 * Identity Documents Query Hook
 *
 * Manages fetching and caching of identity documents
 * Uses TanStack Query for smart caching and automatic refetching
 *
 * Following Best_Fetching_Practic.md:
 * ✅ 5-minute staleTime
 * ✅ 30-minute cache
 * ✅ Single source of truth
 * ✅ Automatic cache invalidation
 */

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface IdentityDocument {
  id: string;
  documentType: string;
  documentUrl: string;
  documentCategory: string | null;
  status: string;
  uploadedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}

interface IdentityDocumentsResponse {
  success: boolean;
  documents: IdentityDocument[];
}

/**
 * Query key factory for identity documents
 */
export const identityDocumentsKeys = {
  all: ['identity-documents'] as const,
  user: (userId: string | undefined) => [...identityDocumentsKeys.all, userId] as const,
};

/**
 * Fetch all identity documents for the current user
 */
export function useIdentityDocuments() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: identityDocumentsKeys.user(session?.user?.id),
    queryFn: async () => {
      const response = await fetch('/api/worker/identity-documents');
      if (!response.ok) {
        throw new Error('Failed to fetch identity documents');
      }
      const data: IdentityDocumentsResponse = await response.json();
      return data;
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 30 * 60 * 1000,   // 30 minutes - cache retention
  });
}

/**
 * Hook to check if driver's license exists and get its details
 *
 * Returns:
 * - driverLicense: The document object if exists
 * - isLoading: True while fetching
 * - hasDriverLicense: Boolean indicating if license exists
 */
export function useDriverLicense() {
  const { data, isLoading, error } = useIdentityDocuments();

  const driverLicense = data?.documents?.find(
    (doc) => doc.documentType === 'identity-drivers-license'
  );

  return {
    driverLicense: driverLicense || null,
    isLoading,
    hasDriverLicense: !!driverLicense,
    error,
  };
}
