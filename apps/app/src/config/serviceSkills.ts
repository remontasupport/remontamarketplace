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
 * Skills for Cleaning Services
 */
export const CLEANING_SERVICES_SKILLS: SkillCategory[] = [
  {
    id: "general-cleaning",
    label: "General Cleaning",
    icon: "🧹",
    skills: [
      {
        id: "general-household-cleaning",
        label: "General Household Cleaning",
        category: "general-cleaning"
      },
      {
        id: "vacuuming-mopping",
        label: "Vacuuming & Mopping",
        category: "general-cleaning"
      },
      {
        id: "dusting-surface-cleaning",
        label: "Dusting & Surface Cleaning",
        category: "general-cleaning"
      },
      {
        id: "bathroom-cleaning",
        label: "Bathroom Cleaning",
        category: "general-cleaning"
      },
      {
        id: "toilet-sanitation-cleaning",
        label: "Toilet & Sanitation Cleaning",
        category: "general-cleaning"
      },
      {
        id: "kitchen-cleaning",
        label: "Kitchen Cleaning",
        category: "general-cleaning"
      },
      {
        id: "rubbish-removal",
        label: "Rubbish Removal",
        category: "general-cleaning"
      }
    ]
  },
  {
    id: "deep-detailed-cleaning",
    label: "Deep & Detailed Cleaning",
    icon: "🧼",
    skills: [
      {
        id: "deep-cleaning-services",
        label: "Deep Cleaning Services",
        category: "deep-detailed-cleaning"
      },
      {
        id: "oven-cleaning",
        label: "Oven Cleaning",
        category: "deep-detailed-cleaning"
      },
      {
        id: "rangehood-cleaning",
        label: "Rangehood Cleaning",
        category: "deep-detailed-cleaning"
      },
      {
        id: "fridge-cleaning",
        label: "Fridge Cleaning",
        category: "deep-detailed-cleaning"
      },
      {
        id: "cupboard-pantry-cleaning",
        label: "Cupboard & Pantry Cleaning",
        category: "deep-detailed-cleaning"
      },
      {
        id: "wall-spot-cleaning",
        label: "Wall Spot Cleaning",
        category: "deep-detailed-cleaning"
      },
      {
        id: "skirting-boards-detail-cleaning",
        label: "Skirting Boards & Detail Cleaning",
        category: "deep-detailed-cleaning"
      }
    ]
  },
  {
    id: "windows-fixtures",
    label: "Windows & Fixtures",
    icon: "🪟",
    skills: [
      {
        id: "internal-window-cleaning",
        label: "Internal Window Cleaning",
        category: "windows-fixtures"
      },
      {
        id: "external-window-cleaning",
        label: "External Window Cleaning",
        category: "windows-fixtures"
      },
      {
        id: "glass-mirror-cleaning",
        label: "Glass & Mirror Cleaning",
        category: "windows-fixtures"
      },
      {
        id: "blind-cleaning",
        label: "Blind Cleaning",
        category: "windows-fixtures"
      },
      {
        id: "ceiling-fans-light-fixtures",
        label: "Ceiling Fans & Light Fixtures",
        category: "windows-fixtures"
      }
    ]
  },
  {
    id: "laundry-linen",
    label: "Laundry & Linen",
    icon: "🛏️",
    skills: [
      {
        id: "washing-drying-laundry",
        label: "Washing & Drying Laundry",
        category: "laundry-linen"
      },
      {
        id: "folding-putting-away-clothes",
        label: "Folding & Putting Away Clothes",
        category: "laundry-linen"
      },
      {
        id: "bed-making-linen-changes",
        label: "Bed Making & Linen Changes",
        category: "laundry-linen"
      },
      {
        id: "ironing",
        label: "Ironing",
        category: "laundry-linen"
      }
    ]
  },
  {
    id: "hygiene-infection-control",
    label: "Hygiene & Infection Control",
    icon: "🧽",
    skills: [
      {
        id: "high-touch-surface-disinfection",
        label: "High-Touch Surface Disinfection",
        category: "hygiene-infection-control"
      },
      {
        id: "infection-control-cleaning",
        label: "Infection Control Cleaning",
        category: "hygiene-infection-control"
      },
      {
        id: "ppe-safe-chemical-handling",
        label: "PPE Use & Safe Chemical Handling",
        category: "hygiene-infection-control"
      },
      {
        id: "cross-contamination-awareness",
        label: "Cross-Contamination Awareness",
        category: "hygiene-infection-control"
      }
    ]
  },
  {
    id: "client-specific-experience",
    label: "Client-Specific Experience",
    icon: "🏠",
    skills: [
      {
        id: "ndis-participant-homes",
        label: "NDIS Participant Homes",
        category: "client-specific-experience"
      },
      {
        id: "aged-care-clients",
        label: "Aged Care Clients",
        category: "client-specific-experience"
      },
      {
        id: "private-residential-cleaning",
        label: "Private Residential Cleaning",
        category: "client-specific-experience"
      },
      {
        id: "homes-with-pets",
        label: "Homes with Pets",
        category: "client-specific-experience"
      },
      {
        id: "homes-with-mobility-equipment",
        label: "Homes with Mobility Equipment",
        category: "client-specific-experience"
      }
    ]
  },
  {
    id: "high-risk-challenging-environments",
    label: "High-Risk / Challenging Environments",
    icon: "⚠️",
    skills: [
      {
        id: "hoarding-severe-clutter-support",
        label: "Hoarding & Severe Clutter Support",
        category: "high-risk-challenging-environments"
      },
      {
        id: "trauma-informed-cleaning",
        label: "Trauma-Informed Cleaning",
        category: "high-risk-challenging-environments"
      },
      {
        id: "heavy-soiling-environments",
        label: "Heavy Soiling Environments",
        category: "high-risk-challenging-environments"
      },
      {
        id: "biohazard-awareness-non-clinical",
        label: "Biohazard Awareness (Non-Clinical)",
        category: "high-risk-challenging-environments"
      },
      {
        id: "pest-affected-environments",
        label: "Pest-Affected Environments",
        category: "high-risk-challenging-environments"
      }
    ]
  },
  {
    id: "equipment-supplies",
    label: "Equipment & Supplies",
    icon: "🧰",
    skills: [
      {
        id: "own-cleaning-equipment",
        label: "Own Cleaning Equipment",
        category: "equipment-supplies"
      },
      {
        id: "own-cleaning-products",
        label: "Own Cleaning Products",
        category: "equipment-supplies"
      },
      {
        id: "eco-friendly-low-toxic-products",
        label: "Eco-Friendly / Low-Toxic Products",
        category: "equipment-supplies"
      },
      {
        id: "industrial-commercial-equipment",
        label: "Industrial / Commercial Equipment",
        category: "equipment-supplies"
      }
    ]
  }
];

/**
 * Skills for Home & Yard Maintenance
 */
export const HOME_YARD_MAINTENANCE_SKILLS: SkillCategory[] = [
  {
    id: "general-yard-maintenance",
    label: "General Yard Maintenance",
    icon: "🌿",
    skills: [
      {
        id: "lawn-mowing",
        label: "Lawn Mowing",
        category: "general-yard-maintenance"
      },
      {
        id: "edge-trimming",
        label: "Edge Trimming",
        category: "general-yard-maintenance"
      },
      {
        id: "weeding-manual",
        label: "Weeding (Manual)",
        category: "general-yard-maintenance"
      },
      {
        id: "basic-pruning-trimming",
        label: "Basic Pruning & Trimming",
        category: "general-yard-maintenance"
      },
      {
        id: "leaf-green-waste-removal",
        label: "Leaf & Green Waste Removal",
        category: "general-yard-maintenance"
      },
      {
        id: "general-garden-tidy-up",
        label: "General Garden Tidy-Up",
        category: "general-yard-maintenance"
      }
    ]
  },
  {
    id: "gardening-plant-care",
    label: "Gardening & Plant Care",
    icon: "🌱",
    skills: [
      {
        id: "planting-plants-shrubs",
        label: "Planting (Plants / Shrubs)",
        category: "gardening-plant-care"
      },
      {
        id: "mulching",
        label: "Mulching",
        category: "gardening-plant-care"
      },
      {
        id: "fertilising-basic",
        label: "Fertilising (Basic)",
        category: "gardening-plant-care"
      },
      {
        id: "watering-irrigation-checks",
        label: "Watering & Irrigation Checks",
        category: "gardening-plant-care"
      },
      {
        id: "hedge-trimming",
        label: "Hedge Trimming",
        category: "gardening-plant-care"
      }
    ]
  },
  {
    id: "tree-structural-work",
    label: "Tree & Structural Work (Non-Arborist unless qualified)",
    icon: "🌳",
    skills: [
      {
        id: "small-tree-pruning",
        label: "Small Tree Pruning (Under Height Limit)",
        category: "tree-structural-work"
      },
      {
        id: "branch-limb-removal",
        label: "Branch & Limb Removal (Ground Level)",
        category: "tree-structural-work"
      },
      {
        id: "storm-debris-cleanup",
        label: "Storm Debris Clean-Up",
        category: "tree-structural-work"
      },
      {
        id: "fallen-tree-branch-removal",
        label: "Fallen Tree / Branch Removal",
        category: "tree-structural-work"
      }
    ]
  },
  {
    id: "hardscape-outdoor-areas",
    label: "Hardscape & Outdoor Areas",
    icon: "🧱",
    skills: [
      {
        id: "pathway-paving-cleaning",
        label: "Pathway & Paving Cleaning",
        category: "hardscape-outdoor-areas"
      },
      {
        id: "courtyard-patio-cleaning",
        label: "Courtyard & Patio Cleaning",
        category: "hardscape-outdoor-areas"
      },
      {
        id: "pressure-washing-paths-driveways",
        label: "Pressure Washing (Paths / Driveways)",
        category: "hardscape-outdoor-areas"
      },
      {
        id: "outdoor-furniture-cleaning",
        label: "Outdoor Furniture Cleaning",
        category: "hardscape-outdoor-areas"
      }
    ]
  },
  {
    id: "cleanup-waste-management",
    label: "Clean-Up & Waste Management",
    icon: "🧹",
    skills: [
      {
        id: "green-waste-removal",
        label: "Green Waste Removal",
        category: "cleanup-waste-management"
      },
      {
        id: "tip-runs",
        label: "Tip Runs",
        category: "cleanup-waste-management"
      },
      {
        id: "yard-rubbish-removal",
        label: "Yard Rubbish Removal",
        category: "cleanup-waste-management"
      },
      {
        id: "overgrown-yard-cleanups",
        label: "Overgrown Yard Clean-Ups",
        category: "cleanup-waste-management"
      }
    ]
  },
  {
    id: "client-specific-experience-yard",
    label: "Client-Specific Experience",
    icon: "🧍‍♂️",
    skills: [
      {
        id: "ndis-participant-properties",
        label: "NDIS Participant Properties",
        category: "client-specific-experience-yard"
      },
      {
        id: "aged-care-clients-yard",
        label: "Aged Care Clients",
        category: "client-specific-experience-yard"
      },
      {
        id: "private-residential-properties",
        label: "Private Residential Properties",
        category: "client-specific-experience-yard"
      },
      {
        id: "properties-accessibility-needs",
        label: "Properties with Accessibility Needs",
        category: "client-specific-experience-yard"
      }
    ]
  },
  {
    id: "equipment-supplies-yard",
    label: "Equipment & Supplies",
    icon: "🧰",
    skills: [
      {
        id: "own-vehicle",
        label: "Own Vehicle",
        category: "equipment-supplies-yard"
      },
      {
        id: "own-equipment-yard",
        label: "Own Equipment",
        category: "equipment-supplies-yard"
      },
      {
        id: "industrial-commercial-equipment-yard",
        label: "Industrial / Commercial Equipment",
        category: "equipment-supplies-yard"
      }
    ]
  }
];

/**
 * Skills for Nursing Services
 */
export const NURSING_SERVICES_SKILLS: SkillCategory[] = [
  {
    id: "general-nursing-care",
    label: "General Nursing Care",
    icon: "🩺",
    skills: [
      {
        id: "registered-nurse",
        label: "Registered Nurse (RN)",
        category: "general-nursing-care"
      },
      {
        id: "enrolled-nurse",
        label: "Enrolled Nurse (EN)",
        category: "general-nursing-care"
      },
      {
        id: "medication-administration",
        label: "Medication Administration",
        category: "general-nursing-care"
      },
      {
        id: "clinical-assessments",
        label: "Clinical Assessments & Monitoring",
        category: "general-nursing-care"
      },
      {
        id: "vital-signs-monitoring",
        label: "Vital Signs Monitoring",
        category: "general-nursing-care"
      },
      {
        id: "care-plan-implementation",
        label: "Care Plan Implementation",
        category: "general-nursing-care"
      }
    ]
  },
  {
    id: "medication-treatment",
    label: "Medication & Treatment Management",
    icon: "💉",
    skills: [
      {
        id: "med-admin-oral-topical",
        label: "Medication Administration (Oral / Topical)",
        category: "medication-treatment"
      },
      {
        id: "med-admin-injectable",
        label: "Medication Administration (Injectable)",
        category: "medication-treatment"
      },
      {
        id: "webster-pack-management",
        label: "Webster Pack Management",
        category: "medication-treatment"
      },
      {
        id: "medication-reviews",
        label: "Medication Reviews & Documentation",
        category: "medication-treatment"
      },
      {
        id: "prn-medication",
        label: "PRN Medication Management",
        category: "medication-treatment"
      }
    ]
  },
  {
    id: "complex-care",
    label: "Complex & High-Needs Care",
    icon: "🧠",
    skills: [
      {
        id: "complex-health-support",
        label: "Complex Health Support",
        category: "complex-care"
      },
      {
        id: "chronic-disease-management",
        label: "Chronic Disease Management",
        category: "complex-care"
      },
      {
        id: "high-physical-support",
        label: "High Physical Support Experience",
        category: "complex-care"
      },
      {
        id: "post-hospital-care",
        label: "Post-Hospital Care & Monitoring",
        category: "complex-care"
      },
      {
        id: "palliative-care",
        label: "Palliative Care Experience",
        category: "complex-care"
      }
    ]
  },
  {
    id: "wound-skin-care",
    label: "Wound & Skin Care",
    icon: "🩹",
    skills: [
      {
        id: "wound-assessment",
        label: "Wound Assessment & Dressing",
        category: "wound-skin-care"
      },
      {
        id: "pressure-injury",
        label: "Pressure Injury Prevention & Management",
        category: "wound-skin-care"
      },
      {
        id: "skin-integrity",
        label: "Skin Integrity Monitoring",
        category: "wound-skin-care"
      },
      {
        id: "post-surgical-wound",
        label: "Post-Surgical Wound Care",
        category: "wound-skin-care"
      }
    ]
  },
  {
    id: "continence-clinical",
    label: "Continence & Clinical Procedures",
    icon: "🧪",
    skills: [
      {
        id: "catheter-care",
        label: "Catheter Care & Management",
        category: "continence-clinical"
      },
      {
        id: "bowel-care",
        label: "Bowel Care Management",
        category: "continence-clinical"
      },
      {
        id: "stoma-care",
        label: "Stoma Care",
        category: "continence-clinical"
      },
      {
        id: "peg-feeding",
        label: "PEG Feeding Management",
        category: "continence-clinical"
      }
    ]
  },
  {
    id: "neurological-respiratory",
    label: "Neurological & Respiratory Support",
    icon: "🫁",
    skills: [
      {
        id: "epilepsy-seizure",
        label: "Epilepsy & Seizure Management",
        category: "neurological-respiratory"
      },
      {
        id: "tracheostomy-care",
        label: "Tracheostomy Care (if qualified)",
        category: "neurological-respiratory"
      },
      {
        id: "respiratory-support",
        label: "Respiratory Support Monitoring",
        category: "neurological-respiratory"
      },
      {
        id: "oxygen-therapy",
        label: "Oxygen Therapy Management",
        category: "neurological-respiratory"
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
    case "Support Worker (High Intensity)":
      return SUPPORT_WORKER_SKILLS;
    case "Cleaning Services":
      return CLEANING_SERVICES_SKILLS;
    case "Home and Yard Maintenance":
      return HOME_YARD_MAINTENANCE_SKILLS;
    case "Nursing Services":
      return NURSING_SERVICES_SKILLS;
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
