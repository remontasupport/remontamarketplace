/**
 * Service Document Requirements Configuration
 * Based on Required Documents CSV analysis
 *
 * Maps services/subcategories to their required and optional training/qualification documents
 */

export interface ServiceDocumentRequirement {
  type: string; // e.g., "manual-handling-training", "ahpra-registration", etc.
  name: string; // Display name
  description: string;
  category: "TRAINING" | "QUALIFICATION" | "INSURANCE" | "REGISTRATION";
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
  if (normalizedService === "support worker") {
    return [
      {
        type: "qualification-certificate",
        name: "Highest Relevant Qualification Certificate",
        description: "Your highest qualification relevant to support work (e.g., Certificate III in Individual Support)",
        category: "QUALIFICATION",
        required: false, // Optional
      },
      {
        type: "other-training",
        name: "Other Training",
        description: "Any other relevant training certificates (e.g., First Aid, CPR, specialized care training)",
        category: "TRAINING",
        required: false, // Optional
      },
    ];
  }

  // Support Worker (High Intensity)
  if (normalizedService === "support worker (high intensity)") {
    return [
      {
        type: "qualification-certificate",
        name: "Highest Relevant Qualification Certificate",
        description: "Your highest qualification relevant to support work (e.g., Certificate III in Individual Support)",
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
      {
        type: "other-training",
        name: "Other Training",
        description: "Any other relevant training certificates (e.g., First Aid, CPR, specialized care training)",
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
        category: "REGISTRATION",
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
        category: "REGISTRATION",
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

  // Therapeutic Supports - Show base requirements (even without subcategory selected)
  if (normalizedService === "therapeutic supports") {
    if (normalizedSubcategory) {
      // If specific subcategory is selected, show its specific requirements
      return getTherapeuticDocumentRequirements(normalizedSubcategory);
    } else {
      // Show general therapeutic supports requirements
      return [
        {
          type: "professional-association-membership",
          name: "Professional Association Membership",
          description: "Relevant professional association membership (or AHPRA for regulated professions)",
          category: "REGISTRATION",
          required: true,
        },
        {
          type: "qualification-certificate",
          name: "Highest Relevant Qualification Certificate",
          description: "Your qualification in your therapeutic field (e.g., degree, diploma in OT, Physio, Psychology, etc.)",
          category: "QUALIFICATION",
          required: true,
        },
        {
          type: "professional-indemnity-insurance",
          name: "Professional Indemnity Insurance",
          description: "Current professional indemnity insurance certificate",
          category: "INSURANCE",
          required: true,
        },
      ];
    }
  }

  // Home Modifications - Requires qualifications
  if (normalizedService === "home modifications") {
    return [
      {
        type: "qualification-certificate",
        name: "Relevant Trade Qualification Certificate",
        description: "Your trade qualification (e.g., Building, Carpentry, Occupational Therapy for assessments)",
        category: "QUALIFICATION",
        required: true,
      },
      {
        type: "trade-licence",
        name: "Trade Licence / Certification",
        description: "Current trade licence or builder's licence",
        category: "QUALIFICATION",
        required: true,
      },
      {
        type: "public-liability-insurance",
        name: "Public Liability Insurance",
        description: "Public liability insurance with minimum $10M coverage",
        category: "INSURANCE",
        required: true,
      },
    ];
  }

  // Fitness and Rehabilitation - Requires qualifications
  if (normalizedService === "fitness and rehabilitation") {
    return [
      {
        type: "professional-association-membership",
        name: "Professional Association Membership",
        description: "Fitness Australia, Exercise & Sports Science Australia (ESSA), or equivalent membership",
        category: "REGISTRATION",
        required: true,
      },
      {
        type: "qualification-certificate",
        name: "Fitness/Exercise Science Qualification",
        description: "Certificate III/IV in Fitness, Exercise Science degree, or Exercise Physiology qualification",
        category: "QUALIFICATION",
        required: true,
      },
      {
        type: "first-aid-cpr",
        name: "First Aid & CPR Certificate",
        description: "Current First Aid and CPR certification",
        category: "TRAINING",
        required: true,
      },
      {
        type: "public-liability-insurance",
        name: "Public Liability Insurance",
        description: "Public liability insurance with minimum $10M coverage",
        category: "INSURANCE",
        required: false, // Optional
      },
    ];
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
      category: "REGISTRATION",
      required: true,
    });
  } else {
    // Professional Association Membership (for non-AHPRA services)
    requirements.push({
      type: "professional-association-membership",
      name: "Professional Association Membership",
      description: "Relevant professional association membership certificate",
      category: "REGISTRATION",
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
