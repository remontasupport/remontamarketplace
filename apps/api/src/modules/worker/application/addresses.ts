// The two addresses (U2 R3, L4; D8). The home address is private: two columns on the
// profile and nothing else (R3.2). The service area is where clients find the worker: the
// HOME worker_locations row placed by the locations module's placeHome with source
// ONBOARDING, and nothing else: the legacy location columns are no longer written
// (search-locations FR-10).
import type { HomeAddress, HomeAddressInput, ServiceAreaInput } from '@remonta/api-contract'
import { localityLabel } from '@remonta/schemas/data/locality'
import { ApiError } from '../../../platform/errors'
import type { Tx } from '../../../platform/persistence/db'
import { DEFAULT_TRAVEL_RADIUS_KM, placeHome } from '../../locations/domain/home'

const UNKNOWN_SUBURB = { localityId: ['Unknown suburb'] }

export async function writeHomeAddress(tx: Tx, profileId: string, body: HomeAddressInput): Promise<HomeAddress> {
  const locality = await tx.auLocality.findUnique({ where: { id: body.localityId }, select: { id: true, suburb: true, state: true, postcode: true, retiredAt: true } })
  if (!locality || locality.retiredAt) throw new ApiError(400, 'unknown or retired locality', UNKNOWN_SUBURB)
  await tx.workerProfile.update({ where: { id: profileId }, data: { homeStreetLine: body.streetLine, homeLocalityId: locality.id }, select: { id: true } })
  return { streetLine: body.streetLine, localityId: locality.id, suburb: locality.suburb, state: locality.state, postcode: locality.postcode }
}

export interface ServiceAreaView {
  localityId: number
  label: string
  travelRadiusKm: number
  precision: 'LOCALITY' | 'ADDRESS'
}

export async function writeServiceArea(tx: Tx, profileId: string, body: ServiceAreaInput): Promise<ServiceAreaView> {
  const locality = await tx.auLocality.findUnique({ where: { id: body.localityId }, select: { id: true, suburb: true, state: true, postcode: true, latitude: true, longitude: true, retiredAt: true } })
  if (!locality) throw new ApiError(400, 'unknown locality', UNKNOWN_SUBURB)
  // One HOME row per worker (the partial unique index): update it in place, or create the first.
  const existing = await tx.workerLocation.findFirst({ where: { workerProfileId: profileId, kind: 'HOME' }, select: { id: true, travelRadiusKm: true } })
  // The page no longer asks for the distance (user, 2026-10-21): a save without one keeps the stored value.
  const placed = placeHome(locality, 'ONBOARDING', body.travelRadiusKm ?? existing?.travelRadiusKm ?? DEFAULT_TRAVEL_RADIUS_KM)
  if (!placed.ok) throw new ApiError(400, 'retired locality', UNKNOWN_SUBURB)
  const { home } = placed
  const data = { localityId: home.localityId, latitude: home.latitude, longitude: home.longitude, travelRadiusKm: home.travelRadiusKm, precision: home.precision, source: home.source }
  if (existing) await tx.workerLocation.update({ where: { id: existing.id }, data, select: { id: true } })
  else await tx.workerLocation.create({ data: { workerProfileId: profileId, kind: 'HOME', ...data }, select: { id: true } })
  return { localityId: locality.id, label: localityLabel(locality, ', '), travelRadiusKm: home.travelRadiusKm, precision: 'LOCALITY' }
}
