/**
 * Identity documents (api-review U4b): the 100-point documents and the vehicle driver's licence, selected from the
 * profile read's `complianceDocuments` (apps/api) in the shape the identity step reads.
 */

"use client";

import { identityDocumentsOf } from "@/features/worker/compliance";
import { PROFILE_QUERY_KEY } from "@/features/worker/profile";
import { useProfileSelect } from "./useComplianceDocuments";

/** Kept for the pages that invalidate by it: the documents now live in the profile entry. */
export const identityDocumentsKeys = {
  all: PROFILE_QUERY_KEY,
};

/** All identity documents of the signed-in worker. */
export function useIdentityDocuments() {
  return useProfileSelect(identityDocumentsOf);
}

/** The driver's licence uploaded for vehicle access, if any. */
export function useDriverLicense() {
  const { data, isLoading, error } = useIdentityDocuments();
  const driverLicense = data?.documents.find((doc) => doc.documentType === "driver-license-vehicle") ?? null;
  return { driverLicense, isLoading, hasDriverLicense: !!driverLicense, error };
}
