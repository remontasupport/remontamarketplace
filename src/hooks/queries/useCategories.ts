/**
 * Categories Query Hook with TanStack Query
 *
 * Implements data fetching best practices:
 * - Smart caching with 5-minute stale time
 * - Background refetching for fresh data
 * - Automatic deduplication
 * - No refetching every time component renders
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Query Keys - centralized for consistency
export const categoriesKeys = {
  all: ["categories"] as const,
};

// Types matching your categories.json structure
export interface Document {
  id: string;
  name: string;
  category: string;
  description: string;
  hasExpiration: boolean;
}

export interface ConditionalDocument {
  document: Document;
  condition: string;
  requiredIf: boolean;
}

export interface Category {
  id: string;
  name: string;
  requiresQualification: boolean;
  documents: {
    required: Document[];
    optional: Document[];
    conditional: ConditionalDocument[];
  };
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  requiresRegistration: string | null;
  additionalDocuments: Document[];
}

// Service option format for registration form
export interface ServiceOption {
  id: string;
  title: string;
  description: string;
  hasSubServices?: boolean;
}

// API Fetcher using axios
async function fetchCategories(): Promise<Category[]> {
  const response = await axios.get("/api/categories");
  return response.data;
}

/**
 * Hook to fetch all categories with smart caching
 *
 * Features:
 * - Caches data for 5 minutes (staleTime)
 * - Keeps cached data for 30 minutes (gcTime)
 * - Automatic background refetching when stale
 * - Deduplicates simultaneous requests
 * - Fetches once per session (unless manually invalidated)
 */
export function useCategories() {
  return useQuery({
    queryKey: categoriesKeys.all,
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache
    retry: 1, // Retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}

/**
 * Helper function to transform categories to service options format
 * Used for registration form compatibility with existing SERVICE_OPTIONS
 */
export function transformCategoriesToServiceOptions(
  categories: Category[]
): ServiceOption[] {
  return categories.map((category) => ({
    id: category.id,
    title: category.name,
    description: generateServiceDescription(category),
    hasSubServices: category.subcategories.length > 0,
  }));
}

/**
 * Generate description from category data
 * Falls back to sensible defaults based on category type
 */
function generateServiceDescription(category: Category): string {
  const requiredDocs = category.documents.required;

  // Custom descriptions based on category ID
  const customDescriptions: Record<string, string> = {
    "support-worker":
      "May include companionship and support with daily living in the client's home and in the community. You don't need any previous experience or qualifications.",
    "therapeutic-supports":
      "Applicable to a psychologist, physiotherapist, speech pathologist or occupational therapist. You must be registered with AHPRA or Speech Pathology Australia.",
    "nursing-services":
      "Open to enrolled and registered nurses. To provide nursing services, you must be a Registered Nurse and have more than 1 year of relevant nursing experience.",
    "personal-trainer":
      "Exercise and fitness programs designed to improve physical health, mobility, and overall wellbeing for NDIS participants.",
    "home-yard-maintenance":
      "Maintenance and upkeep of homes, gardens, and outdoor spaces to ensure safe and accessible living environments.",
    "cleaning-services":
      "Professional cleaning services for homes and living spaces to maintain a clean and hygienic environment.",
  };

  if (customDescriptions[category.id]) {
    return customDescriptions[category.id];
  }

  // Generate description based on requirements
  const hasQualificationRequirement = category.requiresQualification;
  const hasRegistration = category.subcategories.some(
    (sub) => sub.requiresRegistration
  );

  if (hasRegistration) {
    const registrationTypes = Array.from(
      new Set(
        category.subcategories
          .filter((s) => s.requiresRegistration)
          .map((s) => s.requiresRegistration)
      )
    );
    return `Applicable to professionals who must be registered with ${registrationTypes.join(", ")}.`;
  }

  if (hasQualificationRequirement) {
    return `Requires relevant qualifications and certifications. Professional services with specific regulatory requirements.`;
  }

  return `Professional services for NDIS participants.`;
}
