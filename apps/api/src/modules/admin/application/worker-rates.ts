// worker-rates (2026-11-20): one worker's rates for the admin's Show profile. One statement; 404 when no worker has
// that id; every field null when the worker has not saved rates.
import type { RatesRead } from '@remonta/api-contract'
import { ApiError } from '../../../platform/errors'
import type { Db } from '../../../platform/persistence/db'
import { RATES_SELECT, ratesView, type RatesRow } from '../../worker/application/sections/rates'

export async function getWorkerRates(deps: { db: Db }, workerId: string): Promise<RatesRead> {
  const profile = await deps.db.workerProfile.findUnique({ where: { id: workerId }, select: { rates: { select: RATES_SELECT } } })
  if (!profile) throw new ApiError(404, 'worker not found')
  return { rates: ratesView(profile.rates as RatesRow | null) }
}
