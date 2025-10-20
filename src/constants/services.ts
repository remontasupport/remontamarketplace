export const SERVICE_TYPES = [
  "Support Worker",
  "Cleaning Services",
  "Therapeutic Supports",
  "Nursing",
  "Home Modifications",
  "Home and Yard Maintenance",
  "Fitness and Rehabilitation",
] as const;

export type ServiceType = typeof SERVICE_TYPES[number] | string;
