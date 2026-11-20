// worker-rates (2026-11-20): the worker's own rates (Services -> Rates), one `worker_rates` row per worker, in cents.
// Read and written apart from the profile read (the deployed app parses that response strictly), as the tour and the
// tools. Not part of completion. The admin's read of one worker (modules/admin) shares `ratesView`.
import { RATE_NAMES, toCents, toDollars, type RateName, type RatesBody, type RatesRead, type RatesView } from '@remonta/api-contract'
import type { FastifyBaseLogger } from 'fastify'
import type { Principal } from '../../../../platform/auth/authenticator'
import { readTransaction, type Db, type Tx } from '../../../../platform/persistence/db'
import { PROFILE_READ_STATEMENT_TIMEOUT_MS } from '../../persistence/profile-read'
import { profileNotFound } from '../own-profile'

type CentsColumn = `${RateName}Cents`
export type RatesRow = Record<CentsColumn, number | null> & { updatedAt: Date }

const column = (name: RateName): CentsColumn => `${name}Cents`

/** The row's columns, for a Prisma select. */
export const RATES_SELECT = { ...Object.fromEntries(RATE_NAMES.map((n) => [column(n), true])), updatedAt: true } as Record<CentsColumn | 'updatedAt', true>

/** A row (or none) -> dollars; every field null when the worker has not saved rates. */
export function ratesView(row: RatesRow | null): RatesView {
  const rates = Object.fromEntries(RATE_NAMES.map((n) => [n, toDollars(row?.[column(n)] ?? null)])) as Record<RateName, number | null>
  return { ...rates, updatedAt: row ? row.updatedAt.toISOString() : null }
}

/** The body -> the row's columns, in cents. */
export function toColumns(body: RatesBody): Record<CentsColumn, number | null> {
  return Object.fromEntries(RATE_NAMES.map((n) => [column(n), body[n] === null ? null : toCents(body[n])])) as Record<CentsColumn, number | null>
}

/** GET /v1/worker/rates: one statement by the profile's unique userId; no profile is the profile read's 404. */
export async function readRates(db: Db, principal: Principal, log: FastifyBaseLogger): Promise<RatesRead> {
  const profile = await readTransaction(db, PROFILE_READ_STATEMENT_TIMEOUT_MS, (tx) =>
    tx.workerProfile.findUnique({ where: { userId: principal.userId }, select: { rates: { select: RATES_SELECT } } }),
  )
  if (!profile) throw profileNotFound(principal, log)
  return { rates: ratesView(profile.rates as RatesRow | null) }
}

/** PUT /v1/worker/rates, inside replaceSection's transaction: all six replaced in one upsert. */
export async function writeRates(tx: Tx, profileId: string, body: RatesBody): Promise<RatesView> {
  const data = toColumns(body)
  const row = await tx.workerRates.upsert({ where: { workerProfileId: profileId }, create: { workerProfileId: profileId, ...data }, update: data, select: RATES_SELECT })
  return ratesView(row as RatesRow)
}
