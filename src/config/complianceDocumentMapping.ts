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
import Step4NDISTraining from "@/components/requirements-setup/steps/Step4NDISTraining";
import Step5InfectionControl from "@/components/requirements-setup/steps/Step5InfectionControl";
import Step0WorkerScreeningCheck from "@/components/requirements-setup/steps/Step0WorkerScreeningCheck";
import StepRightToWork from "@/components/requirements-setup/steps/StepRightToWork";

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
  "abn-contractor": {
    documentId: "abn-contractor",
    component: Step6ABN,
    apiEndpoint: "/api/worker/profile/update-step",
  },

  // ========================================
  // COMPLIANCE & SCREENING DOCUMENTS
  // ========================================

  // NDIS Worker Screening Check - PRESERVES EXISTING UPLOAD LOGIC
  "ndis-screening-check": {
    documentId: "ndis-screening-check",
    component: Step0WorkerScreeningCheck,
    apiEndpoint: "/api/worker/screening-check",
  },

  // National Police Check - PRESERVES EXISTING UPLOAD LOGIC
  "police-check": {
    documentId: "police-check",
    component: Step2PoliceCheck,
    apiEndpoint: "/api/worker/police-check",
  },

  // Working with Children Check - PRESERVES EXISTING UPLOAD LOGIC
  "working-with-children": {
    documentId: "working-with-children",
    component: Step3WorkingWithChildren,
    apiEndpoint: "/api/worker/working-with-children",
  },

  // ========================================
  // TRAINING DOCUMENTS
  // ========================================

  // NDIS Worker Orientation Module - PRESERVES EXISTING UPLOAD LOGIC
  "ndis-worker-orientation": {
    documentId: "ndis-worker-orientation",
    component: Step4NDISTraining,
    apiEndpoint: "/api/worker/ndis-training",
  },

  // Infection Control Training - PRESERVES EXISTING UPLOAD LOGIC
  "infection-control-training": {
    documentId: "infection-control-training",
    component: Step5InfectionControl,
    apiEndpoint: "/api/worker/infection-control",
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
