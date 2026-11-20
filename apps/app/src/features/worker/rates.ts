"use client";

// worker-rates (2026-11-20): the rates' own read (GET /v1/worker/rates), apart from the profile read, as a section
// source for useSection: the Rates page seeds from it and reloads it after a save.
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RatesRead } from "@remonta/api-contract";
import type { ApiOutcome } from "@/lib/api/outcome";
import { workerApi } from "./api";
import type { SectionSource } from "./useSection";

export const RATES_QUERY_KEY = ["worker", "rates"] as const;

class RatesReadError extends Error {
  constructor(readonly outcome: Exclude<ApiOutcome<RatesRead>, { kind: "ok" }>) {
    super(`rates read: ${outcome.kind}`);
    this.name = "RatesReadError";
  }
}

async function readRates(cache: "default" | "reload", signal?: AbortSignal): Promise<RatesRead> {
  const r = await workerApi.getRates({ cache, signal });
  if (r.kind === "ok") return r.body;
  throw new RatesReadError(r);
}

export function useRatesRead(): SectionSource {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: RATES_QUERY_KEY,
    queryFn: ({ signal }) => readRates("default", signal),
    retry: (count, err) => count < 1 && !(err instanceof RatesReadError && err.outcome.kind === "unauthenticated"),
  });
  const reload = useCallback(async () => {
    try {
      qc.setQueryData(RATES_QUERY_KEY, await readRates("reload"));
    } catch {
      // the saved rates are already shown; the next read catches up
    }
  }, [qc]);
  return {
    data: q.data,
    isLoading: q.isLoading,
    error: q.error instanceof RatesReadError ? q.error.outcome : q.error ? ({ kind: "unavailable" } as const) : null,
    reload,
  };
}
