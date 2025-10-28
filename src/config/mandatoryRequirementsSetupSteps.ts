/**
 * Mandatory Requirements Setup Steps Configuration
 * Steps for workers to complete mandatory documentation and verification
 */

import Step1ProofOfIdentity from "@/components/requirements-setup/steps/Step1ProofOfIdentity";

export interface MandatoryRequirementsSetupStep {
  id: number;
  slug: string;
  title: string;
  component: React.ComponentType<any>;
}

/**
 * Mandatory Requirements Setup Steps
 * Step 1: Proof of Identity - Upload ID documents for verification
 */
export const MANDATORY_REQUIREMENTS_SETUP_STEPS: MandatoryRequirementsSetupStep[] = [
  {
    id: 1,
    slug: "proof-of-identity",
    title: "Proof of identity",
    component: Step1ProofOfIdentity,
  },
];

/**
 * Get step URL helper
 */
export const getRequirementsStepUrl = (slug: string) =>
  `/dashboard/worker/requirements/setup?step=${slug}`;
