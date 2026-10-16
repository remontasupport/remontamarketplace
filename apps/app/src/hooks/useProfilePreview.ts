"use client";

// The signed-in worker's profile preview (U5c): a select on the api's profile read (one cache entry with the rest of
// the profile) in the shape the preview components read. Was the getProfilePreviewData server action.
// A save anywhere fires 'remonta:profile-updated'; the profile is read again, fresh.
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileSelect } from "@/hooks/queries/useComplianceDocuments";
import { reloadProfileInto } from "@/features/worker/profile";
import { previewOf } from "@/features/worker/preview";

export function useProfilePreview() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = () => void reloadProfileInto(queryClient);
    window.addEventListener("remonta:profile-updated", handler);
    return () => window.removeEventListener("remonta:profile-updated", handler);
  }, [queryClient]);

  return useProfileSelect(previewOf);
}
