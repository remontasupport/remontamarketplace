// Suburb suggestions from apps/api (GET /v1/localities, public, au_localities) for every suburb picker in apps/app:
// the sign-up and profile fields (useLocalitySearch) and the dashboards' own pickers (suburbSuggestions). It replaced
// the app's /api/suburbs route, which read the same table straight from the database (follow-up 43, 2026-10-29).
import { createClient, registrationContract, type localitySchema } from '@remonta/api-contract'
import type * as z from 'zod'

export type Locality = z.infer<typeof localitySchema>

/** At most 10 current suburbs matching `q`; none for fewer than two characters, a missing base URL or a failed call. */
export async function localitySuggestions(q: string, apiBaseUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL): Promise<Locality[]> {
  if (!apiBaseUrl || q.trim().length < 2) return []
  const r = await createClient(registrationContract, { baseUrl: apiBaseUrl }).searchLocalities({ query: { q } })
  return r.ok ? r.body.localities : []
}

/** The shape the dashboards' pickers render ("Parramatta, NSW 2150"). */
export interface Suburb {
  id: number
  name: string
  postcode: string
  state: { abbreviation: string }
}

export async function suburbSuggestions(q: string): Promise<Suburb[]> {
  return (await localitySuggestions(q)).map((l) => ({ id: l.id, name: l.suburb, postcode: l.postcode, state: { abbreviation: l.state } }))
}
