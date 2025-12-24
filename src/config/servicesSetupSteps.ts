/**
 * Services Setup Steps Configuration
 * Dynamically generates steps based on selected services
 */

import Step1ServicesOffer from "@/components/services-setup/steps/Step1ServicesOffer";
import Step2OtherDocuments from "@/components/services-setup/steps/Step2OtherDocuments";
import ServiceQualificationStep from "@/components/services-setup/steps/ServiceQualificationStep";
import { getQualificationsForService, serviceHasQualifications } from "./serviceQualificationRequirements";

export interface ServicesSetupStep {
  id: number;
  slug: string;
  title: string;
  component: React.ComponentType<any>;
  serviceTitle?: string; // For qualification steps, which service they belong to
}

/**
 * Base steps - always shown
 */
const BASE_STEP: ServicesSetupStep = {
  id: 1,
  slug: "services-offer",
  title: "Qualifications",
  component: Step1ServicesOffer,
};

const OTHER_DOCUMENTS_STEP: ServicesSetupStep = {
  id: 2,
  slug: "other-documents",
  title: "Other Documents",
  component: Step2OtherDocuments,
};

/**
 * Generate dynamic steps based on selected services
 * Each service with qualifications gets its own step
 * NOTE: ABN has been moved to Compliance section
 */
export function generateServicesSetupSteps(selectedServices: string[]): ServicesSetupStep[] {
  const steps: ServicesSetupStep[] = [BASE_STEP, OTHER_DOCUMENTS_STEP];

  // For each selected service, add a qualification step if needed
  selectedServices.forEach((serviceTitle, index) => {
    if (serviceHasQualifications(serviceTitle)) {
      const slug = `qualifications-${serviceTitle.toLowerCase().replace(/\s+/g, "-")}`;

      steps.push({
        id: steps.length + 1,
        slug: slug,
        title: `Qualifications for ${serviceTitle}`,
        component: ServiceQualificationStep,
        serviceTitle: serviceTitle, // Pass service title to component
      });
    }
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
 * Shows base steps: Your Services and Other Documents
 */
export const SERVICES_SETUP_STEPS = [BASE_STEP, OTHER_DOCUMENTS_STEP];
