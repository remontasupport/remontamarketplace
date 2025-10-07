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

export const SERVICE_OPTIONS = [
  "Support Worker",
  "Home Modifications",
  "Cleaning Services",
  "Home and Yard Maintenance",
  "Therapeutic Supports",
  "Fitness and Rehabilitation",
  "Nursing"
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

export const TOTAL_STEPS = 7;

export const FORM_DEFAULT_VALUES = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  age: "",
  gender: "",
  genderIdentity: "",
  city: "",
  state: "",
  languages: "",
  titleRole: "",
  experience: "",
  introduction: "",
  location: "",
  services: [] as string[],
  availability: "",
  startDate: "",
  funFact: "",
  hobbies: "",
  uniqueService: "",
  whyEnjoyWork: "",
  additionalInfo: "",
  qualifications: "",
  hasVehicle: "",
  photos: [] as File[],
  consentProfileShare: false,
  consentMarketing: false,
};
