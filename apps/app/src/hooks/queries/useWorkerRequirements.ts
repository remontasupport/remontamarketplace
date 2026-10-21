/**
 * Worker requirements (api-review U5b): the Compliance and Trainings steps of the worker's services, selected from the
 * api's profile read (`requirements.mandatory` / `requirements.trainings`, already ordered and folded as the sidebar
 * shows them) in the shape the step generators read. Was GET /api/worker/requirements.
 *
 * With no services chosen the api lists nothing ("choose your services first", R4.1); the old route listed every
 * category's documents.
 */

"use client";

import type { Profile } from "@remonta/api-contract";
import { useProfileSelect } from "./useComplianceDocuments";

export interface RequirementDocument {
  id: string;
  name: string;
  category: string;
  description: string | null;
  hasExpiration: boolean;
  documentType: 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL';
  serviceCategory: string;
  subcategory?: string;
  conditionKey?: string | null;
  requiredIfTrue?: boolean | null;
}

export interface WorkerRequirements {
  success: boolean;
  services: string[];
  requirements: {
    baseCompliance: RequirementDocument[];
    trainings: RequirementDocument[];
  };
}

type Item = Profile["requirements"]["mandatory"][number];

const docOf = (category: string) => (r: Item): RequirementDocument => ({
  id: r.id,
  name: r.name,
  category,
  description: r.description || null,
  hasExpiration: r.hasExpiration,
  documentType: r.documentType,
  serviceCategory: "",
});

export function requirementsOf(profile: Profile): WorkerRequirements {
  return {
    success: true,
    services: profile.services.map((s) => s.categoryName),
    requirements: {
      baseCompliance: profile.requirements.mandatory.map(docOf("COMPLIANCE")),
      trainings: profile.requirements.trainings.map(docOf("TRAINING")),
    },
  };
}

/** The steps of the worker's own services, from the profile read. */
export function useWorkerRequirements() {
  return useProfileSelect(requirementsOf);
}
