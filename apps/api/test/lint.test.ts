// Proves the "no Nest controllers" rule rejects: a controller would register a
// route that neither the pipeline nor the startup checks know about.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('lint: routes come only from the contract', () => {
  it('rejects importing Nest route decorators', async () => {
    const [r] = await new ESLint({ cwd: root }).lintText("import { Controller, Get, Injectable } from '@nestjs/common'\nexport { Controller, Get, Injectable }\n", {
      filePath: join(root, 'src/modules/probe.ts'),
    })
    const msgs = (r?.messages ?? []).filter((m) => m.ruleId === 'no-restricted-imports')
    expect(r?.messages.filter((m) => m.fatal)).toEqual([])
    expect(msgs.map((m) => m.message.match(/'(\w+)' import/)?.[1]).sort()).toEqual(['Controller', 'Get'])
  })
})
