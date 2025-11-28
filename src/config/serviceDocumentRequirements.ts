/**
 * Service Document Requirements Configuration
 * Based on Required Documents CSV analysis
 *
 * Maps services/subcategories to their required and optional training/qualification documents
 */

export interface ServiceDocumentRequirement {
  type: string; // e.g., "manual-handling-training"
  name: string; // Display name
  description: string;
  category: "TRAINING" | "QUALIFICATION" | "INSURANCE";
  required: boolean; // true = required, false = optional
}

/**
 * Get document requirements for a specific service/subcategory
 */
export function getServiceDocumentRequirements(
  serviceName: string,
  subcategoryId?: string
): ServiceDocumentRequirement[] {
  // Normalize service name for lookup
  const normalizedService = serviceName.toLowerCase().trim();
  const normalizedSubcategory = subcategoryId?.toLowerCase().trim();

  // Support Worker - only optional docs
  if (normalizedService === "support worker" && !normalizedSubcategory?.includes("high-intensity")) {
    return [
      {
        type: "qualification-certificate",
        name: "Highest Relevant Qualification Certificate",
        description: "Your highest qualification relevant to support work (e.g., Certificate III in Individual Support)",
        category: "QUALIFICATION",
        required: false, // Optional
      },
    ];
  }

  // Support Worker (High Intensity)
  if (normalizedService === "support worker" && normalizedSubcategory?.includes("high-intensity")) {
    return [
      {
        type: "qualification-certificate",
        name: "Highest Relevant Qualification Certificate",
        description: "Your highest qualification relevant to support work",
        category: "QUALIFICATION",
        required: true, // Required for high intensity
      },
      {
        type: "manual-handling-training",
        name: "Manual Handling Training",
        description: "Certificate for manual handling training",
        category: "TRAINING",
        required: false, // Optional
      },
      {
        type: "medication-training",
        name: "Medication Training",
        description: "Certificate for medication administration training",
        category: "TRAINING",
        required: false, // Optional
      },
      {
        type: "behaviour-support-training",
        name: "Behaviour Support Training",
        description: "Certificate for behaviour support training",
        category: "TRAINING",
        required: false, // Optional
      },
    ];
  }

  // Cleaner / Gardener - only optional docs
  if (normalizedService === "cleaning services" || normalizedService === "home and yard maintenance") {
    return [
      {
        type: "qualification-certificate",
        name: "Highest Relevant Qualification Certificate",
        description: "Your highest qualification relevant to this service (if any)",
        category: "QUALIFICATION",
        required: false, // Optional
      },
    ];
  }

  // Nurse - Required qualifications
  if (normalizedService === "nursing services") {
    return [
      {
        type: "ahpra-registration",
        name: "AHPRA Registration",
        description: "Current AHPRA registration certificate",
        category: "QUALIFICATION",
        required: true,
      },
      {
        type: "qualification-certificate",
        name: "Nursing Qualification Certificate",
        description: "Your nursing degree or diploma",
        category: "QUALIFICATION",
        required: true,
      },
    ];
  }

  // Personal Trainer - Required qualifications
  if (normalizedService === "personal trainer") {
    return [
      {
        type: "professional-association-membership",
        name: "Professional Association Membership",
        description: "Fitness Australia or equivalent membership certificate",
        category: "QUALIFICATION",
        required: true,
      },
      {
        type: "qualification-certificate",
        name: "Fitness Qualification Certificate",
        description: "Certificate III/IV in Fitness or equivalent",
        category: "QUALIFICATION",
        required: true,
      },
    ];
  }

  // Therapeutic Supports subcategories
  if (normalizedService === "therapeutic supports" && normalizedSubcategory) {
    return getTherapeuticDocumentRequirements(normalizedSubcategory);
  }

  // Default: no specific documents
  return [];
}

/**
 * Get document requirements for therapeutic support subcategories
 */
function getTherapeuticDocumentRequirements(subcategoryId: string): ServiceDocumentRequirement[] {
  // Services requiring AHPRA
  const ahpraServices = [
    "occupational-therapist",
    "orthoptist",
    "physiotherapist",
    "podiatrist",
    "psychologist",
  ];

  const requiresAHPRA = ahpraServices.includes(subcategoryId);

  const requirements: ServiceDocumentRequirement[] = [];

  // AHPRA Registration (if required)
  if (requiresAHPRA) {
    requirements.push({
      type: "ahpra-registration",
      name: "AHPRA Registration",
      description: "Current AHPRA registration certificate",
      category: "QUALIFICATION",
      required: true,
    });
  } else {
    // Professional Association Membership (for non-AHPRA services)
    requirements.push({
      type: "professional-association-membership",
      name: "Professional Association Membership",
      description: "Relevant professional association membership certificate",
      category: "QUALIFICATION",
      required: true,
    });
  }

  // All therapeutic services require qualification certificate
  requirements.push({
    type: "qualification-certificate",
    name: "Highest Relevant Qualification Certificate",
    description: "Your qualification in this therapeutic field (e.g., degree, diploma)",
    category: "QUALIFICATION",
    required: true,
  });

  return requirements;
}

/**
 * Check if a service has any required qualifications
 */
export function serviceHasRequiredQualifications(serviceName: string, subcategoryId?: string): boolean {
  const requirements = getServiceDocumentRequirements(serviceName, subcategoryId);
  return requirements.some(req => req.required);
}

/**
 * Check if a service has any optional documents
 */
export function serviceHasOptionalDocuments(serviceName: string, subcategoryId?: string): boolean {
  const requirements = getServiceDocumentRequirements(serviceName, subcategoryId);
  return requirements.some(req => !req.required);
}
