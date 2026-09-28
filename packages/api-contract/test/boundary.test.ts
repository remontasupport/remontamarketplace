// Proves P-6 rejects: lints a fixture full of forbidden imports as if it were a
// file in src/. If the parser or the rule wiring ever breaks, this fails instead of
// the rule silently passing everything (the P-5 lesson).
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('P-6 boundary rule', () => {
  it('rejects every forbidden import in src/', async () => {
    const eslint = new ESLint({ cwd: root })
    const code = await readFile(join(root, 'test/fixtures/bad-imports.ts'), 'utf8')
    const [result] = await eslint.lintText(code, { filePath: join(root, 'src/probe.ts') })
    const messages = (result?.messages ?? []).filter((m) => m.ruleId === 'no-restricted-imports')
    expect(result?.messages.filter((m) => m.fatal)).toEqual([])
    expect(messages).toHaveLength(7)
    expect(messages.every((m) => m.message.includes('P-6:'))).toBe(true)
  })

  it('allows the contract’s own dependencies', async () => {
    const eslint = new ESLint({ cwd: root })
    const [result] = await eslint.lintText(
      "import * as z from 'zod'\nimport { workerRegistrationSchema } from '@remonta/schemas'\nexport { z, workerRegistrationSchema }\n",
      { filePath: join(root, 'src/probe.ts') },
    )
    expect(result?.messages).toEqual([])
  })
})
