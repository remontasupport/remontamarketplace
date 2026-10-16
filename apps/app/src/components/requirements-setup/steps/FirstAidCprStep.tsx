/**
 * First Aid & CPR (user, 2026-10-16): one training step with an upload for each document. They stay two documents
 * ("first-aid-cpr" or "first-aid", and "cpr"), each stored, reviewed and expiring on its own.
 */

"use client";

import { RequirementDocument } from "@/hooks/queries/useWorkerRequirements";
import GenericComplianceDocument from "./GenericComplianceDocument";

interface FirstAidCprStepProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  apiEndpoint?: string;
  parts?: RequirementDocument[];
}

export default function FirstAidCprStep({ parts = [], ...props }: FirstAidCprStepProps) {
  return (
    <div className="combined-step space-y-8">
      {parts.map((part) => (
        <GenericComplianceDocument key={part.id} {...props} requirement={part} heading={part.id === "cpr" ? "CPR" : "First Aid"} />
      ))}
    </div>
  );
}
