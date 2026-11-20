"use client";

// What a service will ask of the worker (GET /v1/service-requirements, 2026-11-19): the dashboard's groups for one
// service and its chosen sub-services, for the sign-up's services notice. null when the api cannot say (the notice
// then points to the dashboard without a list).
import { createClient, registrationContract, type ServiceRequirementsPreview } from "@remonta/api-contract";
import type { Backend } from "@remonta/form-engine";

export type RequirementGroups = ServiceRequirementsPreview["groups"];

export async function fetchServiceRequirements(backend: Backend, categoryId: string, subcategoryIds: readonly string[]): Promise<RequirementGroups | null> {
  try {
    const r = await createClient(registrationContract, { baseUrl: backend.apiBaseUrl }).listServiceRequirements({
      query: { categoryId, ...(subcategoryIds.length ? { subcategoryIds: subcategoryIds.join(",") } : {}) },
    });
    return r.ok ? r.body.groups : null;
  } catch {
    return null;
  }
}
