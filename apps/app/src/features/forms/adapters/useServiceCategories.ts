"use client";

// The services step's catalogue, from apps/api (GET /v1/service-categories), like
// every other call the sign-up makes. The same Category shape the rest of the app
// uses, so the step and its descriptions do not care where it came from.
import { useQuery } from "@tanstack/react-query";
import { createClient, registrationContract } from "@remonta/api-contract";
import type { Backend } from "@remonta/form-engine";
import { categoriesKeys, type Category } from "@/hooks/queries/useCategories";

async function fetchFromApi(apiBaseUrl: string): Promise<Category[]> {
  const r = await createClient(registrationContract, { baseUrl: apiBaseUrl }).listServiceCategories({});
  if (!r.ok) throw new Error(`service categories: HTTP ${r.status}`);
  // The api sends only what the step shows; the document lists are not part of it.
  return r.body.categories.map((c) => ({
    ...c,
    documents: { required: [], optional: [], conditional: [] },
    subcategories: c.subcategories.map((s) => ({ ...s, additionalDocuments: [] })),
  }));
}

export function useServiceCategories(backend: Backend) {
  const apiBaseUrl = backend.apiBaseUrl;
  return useQuery({
    queryKey: [...categoriesKeys.all, apiBaseUrl],
    queryFn: () => fetchFromApi(apiBaseUrl),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
