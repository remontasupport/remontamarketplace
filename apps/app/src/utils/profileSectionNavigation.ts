/**
 * Profile Building Section Navigation Utility
 * Manages the order and navigation between profile building sections
 */

export interface SectionConfig {
  id: string;
  label: string;
  href: string;
}

// Define the complete order of sections
export const PROFILE_SECTIONS: SectionConfig[] = [
  // Job Details
  {
    id: "preferred-hours",
    label: "Preferred Hours",
    href: "/dashboard/worker/profile-building?section=preferred-hours",
  },
  {
    id: "experience",
    label: "Experience",
    href: "/dashboard/worker/profile-building?section=experience",
  },
  // Additional Details
  {
    id: "bank-account",
    label: "Bank Account",
    href: "/dashboard/worker/profile-building?section=bank-account",
  },
  {
    id: "work-history",
    label: "Work History",
    href: "/dashboard/worker/profile-building?section=work-history",
  },
  {
    id: "education-training",
    label: "Education & Training",
    href: "/dashboard/worker/profile-building?section=education-training",
  },
  {
    id: "good-to-know",
    label: "Good To Know",
    href: "/dashboard/worker/profile-building?section=good-to-know",
  },
  {
    id: "languages",
    label: "Languages",
    href: "/dashboard/worker/profile-building?section=languages",
  },
  {
    id: "cultural-background",
    label: "Cultural Background",
    href: "/dashboard/worker/profile-building?section=cultural-background",
  },
  {
    id: "religion",
    label: "Religion",
    href: "/dashboard/worker/profile-building?section=religion",
  },
  {
    id: "interests-hobbies",
    label: "Interests & Hobbies",
    href: "/dashboard/worker/profile-building?section=interests-hobbies",
  },
  {
    id: "about-me",
    label: "About Me",
    href: "/dashboard/worker/profile-building?section=about-me",
  },
  {
    id: "personality",
    label: "Personality",
    href: "/dashboard/worker/profile-building?section=personality",
  },
  {
    id: "my-preferences",
    label: "My Preferences",
    href: "/dashboard/worker/profile-building?section=my-preferences",
  },
];

/**
 * Get the next section in the profile building flow
 * @param currentSectionId - Current section ID
 * @returns Next section config or null if at the end
 */
export function getNextSection(currentSectionId: string): SectionConfig | null {
  const currentIndex = PROFILE_SECTIONS.findIndex(
    (section) => section.id === currentSectionId
  );

  if (currentIndex === -1 || currentIndex === PROFILE_SECTIONS.length - 1) {
    return null; // Section not found or already at the last section
  }

  return PROFILE_SECTIONS[currentIndex + 1];
}

/**
 * Get the previous section in the profile building flow
 * @param currentSectionId - Current section ID
 * @returns Previous section config or null if at the beginning
 */
export function getPreviousSection(currentSectionId: string): SectionConfig | null {
  const currentIndex = PROFILE_SECTIONS.findIndex(
    (section) => section.id === currentSectionId
  );

  if (currentIndex <= 0) {
    return null; // Section not found or already at the first section
  }

  return PROFILE_SECTIONS[currentIndex - 1];
}

/**
 * Check if the current section is the last one
 * @param currentSectionId - Current section ID
 * @returns True if last section, false otherwise
 */
export function isLastSection(currentSectionId: string): boolean {
  const currentIndex = PROFILE_SECTIONS.findIndex(
    (section) => section.id === currentSectionId
  );

  return currentIndex === PROFILE_SECTIONS.length - 1;
}
