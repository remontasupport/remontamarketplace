import { defineConfig } from 'tsup'

// One ESM bundle. The workspace packages (@remonta/*) export TypeScript source, so
// they are bundled in; npm dependencies stay external. The Prisma client (#db) is
// external too: it locates its query engine relative to its own files.
// emitDecoratorMetadata in tsconfig makes tsup transpile with SWC, which Nest's
// constructor injection needs (esbuild cannot emit decorator metadata).
export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  clean: true,
  noExternal: [/^@remonta\//],
  external: ['#db'],
})
