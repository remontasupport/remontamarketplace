// Test helpers that read this app's own source (privacy.test.ts, workerPlace.test.ts). Not imported by the app.
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

export const SRC = join(__dirname, '..')

/** Every non-test .ts/.tsx file under `dir` (relative to src), absolute paths. */
export function filesUnder(dir: string): string[] {
  const abs = join(SRC, dir)
  let entries: string[]
  try {
    entries = readdirSync(abs)
  } catch {
    return []
  }
  return entries.flatMap((e) => {
    const p = join(abs, e)
    return statSync(p).isDirectory() ? filesUnder(relative(SRC, p)) : /\.(ts|tsx)$/.test(e) && !/\.test\./.test(e) ? [p] : []
  })
}

/** The text between the bracket at `open` and its match. */
function balanced(src: string, open: number, [o, c]: '()' | '{}'): string {
  let depth = 1
  let i = open + 1
  while (i < src.length && depth > 0) {
    if (src[i] === o) depth++
    else if (src[i] === c) depth--
    i++
  }
  return src.slice(open + 1, i - 1)
}

/** The argument text of each `workerProfile.find*(` call, by balanced parentheses. */
export function workerReads(src: string): string[] {
  const out: string[] = []
  const re = /workerProfile\.(findMany|findUnique|findUniqueOrThrow|findFirst|findFirstOrThrow)\(/g
  for (let m = re.exec(src); m; m = re.exec(src)) out.push(balanced(src, m.index + m[0].length - 1, '()'))
  return out
}

/** The keys at the top level of a read's `select: { ... }` (nested relation selects excluded). */
export function topLevelSelectKeys(readArgs: string): string[] {
  const m = /\bselect:\s*\{/.exec(readArgs)
  if (!m) return []
  const body = balanced(readArgs, m.index + m[0].length - 1, '{}')
  let flat = ''
  let depth = 0
  for (const ch of body) {
    if (ch === '{') depth++
    if (depth === 0) flat += ch
    if (ch === '}') depth--
  }
  return [...flat.matchAll(/(?:^|[,\s])(\w+)\s*:/g)].map((k) => k[1]!)
}
