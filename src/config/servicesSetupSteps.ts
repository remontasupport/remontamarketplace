/**
 * Services Setup Steps Configuration
 * Dynamically generates steps based on selected services
 */

import Step1ServicesOffer from "@/components/services-setup/steps/Step1ServicesOffer";
import ServiceQualificationStep from "@/components/services-setup/steps/ServiceQualificationStep";
import Step6ABN from "@/components/account-setup/steps/Step6ABN";
import { getQualificationsForService, serviceHasQualifications } from "./serviceQualificationRequirements";

export interface ServicesSetupStep {
  id: number;
  slug: string;
  title: string;
  component: React.ComponentType<any>;
  serviceTitle?: string; // For qualification steps, which service they belong to
}

/**
 * Base step - always shown
 */
const BASE_STEP: ServicesSetupStep = {
  id: 1,
  slug: "services-offer",
  title: "Services you offer",
  component: Step1ServicesOffer,
};

/**
 * Generate dynamic steps based on selected services
 * Each service with qualifications gets its own step
 * ABN is always the final step
 */
export function generateServicesSetupSteps(selectedServices: string[]): ServicesSetupStep[] {
  const steps: ServicesSetupStep[] = [BASE_STEP];

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

  // Add ABN as the final step
  steps.push({
    id: steps.length + 1,
    slug: "abn",
    title: "Your ABN",
    component: Step6ABN,
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
 * Shows the base step and ABN
 */
export const SERVICES_SETUP_STEPS = [
  BASE_STEP,
  {
    id: 2,
    slug: "abn",
    title: "Your ABN",
    component: Step6ABN,
  }
];
