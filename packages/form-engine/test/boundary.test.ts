// Proves P-7 rejects: a UI framework, the server or Node built-ins in src/.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('P-7 boundary rule', () => {
  it('rejects UI frameworks, the server, the database and Node built-ins in src/', async () => {
    const code = [
      "import React from 'react'",
      "import { View } from 'react-native'",
      "import { useForm } from 'react-hook-form'",
      "import { useRouter } from 'next/navigation'",
      "import { Controller } from '@nestjs/common'",
      "import { db } from '@remonta/db'",
      "import { readFile } from 'node:fs/promises'",
      'export { React, View, useForm, useRouter, Controller, db, readFile }',
    ].join('\n')
    const [r] = await new ESLint({ cwd: root }).lintText(code, { filePath: join(root, 'src/probe.ts') })
    const msgs = (r?.messages ?? []).filter((m) => m.ruleId === 'no-restricted-imports')
    expect(r?.messages.filter((m) => m.fatal)).toEqual([])
    expect(msgs).toHaveLength(7)
    expect(msgs.every((m) => m.message.includes('P-7:'))).toBe(true)
  })
})
