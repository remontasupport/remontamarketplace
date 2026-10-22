"use client";

// The "Your tools" screen of a service's step (worker-tools U2; UR-1..UR-3, UR-6). Presentational: the setup page
// loads and saves. The field is the shared MultiSelectField, used unchanged as Languages uses it (user, 2026-10-22);
// every value it reports passes acceptChange, and a refusal shows as its error.
import { useState } from "react";
import type { ToolService } from "@remonta/schemas/data/serviceTools";
import { MultiSelectField } from "@/components/ui/form-wizard/sectionFields";
import Loader from "@/components/ui/Loader";
import { acceptChange, TOOLS_LOAD_FAILED, toolLabelsOf } from "@/features/worker/serviceTools";

export type ToolsState = "loading" | "ready" | "failed";

interface ServiceToolsStepProps {
  service: ToolService;
  state: ToolsState;
  value: string[];
  onChange: (value: string[]) => void;
  onRetry: () => void;
  /** The save's message (the api's field message, or the fallback), shown under the field. */
  error?: string;
}

export default function ServiceToolsStep({ service, state, value, onChange, onRetry, error }: ServiceToolsStepProps) {
  const [refused, setRefused] = useState<string | undefined>();

  if (state === "loading") {
    return (
      <div className="flex justify-center py-8">
        <Loader size="md" />
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-poppins text-amber-900">
        {TOOLS_LOAD_FAILED}{" "}
        <button type="button" onClick={onRetry} className="font-medium underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <MultiSelectField
      label="Your tools"
      hint="Tick the tools you have and can bring to a job. Add any that aren't listed (up to 5)."
      options={toolLabelsOf(service)}
      value={value}
      allowOwn
      onChange={(next) => {
        const r = acceptChange(service, value, next);
        setRefused(r.refused);
        if (!r.refused) onChange(r.value);
      }}
      error={refused ?? error}
    />
  );
}
