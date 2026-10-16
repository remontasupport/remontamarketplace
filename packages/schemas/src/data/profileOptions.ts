// The option lists of the worker's profile sections (worker-profile-api U2, R7): one
// place for the values the api accepts, the pages offer, and the admin filters match.
// Copied exactly from the app's section components on 2026-10-12 (a test in apps/app keeps
// them equal until those components are deleted); the stored strings are these labels, so
// a change here is a data decision, not a wording one.
//
// Languages and interests also accept a worker's own entries (the pages let a worker type
// a language or an interest that is not listed), so their contract rules are "a listed
// value or a bounded free label"; every other list is a strict enumeration.

export const LANGUAGES = [
  'English',
  'Arabic',
  'Cantonese',
  'Croatian',
  'French',
  'German',
  'Greek',
  'Hebrew',
  'Hindi',
  'Hungarian',
  'Indonesian',
  'Italian',
  'Japanese',
  'Korean',
  'Macedonian',
  'Maltese',
  'Mandarin',
  'Nepali',
  'Netherlandic (Dutch)',
  'Persian',
  'Polish',
  'Portugese',
  'Russian',
  'Samoan',
  'Serbian',
  'Sinhalese',
  'Spanish',
  'Tagalog (Filipino)',
  'Tamil',
  'Turkish',
  'Vietnamese',
  'Auslan (Australian sign language)',
] as const

export const CULTURAL_BACKGROUNDS = [
  'Australian',
  'Other Oceanian',
  'North American',
  'Australian Aboriginal',
  'Western European',
  'South American',
  'Australian South East Islan...',
  'Northern European',
  'Central American',
  'Torres Strait Islander',
  'Southern & Eastern European',
  'Carribean Islander',
  'New Zealander',
  'Middle Eastern',
  'South African',
  'Maori',
  'Jewish',
  'Other African',
  'Polynesian',
  'Asian',
  'Other',
] as const

export const RELIGIONS = [
  'Anglican',
  'Hindu',
  'Russian Orthodox',
  'Buddhist',
  'Islamic',
  'Sikh',
  'Catholic',
  'Jewish',
  'Spiritual',
  'Christian - other',
  'None',
  'Uniting Church',
  'Greek Orthodox',
  'Presbyterian',
  'Other',
] as const

/** The interest labels the page offers; a worker's own interests are stored as free labels beside them. */
export const INTERESTS = [
  'Cooking',
  'Movies',
  'Pets',
  'Sports',
  'Gardening',
  'Music',
  'Photography / Art',
  'Travel',
  'Indoor Games / Puzzles',
  'Cultural Festivities',
  'Reading',
] as const

export const WORK_PREFERENCES = ['Female', 'Male', 'Non-smoker', 'No pets', 'No preferences'] as const

/** `constants/uniqueServices.ts`'s items, flattened in its category order. */
export const UNIQUE_SERVICES = [
  'Camping & overnight trips',
  'Bushwalking & nature outings',
  'Beach days & water-based activities',
  'Fishing trips',
  'National park excursions',
  'Adventure parks / low-risk outdoor challenges',
  'Yoga (gentle, chair-based, or adaptive)',
  'Fitness training (NDIS-appropriate, non-clinical)',
  'Walking programs',
  'Stretching & mobility sessions',
  'Mindfulness & meditation',
  'Breathwork & relaxation techniques',
  'Concerts & live music events',
  'Sporting events (NRL, AFL, soccer, etc.)',
  'Movies & cinema outings',
  'Community festivals & markets',
  'Comedy shows or theatre',
  'Museum & gallery visits',
  'Art & painting sessions',
  'Music practice or jam sessions',
  'Photography outings',
  'Cooking & meal prep as a hobby',
  'Gardening projects',
  'DIY / basic handyman activities (where appropriate)',
  'Public transport training',
  'Confidence building & social skills',
  'Money handling & budgeting practice',
  'Routine building & planning',
  'Communication support in community settings',
  'Support with hobbies and personal goals',
  'ASD-experienced support workers',
  'Mental health lived-experience workers',
  'Youth mentoring',
  'Male-only support',
  'Female-only support',
  'Cultural or language-specific supports',
  'LGBTQIA+ inclusive supports',
  'Gym buddy / workout partner',
  'Running or cycling partner',
  'Sports coaching (casual, non-therapeutic)',
  'Meal planning & healthy lifestyle coaching',
  'Support with social anxiety in public spaces',
] as const

export const PERSONALITIES = ['Outgoing and engaging', 'Calm and relaxed'] as const

/**
 * Today's stored values; the admin filter is built on Male and Female (normalisation is follow-up 13). "Prefer not to
 * say" (user, 2026-10-14) is an answer: it completes the field, and such a worker matches neither gender filter.
 */
export const GENDERS = ['Male', 'Female', 'Prefer not to say'] as const

export const VEHICLE_ANSWERS = ['Yes', 'No'] as const

/** As the work-history and education pickers store them. */
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const

/** packages/db's DayOfWeek, in week order. */
export const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const

/**
 * The additional-details groups, one write entry each (R7.2). The old about-me group is two since 2026-10-13 (user):
 * the activities and the fun fact are asked on different pages, so each saves alone.
 */
export const ADDITIONAL_INFO_GROUPS = ['good-to-know', 'languages', 'cultural-background', 'religion', 'interests', 'support-activities', 'fun-fact', 'preferences', 'personality'] as const

export type Language = (typeof LANGUAGES)[number]
export type CulturalBackground = (typeof CULTURAL_BACKGROUNDS)[number]
export type Religion = (typeof RELIGIONS)[number]
export type Interest = (typeof INTERESTS)[number]
export type WorkPreference = (typeof WORK_PREFERENCES)[number]
export type UniqueService = (typeof UNIQUE_SERVICES)[number]
export type Personality = (typeof PERSONALITIES)[number]
export type Gender = (typeof GENDERS)[number]
export type Month = (typeof MONTHS)[number]
export type Day = (typeof DAYS)[number]
export type AdditionalInfoGroup = (typeof ADDITIONAL_INFO_GROUPS)[number]

/** 0-based month index, or -1. */
export function monthIndex(month: string): number {
  return (MONTHS as readonly string[]).indexOf(month)
}
