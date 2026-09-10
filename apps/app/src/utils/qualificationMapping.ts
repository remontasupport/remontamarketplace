/**
 * Qualification Type to Name Mapping
 * Maps qualification slugs (cert3-aged-care) to display names (Certificate 3 Aged Care)
 * Used as fallback when requirementName is not properly stored
 */

export const QUALIFICATION_TYPE_TO_NAME: Record<string, string> = {
  // Support Worker Qualifications
  "cert3-aged-care": "Certificate 3 Aged Care",
  "cert3-disabilities": "Certificate 3 in Disabilities",
  "cert3-individual-support": "Certificate 3 Individual Support",
  "cert3-individual-support-aged-care": "Certificate 3 Individual Support (Aged Care)",
  "cert3-individual-support-disability": "Certificate 3 Individual Support (Disability)",
  "cert3-home-community-care": "Certificate 3 in Home and Community Care",
  "cert4-aged-care": "Certificate 4 Aged Care",
  "cert4-disabilities": "Certificate 4 in Disabilities",
};

/**
 * Get display name for a qualification type
 * @param type - Qualification type (e.g., "cert3-aged-care")
 * @param storedName - Name stored in database (might be incorrect)
 * @returns Proper display name
 */
export function getQualificationDisplayName(type: string, storedName?: string | null): string {
  // If stored name exists and doesn't look like a type slug, use it
  if (storedName && !storedName.includes('-')) {
    return storedName;
  }

  // Otherwise, use mapping
  return QUALIFICATION_TYPE_TO_NAME[type] || type;
}
