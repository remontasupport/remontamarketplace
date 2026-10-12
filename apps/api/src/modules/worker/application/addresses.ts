// The two addresses (U2 R3, L4; D8). The home address is private: two columns on the
// profile and nothing else (R3.2). The service area is where clients find the worker: the
// HOME worker_locations row placed by the locations module's placeHome with source
// ONBOARDING, and the legacy location columns written exactly as the sign-up writes them
// (R3.5), so every reader of those columns -- the client search included -- follows.
import type { HomeAddress, HomeAddressInput, ServiceAreaInput } from '@remonta/api-contract'
import { ApiError } from '../../../platform/errors'
import type { Tx } from '../../../platform/persistence/db'
import { localityLabel, placeHome } from '../../locations/domain/home'

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
  const placed = placeHome(locality, 'ONBOARDING', body.travelRadiusKm)
  if (!placed.ok) throw new ApiError(400, 'retired locality', UNKNOWN_SUBURB)
  const { home, legacy } = placed
  // One HOME row per worker (the partial unique index): update it in place, or create the first.
  const existing = await tx.workerLocation.findFirst({ where: { workerProfileId: profileId, kind: 'HOME' }, select: { id: true } })
  const data = { localityId: home.localityId, latitude: home.latitude, longitude: home.longitude, travelRadiusKm: home.travelRadiusKm, precision: home.precision, source: home.source }
  if (existing) await tx.workerLocation.update({ where: { id: existing.id }, data, select: { id: true } })
  else await tx.workerLocation.create({ data: { workerProfileId: profileId, kind: 'HOME', ...data }, select: { id: true } })
  await tx.workerProfile.update({ where: { id: profileId }, data: legacy, select: { id: true } })
  return { localityId: locality.id, label: localityLabel(locality, ', '), travelRadiusKm: home.travelRadiusKm, precision: 'LOCALITY' }
}
