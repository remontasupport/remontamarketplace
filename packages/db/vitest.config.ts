import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.test.ts'],
    // Same choice as apps/app: explicit imports, so tsc checks every test file.
    globals: false,
  },
})
