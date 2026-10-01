"use client";

// The services step's catalogue. In api mode it comes from apps/api
// (GET /v1/service-categories), like every other call the sign-up makes; in legacy
// mode from this app's /api/categories, as before. Same Category shape either way,
// so the step and its descriptions do not care which.
import { useQuery } from "@tanstack/react-query";
import { createClient, registrationContract } from "@remonta/api-contract";
import type { Backend } from "@remonta/form-engine";
import { categoriesKeys, fetchCategories, type Category } from "@/hooks/queries/useCategories";

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
  const apiBaseUrl = backend.mode === "api" ? backend.apiBaseUrl : null;
  return useQuery({
    queryKey: [...categoriesKeys.all, apiBaseUrl ?? "app"],
    queryFn: apiBaseUrl ? () => fetchFromApi(apiBaseUrl) : fetchCategories,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
