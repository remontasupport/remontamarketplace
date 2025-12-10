/**
 * Dynamic Training Steps Generator
 *
 * Generates training steps dynamically from API requirements data
 * Maps training requirements to components and creates step configuration
 */

import {
  WorkerRequirements,
  RequirementDocument,
} from "@/hooks/queries/useWorkerRequirements";
import {
  getComponentForDocument,
  hasCustomComponent,
} from "@/config/complianceDocumentMapping";
import GenericComplianceDocument from "@/components/requirements-setup/steps/GenericComplianceDocument";

export interface DynamicTrainingStep {
  id: number;
  slug: string;
  title: string;
  component: React.ComponentType<any>;
  documentId: string;
  requirement: RequirementDocument;
  apiEndpoint?: string;
}

/**
 * Generate training steps from trainings array in requirements
 *
 * @param requirements - Worker requirements data from API
 * @returns Array of dynamic training steps
 */
export function generateTrainingSteps(
  requirements: WorkerRequirements | undefined
): DynamicTrainingStep[] {
  if (!requirements?.requirements?.trainings) {
    return [];
  }

  const { trainings } = requirements.requirements;

  // Generate steps from trainings
  const steps: DynamicTrainingStep[] = trainings.map((req, index) => {
    // Check if there's a custom component for this training
    const customMapping = getComponentForDocument(req.id);

   
    if (customMapping) {
     
    } else {
    
    }

    // Use custom component if available, otherwise use generic component
    const component = customMapping?.component || GenericComplianceDocument;
    const apiEndpoint = customMapping?.apiEndpoint || "/api/worker/compliance-documents";

    // Generate slug from document ID
    const slug = req.id;

    return {
      id: index + 1,
      slug,
      title: req.name,
      component,
      documentId: req.id,
      requirement: req,
      apiEndpoint,
    };
  });

  return steps;
}

/**
 * Get step URL helper for dynamic training steps
 *
 * @param slug - The step slug
 * @returns The URL for the step
 */
export const getTrainingStepUrl = (slug: string) =>
  `/dashboard/worker/trainings/setup?step=${slug}`;

/**
 * Find step by slug in dynamic steps array
 *
 * @param steps - Array of dynamic training steps
 * @param slug - The slug to search for
 * @returns The step if found, undefined otherwise
 */
export function findStepBySlug(
  steps: DynamicTrainingStep[],
  slug: string
): DynamicTrainingStep | undefined {
  return steps.find((step) => step.slug === slug);
}

/**
 * Get step index by slug
 *
 * @param steps - Array of dynamic training steps
 * @param slug - The slug to search for
 * @returns The zero-based index, or -1 if not found
 */
export function getStepIndex(
  steps: DynamicTrainingStep[],
  slug: string
): number {
  return steps.findIndex((step) => step.slug === slug);
}
