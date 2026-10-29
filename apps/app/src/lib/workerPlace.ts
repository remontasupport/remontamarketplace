// Where a worker is, for every screen that shows it (search-locations U4, FR-7r): their HOME
// worker_locations row's suburb, and nothing else. The legacy worker_profiles columns
// (location, city, state, postalCode, latitude, longitude) are no longer read; they are dropped
// in U7. A worker with no HOME row has no place: the screens show their empty case.
import { localityLabel } from "@remonta/schemas/data/locality";

/** Spread into a workerProfile `select`. */
export const HOME_PLACE_SELECT = {
  locations: {
    where: { kind: "HOME" },
    take: 1,
    select: { locality: { select: { suburb: true, state: true, postcode: true } } },
  },
} as const;

export interface WorkerPlace {
  city: string | null;
  state: string | null;
  postalCode: string | null;
  /** "Parramatta, NSW 2150" */
  location: string | null;
}

type HomeRows = { locations: ReadonlyArray<{ locality: { suburb: string; state: string; postcode: string } }> };

/** The read's HOME row under the field names the screens already use. */
export function homePlaceOf(row: HomeRows): WorkerPlace {
  const l = row.locations[0]?.locality;
  if (!l) return { city: null, state: null, postalCode: null, location: null };
  return { city: l.suburb, state: l.state, postalCode: l.postcode, location: localityLabel(l, ", ") };
}
