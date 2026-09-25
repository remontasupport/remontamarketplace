import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // SWC, not esbuild, so Nest's decorator metadata exists under test as in the build.
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    globals: false,
    // Database-backed suites share one local PostGIS database.
    fileParallelism: false,
  },
})
