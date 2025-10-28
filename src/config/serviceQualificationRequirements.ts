/**
 * Service Qualification Requirements Configuration
 * Maps each service to its required qualifications/certifications
 *
 * Each qualification will create a VerificationRequirement record when selected
 */

export interface ServiceQualification {
  type: string;           // Unique identifier (e.g., "cert3-aged-care")
  name: string;           // Display name (e.g., "Certificate 3 Aged Care")
  description?: string;   // Optional description
  expiryYears?: number;   // Optional: If certificate expires
}

export const SERVICE_QUALIFICATION_REQUIREMENTS: Record<string, ServiceQualification[]> = {
  /**
   * Support Worker Qualifications
   * Based on Mable's qualification requirements for personal care
   * (Excluding "2+ years experience" as requested)
   */
  "Support Worker": [
    {
      type: "cert3-aged-care",
      name: "Certificate 3 Aged Care",
      description: "Aged care qualification",
    },
    {
      type: "cert3-disabilities",
      name: "Certificate 3 in Disabilities",
      description: "Disabilities support qualification",
    },
    {
      type: "cert3-individual-support",
      name: "Certificate 3 Individual Support",
      description: "Individual support qualification",
    },
    {
      type: "cert3-individual-support-aged-care",
      name: "Certificate 3 Individual Support (Aged Care)",
      description: "Individual support specializing in aged care",
    },
    {
      type: "cert3-individual-support-disability",
      name: "Certificate 3 Individual Support (Disability)",
      description: "Individual support specializing in disability",
    },
    {
      type: "cert3-home-community-care",
      name: "Certificate 3 in Home and Community Care",
      description: "Home and community care qualification",
    },
    {
      type: "cert4-aged-care",
      name: "Certificate 4 Aged Care",
      description: "Advanced aged care qualification",
    },
    {
      type: "cert4-disabilities",
      name: "Certificate 4 in Disabilities",
      description: "Advanced disabilities support qualification",
    },
  ],

  /**
   * Therapeutic Supports Qualifications
   * TODO: Add when requirements are provided
   */
  "Therapeutic Supports": [],

  /**
   * Home Modifications Qualifications
   * TODO: Add when requirements are provided
   */
  "Home Modifications": [],

  /**
   * Fitness and Rehabilitation Qualifications
   * TODO: Add when requirements are provided
   */
  "Fitness and Rehabilitation": [],

  /**
   * Cleaning Services Qualifications
   * TODO: Add when requirements are provided
   */
  "Cleaning Services": [],

  /**
   * Nursing Services Qualifications
   * TODO: Add when requirements are provided
   */
  "Nursing Services": [],

  /**
   * Home and Yard Maintenance Qualifications
   * TODO: Add when requirements are provided
   */
  "Home and Yard Maintenance": [],
};

/**
 * Get qualifications for a specific service
 */
export function getQualificationsForService(serviceTitle: string): ServiceQualification[] {
  return SERVICE_QUALIFICATION_REQUIREMENTS[serviceTitle] || [];
}

/**
 * Get all qualifications for multiple services
 */
export function getQualificationsForServices(servicesTitles: string[]): ServiceQualification[] {
  const allQualifications: ServiceQualification[] = [];
  const seenTypes = new Set<string>();

  servicesTitles.forEach((serviceTitle) => {
    const qualifications = getQualificationsForService(serviceTitle);
    qualifications.forEach((qual) => {
      // Avoid duplicates if same qualification is required by multiple services
      if (!seenTypes.has(qual.type)) {
        allQualifications.push(qual);
        seenTypes.add(qual.type);
      }
    });
  });

  return allQualifications;
}

/**
 * Check if a service has qualifications configured
 */
export function serviceHasQualifications(serviceTitle: string): boolean {
  const qualifications = getQualificationsForService(serviceTitle);
  return qualifications.length > 0;
}
