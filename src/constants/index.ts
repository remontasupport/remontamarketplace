export const BRAND_COLORS = {
  PRIMARY: '#0C1628',
  SECONDARY: '#B1C3CD',
  TERTIARY: '#F8E8D8',
  HIGHLIGHT: '#EDEFF3',
} as const

export const NDIS_CATEGORIES = [
  'Core Supports',
  'Capacity Building',
  'Capital Supports',
] as const

export const SUPPORT_TYPES = [
  'Assistance with daily personal activities',
  'Assistance with household tasks',
  'Community nursing care',
  'Therapeutic supports',
  'Behavioural support',
  'Assistance with social and community participation',
  'Transport',
  'Assistive technology',
] as const

export const USER_ROLES = {
  CLIENT: 'CLIENT',
  SUPPORT_WORKER: 'SUPPORT_WORKER',
  ADMIN: 'ADMIN',
} as const

export const MATCH_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
} as const


// Constants for Onboarding

export const SUPPORT_WORKER_CATEGORIES = [
  {
    id: "daily-living",
    title: "Daily Living Assistance",
    items: [
      "Personal care (showering, dressing, grooming, toileting)",
      "Meal preparation & feeding assistance",
      "Medication prompting & support",
      "Assistance with mobility & transfers",
      "Support with morning & bedtime routines"
    ]
  },
  {
    id: "household-tasks",
    title: "Household Tasks",
    items: [
      "Cleaning (vacuuming, mopping, dusting, bathrooms, kitchens)",
      "Laundry (washing, drying, folding, putting away)",
      "Changing bed linen",
      "Dishwashing",
      "Organising & tidying living spaces"
    ]
  },
  {
    id: "community-participation",
    title: "Community Participation",
    items: [
      "Accompanying to appointments (doctors, allied health, etc.)",
      "Attending social or recreational activities",
      "Shopping (groceries, essentials, personal items)",
      "Attending community events, classes, or programs",
      "Support with public transport, taxis, or ride-share"
    ]
  },
  {
    id: "capacity-building",
    title: "Capacity Building & Independence",
    items: [
      "Building daily living skills (cooking, budgeting, planning routines)",
      "Social skill development (communication, teamwork, confidence)",
      "Support with education, training, or job preparation",
      "Assistance with technology (phones, tablets, computers)"
    ]
  },
  {
    id: "health-wellbeing",
    title: "Health & Wellbeing",
    items: [
      "Exercise support (light fitness, stretches, physiotherapist-guided routines)",
      "Support for healthy eating & lifestyle routines",
      "Encouragement to attend therapy or fitness sessions",
      "Assistance with following health professional recommendations"
    ]
  },
  {
    id: "emotional-social",
    title: "Emotional & Social Support",
    items: [
      "Companionship & conversation",
      "Emotional regulation support",
      "Support during difficult times or transitions",
      "Encouragement & motivation for daily activities"
    ]
  },
  {
    id: "high-intensity",
    title: "High Intensity Supports",
    items: [
      "Complex bowel care",
      "Enteral feeding & management",
      "Tracheostomy care",
      "Ventilation assistance",
      "Subcutaneous injections",
      "Seizure management (including midazolam)",
      "Diabetes management (insulin support, monitoring)",
      "Pressure care & wound care"
    ]
  },
  {
    id: "children-youth",
    title: "Children & Youth",
    items: [
      "Assistance with morning and after-school routines",
      "Homework or learning support",
      "Guidance with behaviour or emotional regulation",
      "Support with social skills and play-based interaction",
      "Supervision during recreational or therapy activities",
      "Assistance with personal care (hygiene, meals, dressing)",
      "Encouragement for independence and confidence building"
    ],
    note: "Workers supporting children must hold a valid Working With Children Check."
  }
];

export const SERVICE_OPTIONS = [
  {
    id: "support-worker",
    title: "Support Worker",
    description: "May include companionship and support with daily living in the client's home and in the community. You don't need any previous experience or qualifications.",
    hasSubServices: true
  },
  {
    id: "therapeutic-supports",
    title: "Therapeutic Supports",
    description: "Applicable to a psychologist, physiotherapist, speech pathologist or occupational therapist. You must be registered with AHPRA or Speech Pathology Australia."
  },
  {
    id: "home-modifications",
    title: "Home Modifications",
    description: "Services related to modifying homes to improve accessibility and safety for people with disabilities."
  },
  {
    id: "fitness-rehabilitation",
    title: "Fitness and Rehabilitation",
    description: "Exercise and rehabilitation programs designed to improve physical health, mobility, and overall wellbeing."
  },
  {
    id: "cleaning-services",
    title: "Cleaning Services",
    description: "Professional cleaning services for homes and living spaces to maintain a clean and hygienic environment."
  },
  {
    id: "nursing-services",
    title: "Nursing Services",
    description: "Open to enrolled and registered nurses. To provide nursing services, you must be a Registered Nurse and have more than 1 year of relevant nursing experience."
  },
  {
    id: "home-yard-maintenance",
    title: "Home and Yard Maintenance",
    description: "Maintenance and upkeep of homes, gardens, and outdoor spaces to ensure safe and accessible living environments."
  }
];

export const TITLE_ROLE_OPTIONS = [
  "Support Worker",
  "Cleaner",
  "Gardener",
  "Physiotherapist",
  "Occupational Therapist",
  "Exercise Physiologist",
  "Psychologist",
  "Behaviour Support Practitioner",
  "Social Worker",
  "Speech Pathologist",
  "Personal Trainer",
  "Nurse (RN/EN)",
  "Builder",
  "Assistive Technology Provider",
  "Interpreter/Translator",
  "Accommodation Provider",
  "Employment Support Provider",
  "Other"
];

export const TOTAL_STEPS = 4;

export const FORM_DEFAULT_VALUES = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  city: "",
  state: "",
  titleRole: "",
  location: "",
  availability: "",
  startDate: "",
};
