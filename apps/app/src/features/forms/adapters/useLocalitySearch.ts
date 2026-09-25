"use client";

// Debounced suburb suggestions from /api/suburbs (lib/suburbs: au_localities).
// The one place the locality field's data comes from -- the replacement for the
// fetch + debounce copied into each suburb picker today.
import { useEffect, useRef, useState } from "react";
import type { LocalityOption } from "@/components/ui/form-wizard/fields";

export function useLocalitySearch(query: string, delayMs = 300) {
  const [suggestions, setSuggestions] = useState<LocalityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/suburbs?q=${encodeURIComponent(query)}`);
        const data: unknown = await res.json();
        if (ticket !== latest.current) return; // a newer query answered already
        const rows = Array.isArray(data) ? (data as { id: number | null; name: string; postcode: string | number; state: { abbreviation: string } }[]) : [];
        setSuggestions(rows.map((r) => ({ id: r.id ?? null, name: r.name, state: r.state.abbreviation, postcode: String(r.postcode).padStart(4, "0") })));
      } catch {
        if (ticket === latest.current) setSuggestions([]);
      } finally {
        if (ticket === latest.current) setLoading(false);
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [query, delayMs]);

  return { suggestions, loading };
}
