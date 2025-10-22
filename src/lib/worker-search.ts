/**
 * Worker Search Utilities
 *
 * Distance-based worker search using geocoded coordinates
 * Similar to contractor search implementation
 */

import { authPrisma } from './auth-prisma';
import { calculateDistance, calculateBoundingBox } from './geocoding';

export interface WorkerSearchFilters {
  // Location-based filtering
  latitude?: number;
  longitude?: number;
  radiusKm?: number;

  // Service filtering
  services?: string[];
  supportWorkerCategories?: string[];
  languages?: string[];

  // Demographics
  gender?: string;
  ageRange?: string;

  // Availability
  hasVehicle?: string;

  // Verification status
  verifiedOnly?: boolean;
}

export interface WorkerSearchResult {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  services: string[];
  supportWorkerCategories: string[];
  languages: string[];
  experience: string;
  introduction: string;
  hasVehicle: string;
  photos: any;
  distance?: number; // Distance from search location in km
}

/**
 * Search for workers based on location and filters
 *
 * @param filters - Search filters including location and preferences
 * @returns Array of workers sorted by distance
 *
 * @example
 * const workers = await searchWorkers({
 *   latitude: -33.8688,
 *   longitude: 151.2093,
 *   radiusKm: 20,
 *   services: ['Personal Care', 'Community Access'],
 *   verifiedOnly: true
 * });
 */
export async function searchWorkers(
  filters: WorkerSearchFilters
): Promise<WorkerSearchResult[]> {
  const {
    latitude,
    longitude,
    radiusKm = 50, // Default 50km radius
    services,
    supportWorkerCategories,
    languages,
    gender,
    ageRange,
    hasVehicle,
    verifiedOnly = true, // Default to verified workers only
  } = filters;

  // ============================================
  // BUILD QUERY FILTERS
  // ============================================

  const where: any = {
    // Only show published profiles
    isPublished: true,

    // Only show verified workers if requested
    ...(verifiedOnly && {
      verificationStatus: 'APPROVED',
    }),

    // Filter by services
    ...(services &&
      services.length > 0 && {
        services: {
          hasSome: services,
        },
      }),

    // Filter by support worker categories
    ...(supportWorkerCategories &&
      supportWorkerCategories.length > 0 && {
        supportWorkerCategories: {
          hasSome: supportWorkerCategories,
        },
      }),

    // Filter by languages
    ...(languages &&
      languages.length > 0 && {
        languages: {
          hasSome: languages,
        },
      }),

    // Filter by gender
    ...(gender && {
      gender: gender,
    }),

    // Filter by age range
    ...(ageRange && {
      age: ageRange,
    }),

    // Filter by vehicle availability
    ...(hasVehicle && {
      hasVehicle: hasVehicle,
    }),
  };

  // ============================================
  // OPTIMIZE WITH BOUNDING BOX (if location provided)
  // ============================================

  if (latitude !== undefined && longitude !== undefined) {
    // Use bounding box to filter workers BEFORE distance calculation
    // This reduces the number of workers we need to calculate distance for
    const boundingBox = calculateBoundingBox(latitude, longitude, radiusKm);

    where.latitude = {
      gte: boundingBox.minLat,
      lte: boundingBox.maxLat,
    };

    where.longitude = {
      gte: boundingBox.minLon,
      lte: boundingBox.maxLon,
    };
  }

  // ============================================
  // FETCH WORKERS
  // ============================================

  const workers = await authPrisma.workerProfile.findMany({
    where,
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      location: true,
      latitude: true,
      longitude: true,
      city: true,
      state: true,
      postalCode: true,
      services: true,
      supportWorkerCategories: true,
      languages: true,
      experience: true,
      introduction: true,
      hasVehicle: true,
      photos: true,
    },
  });

  // ============================================
  // CALCULATE DISTANCES & FILTER BY RADIUS
  // ============================================

  let results: WorkerSearchResult[] = workers.map((worker) => ({
    ...worker,
    distance: undefined,
  }));

  if (latitude !== undefined && longitude !== undefined) {
    // Calculate exact distance for each worker
    const workersWithDistance = workers
      .map((worker) => {
        if (worker.latitude === null || worker.longitude === null) {
          return null; // Skip workers without coordinates
        }

        const distance = calculateDistance(
          latitude,
          longitude,
          worker.latitude,
          worker.longitude
        );

        return {
          ...worker,
          distance,
        };
      })
      .filter((worker) => {
        // Filter out workers without coordinates
        if (!worker) return false;

        // Filter by exact radius
        if (worker.distance === undefined) return false;
        return worker.distance <= radiusKm;
      }) as WorkerSearchResult[];

    results = workersWithDistance.sort((a, b) => {
      // Sort by distance (closest first)
      const distanceA = a.distance ?? Infinity;
      const distanceB = b.distance ?? Infinity;
      return distanceA - distanceB;
    });
  }

  console.log(`🔍 Found ${results.length} workers within ${radiusKm}km`);

  return results;
}

/**
 * Get worker by ID (for detail view)
 *
 * @param workerId - Worker profile ID
 * @returns Worker profile or null
 */
export async function getWorkerById(workerId: string) {
  return await authPrisma.workerProfile.findUnique({
    where: { id: workerId },
    include: {
      user: {
        select: {
          email: true,
          createdAt: true,
        },
      },
    },
  });
}

/**
 * Get worker photos as array of URLs
 *
 * @param workerId - Worker profile ID
 * @returns Array of photo URLs
 */
export async function getWorkerPhotos(workerId: string): Promise<string[]> {
  const worker = await authPrisma.workerProfile.findUnique({
    where: { id: workerId },
    select: {
      photos: true,
    },
  });

  // Photos are stored as JSON array
  if (worker?.photos && Array.isArray(worker.photos)) {
    return worker.photos as string[];
  }

  return [];
}

/**
 * Get workers by state (for browsing by region)
 *
 * @param state - Australian state code (NSW, VIC, QLD, etc.)
 * @returns Array of workers in that state
 */
export async function getWorkersByState(state: string) {
  return await authPrisma.workerProfile.findMany({
    where: {
      state: state.toUpperCase(),
      isPublished: true,
      verificationStatus: 'APPROVED',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      location: true,
      city: true,
      state: true,
      services: true,
      supportWorkerCategories: true,
      introduction: true,
      photos: true,
    },
    orderBy: {
      city: 'asc',
    },
  });
}

/**
 * Get workers by city (for browsing by location)
 *
 * @param city - City name
 * @returns Array of workers in that city
 */
export async function getWorkersByCity(city: string) {
  return await authPrisma.workerProfile.findMany({
    where: {
      city: {
        equals: city,
        mode: 'insensitive', // Case-insensitive search
      },
      isPublished: true,
      verificationStatus: 'APPROVED',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      location: true,
      city: true,
      state: true,
      services: true,
      supportWorkerCategories: true,
      introduction: true,
      photos: true,
    },
  });
}

/**
 * Get nearby workers count without fetching full data
 * Useful for showing "X workers available in your area"
 *
 * @param latitude - Search latitude
 * @param longitude - Search longitude
 * @param radiusKm - Search radius in kilometers
 * @returns Number of workers in radius
 */
export async function getNearbyWorkersCount(
  latitude: number,
  longitude: number,
  radiusKm: number = 20
): Promise<number> {
  const boundingBox = calculateBoundingBox(latitude, longitude, radiusKm);

  const count = await authPrisma.workerProfile.count({
    where: {
      isPublished: true,
      verificationStatus: 'APPROVED',
      latitude: {
        gte: boundingBox.minLat,
        lte: boundingBox.maxLat,
      },
      longitude: {
        gte: boundingBox.minLon,
        lte: boundingBox.maxLon,
      },
    },
  });

  return count;
}
