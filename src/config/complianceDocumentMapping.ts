/**
 * Compliance Document to Component Mapping
 *
 * Maps document IDs from the API to their corresponding UI components
 * Reuses existing components to PRESERVE ALL UPLOAD LOGIC and functionality
 *
 * Each component maintains its own:
 * - Upload logic and API endpoints
 * - Validation and error handling
 * - File preview and management
 * - Document expiry date handling (where applicable)
 */

// Requirements-setup components (existing compliance documents)
import Step1ProofOfIdentity from "@/components/requirements-setup/steps/Step1ProofOfIdentity";
import Step2PoliceCheck from "@/components/requirements-setup/steps/Step2PoliceCheck";
import Step3WorkingWithChildren from "@/components/requirements-setup/steps/Step3WorkingWithChildren";
import Step4NDISTrainingsMultiple from "@/components/requirements-setup/steps/Step4NDISTrainingsMultiple";
import Step5InfectionControl from "@/components/requirements-setup/steps/Step5InfectionControl";
import Step0WorkerScreeningCheck from "@/components/requirements-setup/steps/Step0WorkerScreeningCheck";
import StepRightToWork from "@/components/requirements-setup/steps/StepRightToWork";
import StepCodeOfConductPart1 from "@/components/requirements-setup/steps/StepCodeOfConductPart1";
import StepCodeOfConductPart2 from "@/components/requirements-setup/steps/StepCodeOfConductPart2";

// Account-setup components (reused for compliance)
import Step6ABN from "@/components/account-setup/steps/Step6ABN";

export interface ComplianceStepMapping {
  documentId: string;
  component: React.ComponentType<any>;
  // Optional: specify which API endpoint to use for fetching/uploading
  apiEndpoint?: string;
  // Optional: custom document type for upload API
  uploadDocumentType?: string;
}

/**
 * Document ID to Component Mapping
 *
 * Maps document IDs from the database to their UI components
 */
export const COMPLIANCE_DOCUMENT_MAPPING: Record<string, ComplianceStepMapping> = {
  // ========================================
  // IDENTITY & BUSINESS DOCUMENTS
  // ========================================

  // Identity Documents (100-point check) - PRESERVES EXISTING UPLOAD LOGIC
  "identity-points-100": {
    documentId: "identity-points-100",
    component: Step1ProofOfIdentity,
    apiEndpoint: "/api/worker/identity-documents",
  },

  // Australian Business Number (text field, numbers only)
  // Uses server action: updateWorkerABN from @/services/worker/compliance.service.ts
  "abn-contractor": {
    documentId: "abn-contractor",
    component: Step6ABN,
    // Server action is called automatically via useUpdateProfileStep hook
  },

  // ========================================
  // COMPLIANCE & SCREENING DOCUMENTS
  // ========================================

  // NDIS Worker Screening Check - REFACTORED: Now uses generic endpoint
  "ndis-screening-check": {
    documentId: "ndis-screening-check",
    component: Step0WorkerScreeningCheck,
  },

  // National Police Check - REFACTORED: Now uses generic endpoint
  "police-check": {
    documentId: "police-check",
    component: Step2PoliceCheck,
  },

  // Working with Children Check - REFACTORED: Now uses generic endpoint
  "working-with-children": {
    documentId: "working-with-children",
    component: Step3WorkingWithChildren,
  },

  // ========================================
  // TRAINING DOCUMENTS
  // ========================================

  // NDIS Training Modules - COMBINED PAGE for all 4 modules
  // This single page handles:
  // - ndis-worker-orientation (NDIS Worker Orientation Module)
  // - ndis-induction-module (New Worker NDIS Induction Module)
  // - effective-communication (Supporting Effective Communication)
  // - safe-enjoyable-meals (Supporting Safe and Enjoyable Meals)
  // NOTE: Only this ID is mapped so only ONE step appears in the sidebar
  // REFACTORED: Now uses generic endpoint internally
  "ndis-worker-orientation": {
    documentId: "ndis-worker-orientation",
    component: Step4NDISTrainingsMultiple,
  },

  // NOTE: The following IDs are NOT mapped so they don't appear as separate steps:
  // - "ndis-induction-module"
  // - "effective-communication"
  // - "safe-enjoyable-meals"
  // They are handled within the Step4NDISTrainingsMultiple component above

  // Infection Control Training - REFACTORED: Now uses generic endpoint
  "infection-control-training": {
    documentId: "infection-control-training",
    component: Step5InfectionControl,
  },

  // ========================================
  // WORKING RIGHTS DOCUMENTS
  // ========================================

  // Right to Work Documents - Citizenship verification with conditional upload
  "right-to-work": {
    documentId: "right-to-work",
    component: StepRightToWork,
    apiEndpoint: "/api/worker/compliance-documents",
  },

  // ========================================
  // CODE OF CONDUCT
  // ========================================

  // Code of Conduct Part 1 - Sections 1-6 (read-only, no upload required)
  "code-of-conduct-part1": {
    documentId: "code-of-conduct-part1",
    component: StepCodeOfConductPart1,
    // No upload needed for Part 1 - just reading
  },

  // Code of Conduct Part 2 - Sections 7-12 + Signature
  "code-of-conduct-part2": {
    documentId: "code-of-conduct-part2",
    component: StepCodeOfConductPart2,
    apiEndpoint: "/api/worker/compliance-documents",
    uploadDocumentType: "code-of-conduct",
  },
};

/**
 * Get component for a document ID
 *
 * @param documentId - The document ID from the API
 * @returns The component mapping or undefined if not found
 */
export function getComponentForDocument(
  documentId: string
): ComplianceStepMapping | undefined {
  return COMPLIANCE_DOCUMENT_MAPPING[documentId];
}

/**
 * Check if a document has a custom component
 *
 * @param documentId - The document ID to check
 * @returns True if the document has a custom component
 */
export function hasCustomComponent(documentId: string): boolean {
  return documentId in COMPLIANCE_DOCUMENT_MAPPING;
}
