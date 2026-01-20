/**
 * Location Parser & Geocoder for Worker Profiles
 *
 * Extracts city, state, postal code from location string
 * and geocodes to latitude/longitude for distance-based search
 */

import { geocodeAddress } from './geocoding';

/**
 * Australian state mapping
 */
const STATE_MAPPING: { [key: string]: string } = {
  // New South Wales
  'new south wales': 'NSW',
  'newsouthwales': 'NSW',
  'nsw': 'NSW',

  // Victoria
  'victoria': 'VIC',
  'vic': 'VIC',

  // Queensland
  'queensland': 'QLD',
  'qld': 'QLD',

  // South Australia
  'south australia': 'SA',
  'southaustralia': 'SA',
  'sa': 'SA',

  // Western Australia
  'western australia': 'WA',
  'westernaustralia': 'WA',
  'wa': 'WA',

  // Tasmania
  'tasmania': 'TAS',
  'tas': 'TAS',

  // Northern Territory
  'northern territory': 'NT',
  'northernterritory': 'NT',
  'nt': 'NT',

  // Australian Capital Territory
  'australian capital territory': 'ACT',
  'australiancapitalterritory': 'ACT',
  'act': 'ACT',
};

interface ParsedLocation {
  city: string | null;
  state: string | null;
  postalCode: string | null;
}

/**
 * Parse location string to extract city, state, and postal code
 *
 * @param location - Location string (e.g., "Sydney, NSW 2000", "Melbourne", "Brisbane 4000")
 * @returns Parsed location components
 *
 * @example
 * parseLocation("Sydney, NSW 2000")
 * // Returns: { city: "Sydney", state: "NSW", postalCode: "2000" }
 *
 * parseLocation("Melbourne")
 * // Returns: { city: "Melbourne", state: null, postalCode: null }
 */
export function parseLocation(location: string): ParsedLocation {
  if (!location || !location.trim()) {
    return { city: null, state: null, postalCode: null };
  }

  const locationInput = location.trim();

  // Patterns
  const stateAbbrevPattern = /\b(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\b/i;
  const stateFullPattern = /\b(New South Wales|Victoria|Queensland|South Australia|Western Australia|Tasmania|Northern Territory|Australian Capital Territory)\b/i;
  const postalPattern = /\b\d{3,4}\b/; // Australian postal codes are 3-4 digits (800-9999)

  // Extract state
  const stateAbbrevMatch = locationInput.match(stateAbbrevPattern);
  const stateFullMatch = locationInput.match(stateFullPattern);
  const postalMatch = locationInput.match(postalPattern);

  let normalizedState: string | null = null;

  if (stateAbbrevMatch) {
    normalizedState = stateAbbrevMatch[0].toUpperCase();
  } else if (stateFullMatch) {
    const fullStateName = stateFullMatch[0].toLowerCase().replace(/\s+/g, '');
    normalizedState = STATE_MAPPING[fullStateName] || stateFullMatch[0];
  } else {
    // Check if entire input is a state name
    const inputLower = locationInput.toLowerCase().replace(/\s+/g, '');
    if (STATE_MAPPING[inputLower]) {
      normalizedState = STATE_MAPPING[inputLower];
    }
  }

  // Extract postal code
  const postalCode = postalMatch ? postalMatch[0] : null;

  // Extract city (everything that's not state or postal code)
  let city = locationInput
    .replace(stateAbbrevPattern, '')
    .replace(stateFullPattern, '')
    .replace(postalPattern, '')
    .replace(/,/g, '') // Remove commas
    .trim()
    .replace(/\s+/g, ' '); // Normalize spaces

  // If city is empty, use the original location
  if (!city) {
    city = locationInput;
  }

  return {
    city: city || null,
    state: normalizedState,
    postalCode: postalCode,
  };
}

/**
 * Geocode worker location and return all location data
 *
 * @param location - Location string from worker registration
 * @returns Complete location data with coordinates
 *
 * @example
 * const locationData = await geocodeWorkerLocation("Sydney, NSW 2000");
 * // Returns:
 * // {
 * //   city: "Sydney",
 * //   state: "NSW",
 * //   postalCode: "2000",
 * //   latitude: -33.8688,
 * //   longitude: 151.2093
 * // }
 */
export async function geocodeWorkerLocation(location: string) {
  // Parse location components
  const parsed = parseLocation(location);

  // Geocode the full location string
  const geocoded = await geocodeAddress(location);

  return {
    city: parsed.city,
    state: parsed.state,
    postalCode: parsed.postalCode,
    latitude: geocoded?.latitude || null,
    longitude: geocoded?.longitude || null,
  };
}
