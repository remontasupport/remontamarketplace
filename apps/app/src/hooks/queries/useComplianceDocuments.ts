/**
 * Compliance documents (api-review U4b): the worker's identity, check, training and Code of Conduct documents, on
 * apps/api.
 *
 * - Every read is a `select` on the profile read's `complianceDocuments` (one cache entry with the rest of the
 *   profile), in the shapes the steps already read: `{documents, metadata}` and `{document}`.
 * - An upload goes straight to the private bucket (ticket -> upload -> confirm, U4a) through the background queue,
 *   which keeps it running when the page is left; an optimistic row shows at once.
 * - A delete is by the document's id; the api deletes its file too.
 * The legacy profile query (setupProgress, the setup page) is refreshed after each change.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ComplianceDocument as ApiComplianceDocument, Profile } from "@remonta/api-contract";
import { workerApi } from "@/features/worker/api";
import { documentOf, documentsOf, type LegacyComplianceDocument } from "@/features/worker/compliance";
import { PROFILE_QUERY_KEY, PROFILE_STALE_MS, readProfile, reloadProfileInto } from "@/features/worker/profile";
import { messageOf } from "@/features/worker/services";
import { backgroundUploadQueue } from "@/lib/backgroundUploadQueue";

/** Kept for the pages that invalidate by it: the documents now live in the profile entry. */
export const complianceDocumentsKeys = {
  all: PROFILE_QUERY_KEY,
  byType: (_documentType: string) => PROFILE_QUERY_KEY,
};

export type ComplianceDocument = LegacyComplianceDocument;

export interface ComplianceDocumentsResponse {
  success?: boolean;
  documents?: ComplianceDocument[];
  document?: ComplianceDocument | null;
  /** Right to Work: the citizenship answer. */
  metadata?: { isCitizen: boolean } | null;
}

export function useProfileSelect<T>(select: (p: Profile) => T, enabled = true) {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: ({ signal }) => readProfile("default", signal),
    staleTime: PROFILE_STALE_MS,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled,
    select,
  });
}

/** The documents of one type (the list format, with the Right to Work answer). The endpoint argument is ignored. */
export function useComplianceDocuments(documentType?: string, _apiEndpoint?: string) {
  return useProfileSelect<ComplianceDocumentsResponse>((p) => documentsOf(p, documentType ?? ""), !!documentType);
}

/** The one document of a type (Police Check, Worker Screening, ...). The endpoint argument is ignored. */
export function useSingleComplianceDocument(_apiEndpoint: string, documentType: string = "single-document") {
  return useProfileSelect<ComplianceDocumentsResponse>((p) => documentOf(p, documentType));
}

/** Upload one document of a type; it replaces the previous one. */
export function useUploadComplianceDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, documentType, requirementName, expiryDate }: { file: File; documentType: string; requirementName?: string; expiryDate?: string; apiEndpoint?: string }) =>
      // The queue holds the running promise, so the upload finishes when the page is left; the callbacks below run
      // on the query client either way.
      backgroundUploadQueue.enqueue({ file, documentType, requirementName, expiryDate }),
    onMutate: async ({ file, documentType, expiryDate }) => {
      await qc.cancelQueries({ queryKey: PROFILE_QUERY_KEY });
      const previous = qc.getQueryData<Profile>(PROFILE_QUERY_KEY);
      const kept = previous?.complianceDocuments.find((d) => d.requirementType === documentType);
      const optimistic: ApiComplianceDocument = {
        id: `temp-${Date.now()}`,
        requirementType: documentType,
        name: kept?.name ?? "",
        status: "SUBMITTED",
        documentCategory: kept?.documentCategory ?? null,
        url: URL.createObjectURL(file),
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        expiresAt: expiryDate ? `${expiryDate}T00:00:00.000Z` : null,
        isCitizen: kept?.isCitizen ?? null,
      };
      qc.setQueryData<Profile>(PROFILE_QUERY_KEY, (p) =>
        p ? { ...p, complianceDocuments: [optimistic, ...p.complianceDocuments.filter((d) => d.requirementType !== documentType)] } : p,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(PROFILE_QUERY_KEY, ctx.previous);
    },
    onSettled: async () => {
      await reloadProfileInto(qc);
    },
  });
}

/** Delete one document by its id. */
export function useDeleteComplianceDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId }: { documentId: string; documentType: string; apiEndpoint?: string }) => {
      const r = await workerApi.deleteComplianceDocument(documentId);
      if (r.kind !== "ok") throw new Error(messageOf(r, "We couldn't delete your document right now. Please try again."));
      return { success: true as const };
    },
    onMutate: async ({ documentId }) => {
      await qc.cancelQueries({ queryKey: PROFILE_QUERY_KEY });
      const previous = qc.getQueryData<Profile>(PROFILE_QUERY_KEY);
      qc.setQueryData<Profile>(PROFILE_QUERY_KEY, (p) => (p ? { ...p, complianceDocuments: p.complianceDocuments.filter((d) => d.id !== documentId) } : p));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(PROFILE_QUERY_KEY, ctx.previous);
    },
    onSettled: async () => {
      await reloadProfileInto(qc);
    },
  });
}
