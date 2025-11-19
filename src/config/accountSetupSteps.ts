/**
 * Account Setup Steps Configuration
 * Single source of truth for all account setup steps
 * Used by both the setup page and sidebar navigation
 */

import Step1Name from "@/components/account-setup/steps/Step1Name";
import Step2Photo from "@/components/account-setup/steps/Step2Photo";
import Step3Bio from "@/components/account-setup/steps/Step3Bio";
import Step4PersonalInfo from "@/components/account-setup/steps/Step4PersonalInfo";
import Step5Address from "@/components/account-setup/steps/Step5Address";
import Step7EmergencyContact from "@/components/account-setup/steps/Step7EmergencyContact";
import Step1ProofOfIdentity from "@/components/requirements-setup/steps/Step1ProofOfIdentity";

export interface AccountSetupStep {
  id: number;
  slug: string;
  title: string;
  component: React.ComponentType<any>;
}

export const ACCOUNT_SETUP_STEPS: AccountSetupStep[] = [
  { id: 1, slug: "name", title: "Your name", component: Step1Name },
  { id: 2, slug: "photo", title: "Profile photo", component: Step2Photo },
  { id: 3, slug: "bio", title: "Your bio", component: Step3Bio },
  { id: 4, slug: "address", title: "Address", component: Step5Address },
  { id: 5, slug: "proof-of-identity", title: "Proof of identity", component: Step1ProofOfIdentity },
  { id: 6, slug: "personal-info", title: "Other personal info", component: Step4PersonalInfo },
  { id: 7, slug: "emergency-contact", title: "Emergency contact", component: Step7EmergencyContact },
];

// Helper to get step URL
export const getStepUrl = (slug: string) => `/dashboard/worker/account/setup?step=${slug}`;
