/**
 * QueryClient Provider Component
 *
 * Wraps the application with TanStack Query QueryClientProvider
 * This enables data caching, background refetching, and optimistic updates
 * throughout the app as per Best_Fetching_Practic.md
 */

"use client";

import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

interface QueryClientProviderProps {
  children: ReactNode;
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  // Create a client instance per component mount
  // This ensures each browser tab has its own cache
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cached data is kept in memory for 30 minutes
            gcTime: 30 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
            // Don't refetch on window focus by default (can be overridden per query)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <TanStackQueryClientProvider client={queryClient}>{children}</TanStackQueryClientProvider>;
}
