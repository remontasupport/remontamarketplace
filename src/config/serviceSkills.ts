/**
 * Service Skills Configuration
 * Defines skill categories and individual skills for each service
 */

export interface ServiceSkill {
  id: string;
  label: string;
  category: string;
}

export interface SkillCategory {
  id: string;
  label: string;
  icon: string;
  skills: ServiceSkill[];
}

/**
 * Skills for Support Worker service
 */
export const SUPPORT_WORKER_SKILLS: SkillCategory[] = [
  {
    id: "personal-daily-living",
    label: "Personal & Daily Living Support",
    icon: "🧠",
    skills: [
      {
        id: "personal-care",
        label: "Assistance with Personal Care",
        category: "personal-daily-living"
      },
      {
        id: "showering-hygiene",
        label: "Showering & Hygiene Support",
        category: "personal-daily-living"
      },
      {
        id: "dressing-grooming",
        label: "Dressing & Grooming",
        category: "personal-daily-living"
      },
      {
        id: "toileting-support",
        label: "Toileting Support",
        category: "personal-daily-living"
      },
      {
        id: "meal-preparation",
        label: "Meal Preparation & Feeding Assistance",
        category: "personal-daily-living"
      },
      {
        id: "mobility-assistance",
        label: "Mobility Assistance",
        category: "personal-daily-living"
      },
      {
        id: "community-access",
        label: "Community Access Support",
        category: "personal-daily-living"
      }
    ]
  },
  {
    id: "health-medication",
    label: "Health & Medication Support",
    icon: "💊",
    skills: [
      {
        id: "medication-prompting",
        label: "Medication Assistance (Prompting)",
        category: "health-medication"
      },
      {
        id: "medication-administration",
        label: "Medication Administration (Qualified)",
        category: "health-medication"
      },
      {
        id: "webster-pack",
        label: "Webster Pack Management",
        category: "health-medication"
      },
      {
        id: "medication-documentation",
        label: "Medication Documentation & Reporting",
        category: "health-medication"
      },
      {
        id: "health-monitoring",
        label: "Health Monitoring & Observations",
        category: "health-medication"
      }
    ]
  },
  {
    id: "manual-handling",
    label: "Manual Handling & Physical Support",
    icon: "🏋️‍♂️",
    skills: [
      {
        id: "manual-handling-experience",
        label: "Manual Handling Experience",
        category: "manual-handling"
      },
      {
        id: "hoist-transfers",
        label: "Hoist Transfers",
        category: "manual-handling"
      },
      {
        id: "slide-sheet-transfers",
        label: "Slide Sheet Transfers",
        category: "manual-handling"
      },
      {
        id: "stand-assist",
        label: "Stand Assist / Transfer Aids",
        category: "manual-handling"
      },
      {
        id: "high-physical-support",
        label: "High Physical Support Experience",
        category: "manual-handling"
      }
    ]
  },
  {
    id: "complex-behavioural",
    label: "Complex & Behavioural Support",
    icon: "🧩",
    skills: [
      {
        id: "complex-behaviour-support",
        label: "Complex Behaviour Support",
        category: "complex-behavioural"
      },
      {
        id: "positive-behaviour-support",
        label: "Positive Behaviour Support (PBS)",
        category: "complex-behavioural"
      },
      {
        id: "de-escalation",
        label: "De-escalation Techniques",
        category: "complex-behavioural"
      },
      {
        id: "trauma-informed-care",
        label: "Trauma-Informed Care",
        category: "complex-behavioural"
      },
      {
        id: "restrictive-practices",
        label: "Restrictive Practices Awareness",
        category: "complex-behavioural"
      },
      {
        id: "forensic-participant",
        label: "Forensic Participant Experience",
        category: "complex-behavioural"
      }
    ]
  },
  {
    id: "mental-health-cognitive",
    label: "Mental Health & Cognitive Support",
    icon: "🧠",
    skills: [
      {
        id: "mental-health-support",
        label: "Mental Health Support Experience",
        category: "mental-health-cognitive"
      },
      {
        id: "psychosocial-disability",
        label: "Psychosocial Disability Experience",
        category: "mental-health-cognitive"
      },
      {
        id: "dementia-care",
        label: "Dementia Care",
        category: "mental-health-cognitive"
      },
      {
        id: "intellectual-disability",
        label: "Intellectual Disability Support",
        category: "mental-health-cognitive"
      },
      {
        id: "autism-support",
        label: "Autism Spectrum Disorder (ASD) Support",
        category: "mental-health-cognitive"
      }
    ]
  },
  {
    id: "clinical-high-needs",
    label: "Clinical & High-Needs Experience",
    icon: "🩺",
    skills: [
      {
        id: "peg-feeding",
        label: "PEG Feeding Experience",
        category: "clinical-high-needs"
      },
      {
        id: "catheter-care",
        label: "Catheter Care Experience",
        category: "clinical-high-needs"
      },
      {
        id: "bowel-care",
        label: "Bowel Care Experience",
        category: "clinical-high-needs"
      },
      {
        id: "epilepsy-seizure",
        label: "Epilepsy & Seizure Management Awareness",
        category: "clinical-high-needs"
      },
      {
        id: "pressure-care",
        label: "Pressure Care & Skin Integrity Awareness",
        category: "clinical-high-needs"
      }
    ]
  },
  {
    id: "age-specific",
    label: "Age-Specific Experience",
    icon: "🧍‍♂️",
    skills: [
      {
        id: "children-adolescents",
        label: "Children & Adolescents",
        category: "age-specific"
      },
      {
        id: "adults-18-64",
        label: "Adults (18–64)",
        category: "age-specific"
      },
      {
        id: "older-adults",
        label: "Older Adults / Aged Care",
        category: "age-specific"
      }
    ]
  },
  {
    id: "communication-cultural",
    label: "Communication & Cultural Support",
    icon: "🗣️",
    skills: [
      {
        id: "non-verbal-communication",
        label: "Non-Verbal Communication Support",
        category: "communication-cultural"
      },
      {
        id: "aac-support",
        label: "Augmentative & Alternative Communication (AAC)",
        category: "communication-cultural"
      },
      {
        id: "culturally-sensitive",
        label: "Culturally Sensitive Support",
        category: "communication-cultural"
      },
      {
        id: "aboriginal-torres-strait",
        label: "Aboriginal & Torres Strait Islander Experience",
        category: "communication-cultural"
      },
      {
        id: "cald-community",
        label: "CALD Community Experience",
        category: "communication-cultural"
      }
    ]
  },
  {
    id: "transport-community",
    label: "Transport & Community Engagement",
    icon: "🚗",
    skills: [
      {
        id: "participant-transport",
        label: "Participant Transport (Own Vehicle)",
        category: "transport-community"
      },
      {
        id: "wheelchair-accessible-transport",
        label: "Wheelchair-Accessible Transport Experience",
        category: "transport-community"
      },
      {
        id: "appointment-errand",
        label: "Appointment & Errand Support",
        category: "transport-community"
      },
      {
        id: "social-recreational",
        label: "Social & Recreational Activity Support",
        category: "transport-community"
      }
    ]
  },
  {
    id: "compliance-reporting",
    label: "Compliance & Reporting",
    icon: "📋",
    skills: [
      {
        id: "progress-notes",
        label: "Progress Notes & Case Notes",
        category: "compliance-reporting"
      },
      {
        id: "incident-reporting",
        label: "Incident Reporting",
        category: "compliance-reporting"
      },
      {
        id: "behaviour-tracking",
        label: "Behaviour Tracking & Data Collection",
        category: "compliance-reporting"
      },
      {
        id: "support-plan-implementation",
        label: "Support Plan Implementation",
        category: "compliance-reporting"
      }
    ]
  },
  {
    id: "household-practical",
    label: "Household & Practical Support",
    icon: "🧰",
    skills: [
      {
        id: "domestic-assistance",
        label: "Domestic Assistance",
        category: "household-practical"
      },
      {
        id: "meal-prep-cooking",
        label: "Meal Prep & Light Cooking",
        category: "household-practical"
      },
      {
        id: "shopping-assistance",
        label: "Shopping Assistance",
        category: "household-practical"
      },
      {
        id: "household-organisation",
        label: "Household Organisation Support",
        category: "household-practical"
      }
    ]
  }
];

/**
 * Get skills for a specific service
 */
export function getSkillsForService(serviceTitle: string): SkillCategory[] {
  switch (serviceTitle) {
    case "Support Worker":
      return SUPPORT_WORKER_SKILLS;
    // Add other services here
    default:
      return [];
  }
}

/**
 * Check if a service has skills configured
 */
export function serviceHasSkills(serviceTitle: string): boolean {
  const skills = getSkillsForService(serviceTitle);
  return skills.length > 0;
}
