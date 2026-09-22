/**
 * Service Slug Mapping Utility
 *
 * Provides consistent conversion between service names and URL slugs
 * across the entire application.
 *
 * IMPORTANT: Keep this mapping in sync with:
 * - categories.json (database source of truth)
 * - src/constants/index.ts (SERVICE_OPTIONS)
 */

/**
 * Map of URL slugs to actual service names from the database
 *
 * Database Services (from categories.json):
 * - Support Worker
 * - Support Worker (High Intensity)
 * - Therapeutic Supports
 * - Cleaning Services
 * - Home and Yard Maintenance
 * - Nursing Services
 * - Personal Trainer
 *
 * Note: "Home Modifications" and "Fitness and Rehabilitation" are in SERVICE_OPTIONS
 * but NOT in the database yet. They will show "No documents required" until added to DB.
 */
export const SLUG_TO_SERVICE_NAME: Record<string, string> = {
  // Database services (these WILL work)
  "support-worker": "Support Worker",
  "support-worker-high-intensity": "Support Worker (High Intensity)", // Note: parentheses removed from slug
  "therapeutic-supports": "Therapeutic Supports",
  "cleaning-services": "Cleaning Services",
  "home-yard-maintenance": "Home and Yard Maintenance", // Note: "and" is removed from slug
  "nursing-services": "Nursing Services",
  "personal-trainer": "Personal Trainer",

  // Services in UI but not yet in database (these won't have documents until added)
  "home-modifications": "Home Modifications",
  "fitness-and-rehabilitation": "Fitness and Rehabilitation",
};

/**
 * Reverse mapping: service name to slug
 */
export const SERVICE_NAME_TO_SLUG: Record<string, string> = Object.entries(
  SLUG_TO_SERVICE_NAME
).reduce((acc, [slug, name]) => {
  acc[name] = slug;
  return acc;
}, {} as Record<string, string>);

/**
 * Convert a service name to a URL-safe slug
 * @param serviceName - The service name (e.g., "Support Worker")
 * @returns The URL slug (e.g., "support-worker")
 */
export function serviceNameToSlug(serviceName: string): string {
  // First try exact match in our mapping
  if (SERVICE_NAME_TO_SLUG[serviceName]) {
    return SERVICE_NAME_TO_SLUG[serviceName];
  }

  // Fallback: convert to lowercase and replace spaces with hyphens
  return serviceName.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Convert a URL slug to the proper service name
 * @param slug - The URL slug (e.g., "support-worker")
 * @returns The service name (e.g., "Support Worker")
 */
export function slugToServiceName(slug: string): string {
  // First try exact match in our mapping
  if (SLUG_TO_SERVICE_NAME[slug]) {
    return SLUG_TO_SERVICE_NAME[slug];
  }

  // Fallback: capitalize each word
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Check if a service exists in the database
 * @param serviceName - The service name
 * @returns true if the service exists in our mapping (and likely in the database)
 */
export function isServiceInDatabase(serviceName: string): boolean {
  return Object.values(SLUG_TO_SERVICE_NAME).includes(serviceName);
}

/**
 * Get all available service names from the mapping
 * @returns Array of service names
 */
export function getAllServiceNames(): string[] {
  return Object.values(SLUG_TO_SERVICE_NAME);
}

/**
 * Get all available slugs from the mapping
 * @returns Array of slugs
 */
export function getAllServiceSlugs(): string[] {
  return Object.keys(SLUG_TO_SERVICE_NAME);
}
