/**
 * Service Offerings Configuration
 * Defines services/offerings that workers can provide for each service type
 * This replaces the previous "skills" concept with actual service offerings
 */

export interface ServiceOffering {
  id: string;
  label: string;
  description: string;
}

/**
 * Personal Care Services for Support Worker & Support Worker (High Intensity)
 */
export const PERSONAL_CARE_SERVICES: ServiceOffering[] = [
  {
    id: "assistance-with-eating",
    label: "Assistance with eating",
    description: "Help with meal preparation, feeding assistance, and ensuring proper nutrition and hydration during mealtimes."
  },
  {
    id: "assist-with-medication",
    label: "Assist with medication",
    description: "Medication reminders, assistance with medication administration as per care plan, and documentation of medication taken."
  },
  {
    id: "exercise-assistance",
    label: "Exercise assistance",
    description: "Support with physical exercises, stretching routines, physiotherapy exercises, and maintaining mobility as prescribed."
  },
  {
    id: "hoist-and-transfer",
    label: "Hoist and transfer",
    description: "Safe use of mechanical hoists and transfer equipment to assist with moving between bed, chair, wheelchair, or other locations."
  },
  {
    id: "light-massage",
    label: "Light massage",
    description: "Gentle massage therapy for relaxation, circulation improvement, and comfort care as part of daily support."
  },
  {
    id: "manual-transfer-and-mobility",
    label: "Manual transfer and mobility",
    description: "Physical assistance with transfers and mobility without equipment, including walking support and balance assistance."
  },
  {
    id: "showering-dressing-grooming",
    label: "Showering, dressing & grooming",
    description: "Complete personal hygiene support including showering, bathing, dressing, grooming, and maintaining personal appearance."
  },
  {
    id: "toileting",
    label: "Toileting",
    description: "Assistance with toileting needs, continence care, and maintaining dignity and hygiene throughout the process."
  }
];

/**
 * Get service offerings for a specific service type
 * @param serviceTitle - The service title (e.g., "Support Worker")
 * @returns Array of service offerings for that service
 */
export function getServiceOfferings(serviceTitle: string): ServiceOffering[] {
  // Normalize service title for comparison
  const normalizedTitle = serviceTitle.toLowerCase().trim();

  // Support Worker and Support Worker (High Intensity) get Personal Care services
  if (
    normalizedTitle === "support worker" ||
    normalizedTitle === "support worker (high intensity)"
  ) {
    return PERSONAL_CARE_SERVICES;
  }

  // Default: no services configured yet
  return [];
}

/**
 * Check if a service has offerings configured
 * @param serviceTitle - The service title
 * @returns true if the service has offerings configured
 */
export function serviceHasOfferings(serviceTitle: string): boolean {
  return getServiceOfferings(serviceTitle).length > 0;
}
