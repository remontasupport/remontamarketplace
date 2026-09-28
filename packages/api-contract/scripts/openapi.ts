// pnpm --filter @remonta/api-contract openapi -- regenerates openapi.json.
// Commit the result; test/openapi.test.ts fails while the committed file drifts.
import { writeFile } from 'node:fs/promises'
import { OPENAPI_PATH, renderOpenApi } from './render'

await writeFile(OPENAPI_PATH, renderOpenApi(), 'utf8')
console.log(`wrote ${OPENAPI_PATH}`)
