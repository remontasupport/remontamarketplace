/**
 * Service documents (api-review U3c): the worker's documents for their services, on apps/api.
 *
 * - The list is the profile read's `serviceDocuments` (one cache entry with the rest of the profile), in the shape
 *   the Services pages already read.
 * - An upload goes straight to the private bucket (ticket -> upload -> confirm, U3b): the file never passes through a
 *   Next.js function. "Other Documents" (insurance, transport) goes to the api's fixed target `other-documents` (U4e).
 * - A delete is by the document's id; the api deletes its file too.
 * The legacy profile query (setupProgress, the sidebar's checkmarks) is refreshed after each change.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Profile, ServiceDocument } from "@remonta/api-contract";
import { workerApi } from "@/features/worker/api";
import { currentProfile, PROFILE_QUERY_KEY, PROFILE_STALE_MS, readProfile, refreshLegacyProfile, reloadProfileInto } from "@/features/worker/profile";
import { categoryIdOf, legacyDocumentOf, messageOf, uploadServiceDocument as uploadToApi, type LegacyServiceDocument } from "@/features/worker/services";

/** Kept for the pages that invalidate by it: the documents now live in the profile entry. */
/** "Other Documents" is not a service: the api's fixed target for insurance and transport documents (U4e). */
export const OTHER_DOCUMENTS_TITLE = "Other Documents";
const OTHER_DOCUMENTS_ID = "other-documents";

export const serviceDocumentsKeys = {
  all: PROFILE_QUERY_KEY,
  byType: (requirementType: string) => [...PROFILE_QUERY_KEY, { requirementType }] as const,
};

export interface ServiceDocumentsResponse {
  success: boolean;
  documents: LegacyServiceDocument[];
}

/** The worker's service documents, from the profile read. */
export function useServiceDocuments() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: ({ signal }) => readProfile("default", signal),
    staleTime: PROFILE_STALE_MS,
    retry: 1,
    refetchOnWindowFocus: false,
    select: (p: Profile): ServiceDocumentsResponse => ({ success: true, documents: p.serviceDocuments.map(legacyDocumentOf) }),
  });
}

export interface UploadResult {
  success: true;
  /** `url` and `documentUrl` both: the qualifications step reads `url` (S8: it read a field the action never returned). */
  data: { id: string; url: string; documentUrl: string; requirementType: string; serviceTitle: string; uploadedAt: string };
}

/** Upload one document for a service and a type; an optimistic row shows at once. */
export function useUploadServiceDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, serviceTitle, requirementType }: { file: File; serviceTitle: string; requirementType: string }): Promise<UploadResult> => {
      const categoryId = serviceTitle === OTHER_DOCUMENTS_TITLE ? OTHER_DOCUMENTS_ID : categoryIdOf(await currentProfile(qc), serviceTitle);
      if (!categoryId) throw new Error("This service is not one of yours. Please refresh the page and try again.");
      const r = await uploadToApi(file, { categoryId, requirementType });
      if (!r.ok) throw new Error(r.message);
      const url = r.document.url ?? "";
      return { success: true, data: { id: r.document.id, url, documentUrl: url, requirementType, serviceTitle, uploadedAt: r.document.uploadedAt ?? new Date().toISOString() } };
    },
    onMutate: async ({ file, serviceTitle, requirementType }) => {
      await qc.cancelQueries({ queryKey: PROFILE_QUERY_KEY });
      const previous = qc.getQueryData<Profile>(PROFILE_QUERY_KEY);
      const optimistic: ServiceDocument = {
        id: `temp-${Date.now()}`,
        serviceName: serviceTitle,
        requirementType,
        name: "",
        status: "SUBMITTED",
        url: URL.createObjectURL(file),
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      };
      qc.setQueryData<Profile>(PROFILE_QUERY_KEY, (p) =>
        p ? { ...p, serviceDocuments: [optimistic, ...p.serviceDocuments.filter((d) => !(d.serviceName === serviceTitle && d.requirementType === requirementType))] } : p,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(PROFILE_QUERY_KEY, ctx.previous);
    },
    onSettled: async () => {
      await reloadProfileInto(qc);
      refreshLegacyProfile(qc);
    },
  });
}

/**
 * Delete one document, found by its URL in the cached list (the pages hold the URL). The id is looked up before the
 * row leaves the cache: the optimistic removal used to run first, so the lookup never found it and every delete fell
 * back to the legacy action (found 2026-10-16).
 */
export function useDeleteServiceDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentUrl }: { userId: string; requirementType: string; documentUrl: string }) => {
      const profile = await currentProfile(qc);
      const doc = profile.serviceDocuments.find((d) => d.url === documentUrl && !d.id.startsWith("temp-"));
      if (!doc) throw new Error("This document is no longer on your profile. Please refresh the page.");
      // Shown gone at once; onError puts the snapshot back.
      qc.setQueryData<Profile>(PROFILE_QUERY_KEY, (p) => (p ? { ...p, serviceDocuments: p.serviceDocuments.filter((d) => d.id !== doc.id) } : p));
      const r = await workerApi.deleteServiceDocument(doc.id);
      if (r.kind !== "ok") throw new Error(messageOf(r));
      return { success: true as const };
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: PROFILE_QUERY_KEY });
      return { previous: qc.getQueryData<Profile>(PROFILE_QUERY_KEY) };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(PROFILE_QUERY_KEY, ctx.previous);
    },
    onSettled: async () => {
      await reloadProfileInto(qc);
      refreshLegacyProfile(qc);
    },
  });
}
