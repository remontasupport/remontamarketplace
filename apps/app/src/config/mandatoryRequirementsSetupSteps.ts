/**
 * Mandatory Requirements Setup Steps Configuration
 * Steps for workers to complete mandatory documentation and verification
 */

import Step0WorkerScreeningCheck from "@/components/requirements-setup/steps/Step0WorkerScreeningCheck";
import Step2PoliceCheck from "@/components/requirements-setup/steps/Step2PoliceCheck";
import Step3WorkingWithChildren from "@/components/requirements-setup/steps/Step3WorkingWithChildren";
import Step4aNDISOrientation from "@/components/requirements-setup/steps/Step4aNDISOrientation";
import Step4NDISTraining from "@/components/requirements-setup/steps/Step4NDISTraining";
import Step5InfectionControl from "@/components/requirements-setup/steps/Step5InfectionControl";
import Step6OtherRequirements from "@/components/requirements-setup/steps/Step6OtherRequirements";

export interface MandatoryRequirementsSetupStep {
  id: number;
  slug: string;
  title: string;
  component: React.ComponentType<any>;
}

/**
 * Mandatory Requirements Setup Steps
 */
export const MANDATORY_REQUIREMENTS_SETUP_STEPS: MandatoryRequirementsSetupStep[] = [
  {
    id: 1,
    slug: "worker-screening-check",
    title: "Worker screening check",
    component: Step0WorkerScreeningCheck,
  },
  {
    id: 2,
    slug: "police-check",
    title: "Police check",
    component: Step2PoliceCheck,
  },
  {
    id: 3,
    slug: "working-with-children",
    title: "Working with children",
    component: Step3WorkingWithChildren,
  },
  {
    id: 4,
    slug: "ndis-orientation",
    title: "NDIS Worker Orientation",
    component: Step4aNDISOrientation,
  },
  {
    id: 5,
    slug: "ndis-training",
    title: "NDIS Training Upload",
    component: Step4NDISTraining,
  },
  {
    id: 6,
    slug: "infection-control",
    title: "Infection control",
    component: Step5InfectionControl,
  },
  {
    id: 7,
    slug: "other-requirements",
    title: "Other requirements",
    component: Step6OtherRequirements,
  },
];

/**
 * Get step URL helper
 */
export const getRequirementsStepUrl = (slug: string) =>
  `/dashboard/worker/requirements/setup?step=${slug}`;
