/**
 * Services Setup Steps Configuration
 * Dynamically generates steps based on selected services
 */

import Step2OtherDocuments from "@/components/services-setup/steps/Step2OtherDocuments";
import ServiceQualificationStep from "@/components/services-setup/steps/ServiceQualificationStep";
import { serviceNameToSlug } from "@/utils/serviceSlugMapping";

export interface ServicesSetupStep {
  id: number;
  slug: string;
  title: string;
  component: React.ComponentType<any>;
  serviceTitle?: string; // For service qualification steps
}

/**
 * Additional Documents step (now removed from services section)
 */
const ADDITIONAL_DOCUMENTS_STEP: ServicesSetupStep = {
  id: 999, // High number to ensure it's last
  slug: "additional-documents",
  title: "Additional Documents",
  component: Step2OtherDocuments,
};

/**
 * Generate dynamic steps based on selected services
 * Each service gets: Qualifications/Skills/Documents (all in one step)
 *
 * Flow: Support Worker → Cleaning Services → ...
 * Note: Skills and documents selection are handled within the qualifications step
 */
export function generateServicesSetupSteps(selectedServices: string[]): ServicesSetupStep[] {
  const steps: ServicesSetupStep[] = [];
  let stepId = 1;

  // For each service, add qualifications/skills/documents step
  selectedServices.forEach((serviceTitle) => {
    const slug = serviceNameToSlug(serviceTitle);

    // Single step: Qualifications, Skills & Documents for this service
    steps.push({
      id: stepId++,
      slug: slug,
      title: serviceTitle,
      component: ServiceQualificationStep,
      serviceTitle: serviceTitle,
    });
  });

  return steps;
}

/**
 * Get step URL helper
 */
export const getServicesStepUrl = (slug: string) =>
  `/dashboard/worker/services/setup?step=${slug}`;

/**
 * Default steps (when no services selected yet)
 * Empty array - user needs to add services first
 */
export const SERVICES_SETUP_STEPS: ServicesSetupStep[] = [];

/**
 * Export Additional Documents step for Section 3
 */
export { ADDITIONAL_DOCUMENTS_STEP };
