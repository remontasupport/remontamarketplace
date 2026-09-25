import { defineConfig } from 'tsup'

// ESM bundles. The workspace packages (@remonta/*) export TypeScript source, so
// they are bundled in; npm dependencies stay external. The Prisma client (#db) is
// external too: it locates its query engine relative to its own files.
// emitDecoratorMetadata in tsconfig makes tsup transpile with SWC, which Nest's
// constructor injection needs (esbuild cannot emit decorator metadata).
// The password-hash worker is its own entry: worker threads load a file by path.
export default defineConfig({
  entry: { main: 'src/main.ts', 'hash-worker': 'src/platform/security/hash-worker.js' },
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  clean: true,
  noExternal: [/^@remonta\//],
  external: ['#db'],
})
