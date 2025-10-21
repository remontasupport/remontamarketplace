/**
 * Worker Search API Endpoint
 *
 * Allows clients to search for workers by location and filters
 *
 * GET /api/workers/search
 *
 * Query params:
 * - lat: Latitude (required for distance search)
 * - lon: Longitude (required for distance search)
 * - radius: Search radius in km (default: 50)
 * - services: Comma-separated service types
 * - categories: Comma-separated support worker categories
 * - languages: Comma-separated languages
 * - gender: Gender filter
 * - age: Age range
 * - vehicle: Has vehicle (Yes/No)
 * - verified: Only verified workers (default: true)
 *
 * @example
 * GET /api/workers/search?lat=-33.8688&lon=151.2093&radius=20&services=Personal Care,Community Access&verified=true
 */

import { NextResponse } from 'next/server';
import { searchWorkers, WorkerSearchFilters } from '@/lib/worker-search';
import { geocodeAddress } from '@/lib/geocoding';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ============================================
    // EXTRACT QUERY PARAMETERS
    // ============================================

    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const location = searchParams.get('location'); // Alternative: location string
    const radius = searchParams.get('radius');
    const services = searchParams.get('services');
    const categories = searchParams.get('categories');
    const languages = searchParams.get('languages');
    const gender = searchParams.get('gender');
    const age = searchParams.get('age');
    const vehicle = searchParams.get('vehicle');
    const verified = searchParams.get('verified');

    // ============================================
    // GEOCODE LOCATION (if location string provided)
    // ============================================

    let latitude: number | undefined;
    let longitude: number | undefined;

    if (lat && lon) {
      // Use provided coordinates
      latitude = parseFloat(lat);
      longitude = parseFloat(lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { error: 'Invalid latitude or longitude' },
          { status: 400 }
        );
      }
    } else if (location) {
      // Geocode location string
      console.log('🗺️ Geocoding location:', location);

      try {
        const geocoded = await geocodeAddress(location);

        if (!geocoded) {
          return NextResponse.json(
            { error: 'Could not geocode location. Please provide valid address.' },
            { status: 400 }
          );
        }

        latitude = geocoded.latitude;
        longitude = geocoded.longitude;

        console.log('✅ Location geocoded:', { latitude, longitude });
      } catch (geocodeError) {
        console.error('❌ Geocoding error:', geocodeError);
        return NextResponse.json(
          { error: 'Failed to geocode location' },
          { status: 400 }
        );
      }
    }

    // ============================================
    // BUILD SEARCH FILTERS
    // ============================================

    const filters: WorkerSearchFilters = {
      latitude,
      longitude,
      radiusKm: radius ? parseFloat(radius) : 50,
      services: services ? services.split(',').map((s) => s.trim()) : undefined,
      supportWorkerCategories: categories
        ? categories.split(',').map((c) => c.trim())
        : undefined,
      languages: languages
        ? languages.split(',').map((l) => l.trim())
        : undefined,
      gender: gender || undefined,
      ageRange: age || undefined,
      hasVehicle: vehicle || undefined,
      verifiedOnly: verified !== 'false', // Default true
    };

    // ============================================
    // SEARCH WORKERS
    // ============================================

    const workers = await searchWorkers(filters);

    // ============================================
    // RESPONSE
    // ============================================

    return NextResponse.json({
      success: true,
      count: workers.length,
      filters: {
        location: location || `${latitude}, ${longitude}`,
        radius: filters.radiusKm,
        services: filters.services,
        categories: filters.supportWorkerCategories,
        verifiedOnly: filters.verifiedOnly,
      },
      workers,
    });
  } catch (error: any) {
    console.error('❌ Worker search error:', error);

    return NextResponse.json(
      {
        error: 'Failed to search workers',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
