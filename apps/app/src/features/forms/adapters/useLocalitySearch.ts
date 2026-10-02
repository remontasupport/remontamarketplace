"use client";

// Debounced suburb suggestions from apps/api (GET /v1/localities), like every other
// call the sign-up makes. The one place the locality field's data comes from -- the
// replacement for the fetch + debounce copied into each suburb picker.
import { useEffect, useRef, useState } from "react";
import { createClient, registrationContract } from "@remonta/api-contract";
import type { Backend } from "@remonta/form-engine";
import type { LocalityOption } from "@/components/ui/form-wizard/fields";

async function fromApi(apiBaseUrl: string, q: string): Promise<LocalityOption[]> {
  const r = await createClient(registrationContract, { baseUrl: apiBaseUrl }).searchLocalities({ query: { q } });
  if (!r.ok) return [];
  return r.body.localities.map((l) => ({ id: l.id, name: l.suburb, state: l.state, postcode: l.postcode }));
}

export function useLocalitySearch(query: string, backend: Backend, delayMs = 300) {
  const [suggestions, setSuggestions] = useState<LocalityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);
  const apiBaseUrl = backend.apiBaseUrl;

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await fromApi(apiBaseUrl, query);
        if (ticket !== latest.current) return; // a newer query answered already
        setSuggestions(rows);
      } catch {
        if (ticket === latest.current) setSuggestions([]);
      } finally {
        if (ticket === latest.current) setLoading(false);
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [query, delayMs, apiBaseUrl]);

  return { suggestions, loading };
}
