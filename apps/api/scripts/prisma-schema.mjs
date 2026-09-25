// Derives apps/api's Prisma schema from packages/db, the only schema source.
//
// Why a copy rather than a second generator in packages/db (S1 plan, step 1
// deviation): apps/app's Vercel build runs `prisma generate` on the shared schema,
// so a second generator there would also run on Vercel -- the bundling path that
// failed five times in U5. The copy changes only the generator output, so the
// models cannot drift. Output is gitignored and rebuilt on every build and test run.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = join(here, '../../../packages/db/prisma/schema.prisma')
const target = join(here, '../prisma/schema.prisma')

const schema = await readFile(source, 'utf8')
const output = /^(\s*output\s*=\s*)"[^"]*"/m
if (!output.test(schema)) throw new Error('packages/db schema has no generator output line; update scripts/prisma-schema.mjs')
const derived =
  '// GENERATED from packages/db/prisma/schema.prisma by apps/api/scripts/prisma-schema.mjs.\n' +
  '// Do not edit; change the source schema.\n' +
  schema.replace(output, '$1"../generated/db"')
await mkdir(dirname(target), { recursive: true })
await writeFile(target, derived, 'utf8')
