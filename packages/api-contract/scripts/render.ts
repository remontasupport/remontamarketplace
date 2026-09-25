import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { contracts, toOpenApi } from '../src/index'

export const OPENAPI_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'openapi.json')

export function renderOpenApi(): string {
  return JSON.stringify(toOpenApi(contracts, { title: 'Remonta API', version: '1' }), null, 2) + '\n'
}
