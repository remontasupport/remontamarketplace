# syntax=docker/dockerfile:1.7
# apps/api: the container image Cloud Run runs (infra/README.md).
#
# Build from the REPOSITORY ROOT, because the workspace lockfile and the shared
# packages live there:
#
#   docker build -f apps/api/Dockerfile -t remonta-api .
#
# Four stages. `base` installs pnpm and copies only the manifests, so the
# dependency layers are rebuilt when a package.json or the lockfile changes and
# not when source does. `build` installs everything the api needs (dev included),
# generates the Prisma client and bundles with tsup. `prod-deps` installs the
# runtime dependencies only. `runtime` is the shipped image: the bundle, the
# generated Prisma client and the production node_modules, running as `node`.
#
# The image holds NO configuration. Every variable in src/config/config.ts comes
# from the environment at run time (Cloud Run env + Secret Manager); the service refuses
# to start if one is missing. `.env` files are excluded by the root .dockerignore.
#
# The base image is pinned by digest (NFR-SEC-07: pinned base images, no `latest`).
# Node 22 is the version CI tests alongside 20. To move: change the tag AND the
# digest together (`docker pull node:<tag>` then `docker image inspect --format
# '{{index .RepoDigests 0}}'`).
ARG NODE_IMAGE=node:22.23.3-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c

# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS base
# The slim image ships no libssl. Prisma detects the OpenSSL version at generate
# time to pick the query engine; with none present it falls back to "openssl-1.1.x"
# and the client then fails at run time on this OpenSSL 3 image. So openssl is in
# the base of every stage. ca-certificates: outbound TLS at run time (Neon, Resend,
# Google, HIBP, Vercel Blob, n8n).
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
# The pnpm version the repository declares in package.json ("packageManager").
RUN npm install -g pnpm@9.15.9 && npm cache clean --force
WORKDIR /repo
# Every workspace manifest: pnpm needs all importers to check the lockfile, even
# for a filtered install. .npmrc carries node-linker=hoisted (see its comments).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/app/package.json apps/app/
COPY apps/web/package.json apps/web/
COPY packages/api-contract/package.json packages/api-contract/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/form-engine/package.json packages/form-engine/
COPY packages/schemas/package.json packages/schemas/

# ---------------------------------------------------------------------------
FROM base AS build
# `@remonta/api...` = the api and its workspace dependencies. apps/app and apps/web
# (and their Prisma postinstall hooks) stay out of the image build entirely.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @remonta/api...
COPY packages/config packages/config
COPY packages/schemas packages/schemas
COPY packages/api-contract packages/api-contract
# The only schema source; apps/api derives its own copy from it at build time.
COPY packages/db/prisma/schema.prisma packages/db/prisma/schema.prisma
COPY apps/api apps/api
# prisma generate (into apps/api/generated/db, with the engine for THIS platform)
# + tsup (dist/main.js, dist/hash-worker.js). No database is contacted.
RUN pnpm --filter @remonta/api run build

# ---------------------------------------------------------------------------
FROM base AS prod-deps
# Runtime dependencies only. With node-linker=hoisted (.npmrc) a filtered install
# still hoists the WHOLE workspace's packages into the root node_modules -- the
# first build shipped next, sanity and mui in a 2.3 GB image. `pnpm deploy` writes
# a directory holding only this package and its production dependencies, resolved
# from the lockfile. The deploy step uses the ISOLATED linker: with the hoisted one,
# pnpm 9.15 ignores --prod and copies the dev dependencies too (prisma CLI,
# typescript, ~75 MB; measured 2026-09-28). Scripts are skipped: the Prisma client
# comes from `build`.
COPY packages/schemas packages/schemas
COPY packages/api-contract packages/api-contract
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts --filter @remonta/api... \
 && pnpm --filter @remonta/api deploy --prod --ignore-scripts --config.node-linker=isolated /out

# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
# Same reason as in `base`: the engine and outbound TLS need OpenSSL and CA roots.
# Not `FROM base`, so pnpm and the workspace manifests are not shipped.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4000
WORKDIR /repo/apps/api
# The deployed package: package.json (its "imports" map resolves #db to
# ./generated/db) and node_modules with the production dependencies only.
COPY --from=prod-deps --chown=node:node /out /repo/apps/api
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
COPY --from=build --chown=node:node /repo/apps/api/generated ./generated
USER node
EXPOSE 4000
# Liveness for `docker run` and local checks. On Cloud Run the platform's own probe
# hits the same endpoint (a contract `probe`: never shed, plain HTTP allowed).
# In production the service refuses plain HTTP on every other route unless the
# request says it came in over HTTPS at the proxy, so the check sends
# X-Forwarded-Proto; the header is only honoured when TRUST_PROXY >= 1, which is
# always the case behind Cloud Run's front end.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/v1/health',{headers:{'x-forwarded-proto':'https'}}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
# Exec form, so SIGTERM reaches node and main.ts's shutdown runs (scheduler,
# dispatcher, hash workers, pool). No --env-file: configuration is the environment.
CMD ["node", "--enable-source-maps", "dist/main.js"]
