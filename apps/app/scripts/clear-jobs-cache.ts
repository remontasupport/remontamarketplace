/**
 * Clear the shared active-jobs cache key.
 *
 * The worker dashboard reads jobs through getOrFetch(CACHE_KEYS.activeJobs()) —
 * ONE Redis entry shared by every worker, with a 2-hour TTL. Insert a row
 * straight into Postgres and the dashboard keeps serving the cached list until
 * that key is deleted, which looks exactly like the insert having failed.
 *
 * WHY THIS SCRIPT DOES NOT USE invalidateCache() FROM src/lib/redis
 *
 * It did, and it silently did nothing. That helper is written for the running
 * app, where Next has already populated process.env:
 *
 *   const redis = process.env.UPSTASH_REDIS_REST_URL && ... ? new Redis(...) : null
 *   export async function invalidateCache(...keys) {
 *     if (!redis || keys.length === 0) return       // <- silent no-op
 *     try { await redis.del(...keys) } catch {}     // <- silent failure
 *   }
 *
 * tsx does NOT load .env. Prisma loads it on its own, which is why the seed
 * script's `list` command works and prints the right database — so it is easy
 * to assume the environment is loaded when it is not. Upstash gets no such
 * help: redis was null, invalidateCache returned instantly, and the script
 * reported success.
 *
 * So this reads .env itself and talks to the Upstash REST API directly, and it
 * prints the API's actual response — 1 for a key deleted, 0 for a key that was
 * not there. No silent success.
 *
 * Usage:  npx tsx scripts/clear-jobs-cache.ts
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Minimal .env reader. Avoids a dependency for two variables. */
function loadEnv(file: string): Record<string, string> {
  const out: Record<string, string> = {}
  let text: string
  try {
    text = readFileSync(join(process.cwd(), file), 'utf8')
  } catch {
    return out
  }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (!m) continue
    out[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return out
}

async function main() {
  // .env.local wins over .env, matching Next's own precedence.
  const env = { ...loadEnv('.env'), ...loadEnv('.env.local') }
  const url = env.UPSTASH_REDIS_REST_URL
  const token = env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in .env/.env.local.')
    console.error('Run this from apps/app, where those files live.')
    process.exit(1)
  }

  // BOTH keys, always.
  //
  // CACHE_KEYS.activeJobs() is `active_jobs:${CACHE_VERSION}`. NewsSliderAsync
  // appends ":fake-only" when SHOW_ONLY_FAKE_JOBS is set, so the filtered and
  // unfiltered lists never share an entry. Clearing only one means adding a
  // seeded row, clearing the cache, and seeing nothing change — because the
  // entry actually being read was the other one.
  const keys = ['active_jobs:v3', 'active_jobs:v3:fake-only']

  console.log('upstash :', new URL(url).host)

  let anyDeleted = false

  for (const key of keys) {
    const res = await fetch(`${url}/del/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      console.error(`\nFAILED on ${key}: ${res.status} ${res.statusText}`)
      console.error(await res.text())
      process.exit(1)
    }

    const body = (await res.json()) as { result?: number }
    const deleted = body.result ?? 0
    if (deleted === 1) anyDeleted = true

    console.log(`  ${deleted === 1 ? 'deleted ' : 'absent  '} ${key}`)
  }

  console.log(
    anyDeleted
      ? '\nReload the dashboard — the next request queries Postgres.'
      : '\nNeither key was present. Either both were already cleared, or the cache was never populated.'
  )
}

main().catch((e) => {
  console.error('Failed:', e)
  process.exit(1)
})
