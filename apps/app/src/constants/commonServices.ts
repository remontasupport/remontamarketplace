/**
 * Common services list for quick selection in admin dashboard
 * Used when adding services to contractor profiles
 */
export const COMMON_SERVICES = [
  "Daily Living Assistance",
  "Implementing strategies recommended by therapists (e.g., OT, psychologist)",
  "Domestic assistance and household tasks",
  "Personal Care activities",
  "Social and Community access",
  "Capacity Building & Independence",
  "Assistance with social skills development and communication",
  "Support with daily routines and life skills",
  "Support with attention, focus, and task completion",
  "Support with emotional regulation and coping strategies",
] as const;

export type CommonService = (typeof COMMON_SERVICES)[number];
