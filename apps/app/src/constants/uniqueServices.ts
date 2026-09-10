/**
 * Unique service categories for worker profile "About Me" section
 * Workers can multi-select items from each category to highlight their unique offerings
 */
export const UNIQUE_SERVICE_CATEGORIES = [
  {
    id: "outdoor-adventure",
    title: "Outdoor & Adventure-Based Supports",
    items: [
      "Camping & overnight trips",
      "Bushwalking & nature outings",
      "Beach days & water-based activities",
      "Fishing trips",
      "National park excursions",
      "Adventure parks / low-risk outdoor challenges",
    ],
  },
  {
    id: "health-fitness",
    title: "Health, Fitness & Wellbeing",
    items: [
      "Yoga (gentle, chair-based, or adaptive)",
      "Fitness training (NDIS-appropriate, non-clinical)",
      "Walking programs",
      "Stretching & mobility sessions",
      "Mindfulness & meditation",
      "Breathwork & relaxation techniques",
    ],
  },
  {
    id: "social-entertainment",
    title: "Social, Entertainment & Community Access",
    items: [
      "Concerts & live music events",
      "Sporting events (NRL, AFL, soccer, etc.)",
      "Movies & cinema outings",
      "Community festivals & markets",
      "Comedy shows or theatre",
      "Museum & gallery visits",
    ],
  },
  {
    id: "creative-skills",
    title: "Creative & Skill-Building Supports",
    items: [
      "Art & painting sessions",
      "Music practice or jam sessions",
      "Photography outings",
      "Cooking & meal prep as a hobby",
      "Gardening projects",
      "DIY / basic handyman activities (where appropriate)",
    ],
  },
  {
    id: "life-skills",
    title: "Life Skills & Capacity Building",
    items: [
      "Public transport training",
      "Confidence building & social skills",
      "Money handling & budgeting practice",
      "Routine building & planning",
      "Communication support in community settings",
      "Support with hobbies and personal goals",
    ],
  },
  {
    id: "lived-experience",
    title: "Special Interest / Lived Experience Supports",
    items: [
      "ASD-experienced support workers",
      "Mental health lived-experience workers",
      "Youth mentoring",
      "Male-only support",
      "Female-only support",
      "Cultural or language-specific supports",
      "LGBTQIA+ inclusive supports",
    ],
  },
  {
    id: "niche-lifestyle",
    title: "Niche & Lifestyle Supports",
    items: [
      "Gym buddy / workout partner",
      "Running or cycling partner",
      "Sports coaching (casual, non-therapeutic)",
      "Meal planning & healthy lifestyle coaching",
      "Support with social anxiety in public spaces",
    ],
  },
] as const;

export type UniqueServiceCategory = (typeof UNIQUE_SERVICE_CATEGORIES)[number];
export type UniqueServiceItem = UniqueServiceCategory["items"][number];

/**
 * Get all unique service items as a flat array
 */
export const getAllUniqueServiceItems = (): string[] => {
  return UNIQUE_SERVICE_CATEGORIES.flatMap((category) => [...category.items]);
};
