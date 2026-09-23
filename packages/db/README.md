# `@remonta/db`

Owns the Prisma **schema** and **migrations** for the application database
(`AUTH_DATABASE_URL`, 24 models).

## What this package does not do yet, and why

**It exports no runtime code.** There is no `src/`, no client, no `index.ts`. That is not an
oversight, and it is a smaller package than the design describes — the reasoning is recorded here
rather than discovered later.

### The constraint

U8 answered **Q1=A**: the schema and migrations move here, but Prisma still *generates* into
`apps/app/src/generated/auth-client`.

That is forced by deployment. Vercel resolves `vercel.json`'s `includeFiles` relative to the
project **Root Directory**, which for the application is `apps/app`. A path of
`../../packages/db/**` lies outside that root and cannot be addressed. The generated client is
**~124 MB** including the `rhel-openssl-3.0.x` query engine, and U5 established across **five
consecutive failed deployments** that this platform fails at Prisma bundling in ways that produce
an empty build log and an "internal Vercel error" — with the root cause never established.

### The consequence

With the generated artifact living in `apps/app`, this package cannot export a client without
importing from its own consumer. A package depending on the app that depends on it is a cycle,
and a worse problem than the one it would solve.

So the honest shape for U8 is: **schema, migrations, and the Prisma CLI scripts that operate on
them.** The client instantiation — connection pooling, the singleton, the Neon cold-start retry —
stays in `apps/app/src/lib/auth-prisma.ts`, where it already works.

### What this means for U9

U9 builds the repository functions that are meant to live here. They will need the generated
client, which raises the same question in a form that cannot be deferred again. Three ways out,
none chosen yet:

1. **Generate into both locations** — `packages/db` for repositories to import, `apps/app` for
   Vercel to bundle. Duplicates 124 MB.
2. **Resolve the Vercel bundling question**, then move the artifact here properly. Needs the
   support ticket that has been an open follow-up since U5.
3. **Repositories import the client through a narrow interface** the app provides, inverting the
   dependency rather than duplicating the artifact.

Option 2 is the real fix. It should be attempted before U9 rather than during it.

## Usage

```bash
pnpm --filter @remonta/db run generate        # regenerate the client
pnpm --filter @remonta/db run migrate:status  # check migration state
pnpm --filter @remonta/db run migrate:deploy  # apply migrations
pnpm --filter @remonta/db run studio          # browse the database
```

These operate on the schema directly and require the environment variables described below. The
app's own `db:*` scripts do the same work but run from `apps/app`, where `.env` resolves — see
**Running these scripts locally**.

## Boundaries

**P-1**: `apps/web` must never import this package. Marketing holds no database access (D-35); it
reads worker data over HTTP. Enforced by `@remonta/config/eslint.boundaries.mjs` and by marketing's
manifest omitting the dependency.

## Running these scripts locally

The scripts in this package require `AUTH_DATABASE_URL` and `DIRECT_DATABASE_URL` in the
environment. Prisma resolves `.env` relative to **where it runs**, and this repository's `.env`
lives in `apps/app` — so running them from here fails with:

```
Error code: P1012
error: Environment variable not found: DIRECT_DATABASE_URL.
```

That is not a misconfiguration; it is where the file is. CI and deploy environments inject the
variables directly, so the scripts work there.

**For local use, prefer the app's scripts.** They run from `apps/app`, where `.env` resolves, and
point `--schema` back at this package:

```bash
pnpm --filter @remonta/app run db:generate        # regenerate both clients
pnpm --filter @remonta/app run db:migrate:status  # check migration state
pnpm --filter @remonta/app run db:migrate:deploy  # apply migrations
```

The generator's `output` is relative to the **schema file**, not the working directory, so the
client still lands in `apps/app/src/generated/auth-client` regardless of where generation is
invoked from.
