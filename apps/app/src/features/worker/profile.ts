"use client";

// The signed-in worker's profile read (U2 H1, R9.5): one React Query key shared by the
// sidebar and every Edit Profile page, fresh for a minute (the api's private cache), and a
// reload that bypasses the browser's cache after a save. The root layout provides the
// query client, so the sharing needs no provider of its own.
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@remonta/api-contract";
import type { ApiOutcome } from "@/lib/api/outcome";
import { workerApi } from "./api";

export const PROFILE_QUERY_KEY = ["worker", "profile"] as const;
export const PROFILE_STALE_MS = 60_000;

/** A read that did not return the profile; `outcome.kind` says why (unavailable, unauthenticated...). */
export class ProfileReadError extends Error {
  constructor(readonly outcome: Exclude<ApiOutcome<Profile>, { kind: "ok" }>) {
    super(`profile read: ${outcome.kind}`);
    this.name = "ProfileReadError";
  }
}

/** The profile read itself, for a hook that selects from the same cache entry (the Services pages, U3c). */
export async function readProfile(cache: "default" | "reload", signal?: AbortSignal): Promise<Profile> {
  const r = await workerApi.getProfile({ cache, signal });
  if (r.kind === "ok") return r.body;
  throw new ProfileReadError(r);
}

export function useWorkerProfile() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: ({ signal }) => readProfile("default", signal),
    staleTime: PROFILE_STALE_MS,
    refetchOnWindowFocus: true, // a photo's clean copy arrives within a minute of the upload
    refetchOnMount: true,
    retry: (count, err) => count < 1 && !(err instanceof ProfileReadError && err.outcome.kind === "unauthenticated"),
  });

  /** R9.5: the fresh read after a save; the sidebar's badge and children follow from it. */
  const reload = useCallback(async () => {
    try {
      qc.setQueryData(PROFILE_QUERY_KEY, await readProfile("reload"));
    } catch {
      // the saved section is already shown; the next read catches the rest up
    }
  }, [qc]);

  /** Shows a returned section at once, before the reload answers (the photos after an upload). */
  const patch = useCallback(
    (update: (p: Profile) => Profile) => {
      qc.setQueryData<Profile>(PROFILE_QUERY_KEY, (p) => (p ? update(p) : p));
    },
    [qc],
  );

  return {
    profile: q.data,
    isLoading: q.isLoading,
    error: q.error instanceof ProfileReadError ? q.error.outcome : q.error ? ({ kind: "unavailable" } as const) : null,
    reload,
    patch,
  };
}
