// The au_localities candidates the legacy matcher (domain/legacy-match.ts) chooses
// from, for the reconciler and the step 10 backfill: current rows only, fetched by
// postcode and cached for the run.
import type { Db } from '../../platform/persistence/db'
import { normalisePostcode, type Candidate } from './domain/legacy-match'

export type CandidatesByPostcode = (postcode: string) => Promise<Candidate[]>

/** A cache over au_localities, current rows only, keyed by postcode. */
export function localityCandidates(db: Db): CandidatesByPostcode {
  const cache = new Map<string, Candidate[]>()
  return async (postcode) => {
    let c = cache.get(postcode)
    if (!c) {
      c = await db.auLocality.findMany({ where: { postcode, retiredAt: null }, select: { id: true, searchName: true, state: true, postcode: true } })
      cache.set(postcode, c)
    }
    return c
  }
}

/** The postcode a legacy `location` string ends with ("Darwin, NT 800" -> "0800"), or null. */
export function postcodeInLocation(location: string | null | undefined): string | null {
  return normalisePostcode(location ? /(\d{3,4})\s*$/.exec(location)?.[1] : undefined)
}

/** Candidates for every postcode the legacy columns mention, so the matcher sees them all. */
export async function candidatePool(
  p: { location: string | null; postalCode: string | null },
  candidatesFor: CandidatesByPostcode,
): Promise<(postcode: string) => Candidate[]> {
  const postcodes = new Set<string>()
  const fromLocation = postcodeInLocation(p.location)
  if (fromLocation) postcodes.add(fromLocation)
  const fromColumn = normalisePostcode(p.postalCode)
  if (fromColumn) postcodes.add(fromColumn)
  const pool = new Map<string, Candidate[]>()
  for (const pc of postcodes) pool.set(pc, await candidatesFor(pc))
  return (pc) => pool.get(pc) ?? []
}
