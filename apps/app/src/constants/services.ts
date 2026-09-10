export const SERVICE_TYPES = [
  "Support Worker",
  "Support Worker (High Intensity)",
  "Therapeutic Supports",
  "Nursing Services",
  "Cleaning Services",
  "Home and Yard Maintenance",
] as const;

export type ServiceType = typeof SERVICE_TYPES[number] | string;
