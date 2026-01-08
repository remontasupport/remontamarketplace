/**
 * Worker Registration Types
 * Used by registration endpoints and processing logic
 */

export interface WorkerRegistrationJobData {
  // User credentials
  email: string;
  password: string;

  // Personal info
  firstName: string;
  lastName: string;
  mobile: string;

  // Worker details
  location?: string;

  // Services
  services?: string[]; // Selected service category IDs
  supportWorkerCategories?: string[]; // Selected support worker subcategory IDs

  // Geocoded location (if already geocoded)
  geocodedLocation?: {
    city: string | null;
    state: string | null;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}
