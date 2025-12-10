/**
 * Dynamic Compliance Steps Generator
 *
 * Generates compliance steps dynamically from API requirements data
 * Maps requirements to components and creates step configuration
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

export interface DynamicComplianceStep {
  id: number;
  slug: string;
  title: string;
  component: React.ComponentType<any>;
  documentId: string;
  requirement: RequirementDocument;
  apiEndpoint?: string;
}

/**
 * Generate compliance steps from base compliance requirements
 *
 * @param requirements - Worker requirements data from API
 * @returns Array of dynamic compliance steps
 */
export function generateComplianceSteps(
  requirements: WorkerRequirements | undefined
): DynamicComplianceStep[] {
  if (!requirements?.requirements?.baseCompliance) {
    return [];
  }

  const { baseCompliance } = requirements.requirements;

  // Generate steps from base compliance requirements
  const steps: DynamicComplianceStep[] = baseCompliance.map((req, index) => {
    // Check if there's a custom component for this document
    const customMapping = getComponentForDocument(req.id);

  
    if (customMapping) {
    
    } else {
     
    }

    // Use custom component if available, otherwise use generic component
    const component = customMapping?.component || GenericComplianceDocument;
    const apiEndpoint = customMapping?.apiEndpoint || "/api/worker/compliance-documents";

    // Generate slug from document ID (lowercase, replace spaces with hyphens)
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
 * Get step URL helper for dynamic compliance steps
 *
 * @param slug - The step slug
 * @returns The URL for the step
 */
export const getComplianceStepUrl = (slug: string) =>
  `/dashboard/worker/requirements/setup?step=${slug}`;

/**
 * Find step by slug in dynamic steps array
 *
 * @param steps - Array of dynamic compliance steps
 * @param slug - The slug to search for
 * @returns The step if found, undefined otherwise
 */
export function findStepBySlug(
  steps: DynamicComplianceStep[],
  slug: string
): DynamicComplianceStep | undefined {
  return steps.find((step) => step.slug === slug);
}

/**
 * Get step index by slug
 *
 * @param steps - Array of dynamic compliance steps
 * @param slug - The slug to search for
 * @returns The zero-based index, or -1 if not found
 */
export function getStepIndex(
  steps: DynamicComplianceStep[],
  slug: string
): number {
  return steps.findIndex((step) => step.slug === slug);
}
