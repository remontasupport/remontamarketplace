// Shared plumbing for the step 10 backfill scripts: flags, the database, the report file.
//
//   --apply           write (default: dry run, nothing written)
//   --report=<file>   also write the full report as JSON (the console shows a sample)
//   --batch=<n>       page size (default 500)
//
// Needs DIRECT_DATABASE_URL or AUTH_DATABASE_URL, e.g. from apps/api/.env:
//   node --env-file=.env --import tsx scripts/backfill-worker-locations.ts
import { writeFile } from 'node:fs/promises'
import { createDb } from '../src/platform/persistence/db'

export function flag(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit?.slice(name.length + 3)
}

export async function runBackfill<R extends { failed: unknown[] }>(
  name: string,
  run: (db: ReturnType<typeof createDb>, opts: { apply: boolean; batch: number; onProgress: (n: number) => void }) => Promise<R>,
  format: (r: R) => string,
): Promise<void> {
  const url = process.env.DIRECT_DATABASE_URL || process.env.AUTH_DATABASE_URL
  if (!url) throw new Error('set DIRECT_DATABASE_URL (or AUTH_DATABASE_URL)')
  const apply = process.argv.includes('--apply')
  const batch = Number(flag('batch') ?? 500)
  if (!Number.isInteger(batch) || batch < 1) throw new Error('--batch must be a positive integer')
  const db = createDb(url, { poolSize: 2, poolTimeoutS: 30 })
  try {
    console.log(`${name}: database ${new URL(url).host}, ${apply ? 'APPLY' : 'dry run'}`)
    const report = await run(db, { apply, batch, onProgress: (n) => process.stderr.write(`  examined ${n}\r`) })
    process.stderr.write('\n')
    console.log(format(report))
    const out = flag('report')
    if (out) {
      await writeFile(out, JSON.stringify(report, null, 2))
      console.log(`full report: ${out}`)
    }
    if (report.failed.length) process.exitCode = 1
  } finally {
    await db.$disconnect()
  }
}
