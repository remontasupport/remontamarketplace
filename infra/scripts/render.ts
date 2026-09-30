// Writes cloudrun/service.<stage>.yaml from lib/stages.ts, or with --check proves the
// committed files are exactly what the table renders (the drift gate in `quality`).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderYaml } from '../lib/render'
import { STAGES, type Stage } from '../lib/stages'

const here = dirname(fileURLToPath(import.meta.url))
export const outputPath = (stage: Stage) => join(here, '..', 'cloudrun', `service.${stage}.yaml`)

const check = process.argv.includes('--check')
let drift = 0
for (const stage of Object.keys(STAGES) as Stage[]) {
  const rendered = renderYaml(stage)
  const path = outputPath(stage)
  if (check) {
    const current = existsSync(path) ? readFileSync(path, 'utf8').replace(/\r\n/g, '\n') : ''
    if (current !== rendered) {
      drift++
      console.error(`[render] ${path} differs from lib/stages.ts -- run: pnpm --filter @remonta/infra run render`)
    }
  } else {
    writeFileSync(path, rendered, 'utf8')
    console.log(`[render] wrote ${path}`)
  }
}
if (check) {
  if (drift) process.exit(1)
  console.log('[render] cloudrun/service.*.yaml match lib/stages.ts')
}
