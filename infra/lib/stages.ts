// The two deployments of apps/api on Google Cloud Run, as data (D14, 2026-09-30).
// lib/render.ts turns each entry into the Knative service definition Cloud Run
// runs (cloudrun/service.<stage>.yaml, committed and drift-checked). Nothing else
// differs between staging and production.
//
// staging: the first thing deployed. It talks to the `rehearse-w1` Neon branch (a
// reset copy of production) and admits Vercel previews, so the preview checklist
// (aidlc-docs/construction/plans/S1-preview-first-verification-plan.md §3) runs
// against real infrastructure before production exists.
//
// Both run with instance-based billing (CPU always allocated) and at least one
// instance, because the outbox dispatcher and the scheduler work between requests.

export type Stage = 'staging' | 'prod'

export const REGION = 'australia-southeast1'
export const REGISTRY_REPOSITORY = 'remonta' // Artifact Registry repository; image `api`
export const CONTAINER_PORT = 4000
export const HEALTH_PATH = '/v1/health'
export const ALERT_EMAIL = 'support@remontaservices.com.au'
export const APP_ORIGIN = 'https://app.remontaservices.com.au'

/** The six values held in Secret Manager as `remonta-api-<stage>-<NAME>` (infrastructure-design §6, D17). */
export const SECRET_NAMES = [
  'AUTH_DATABASE_URL',
  'RECAPTCHA_SECRET_KEY',
  'RESEND_API_KEY',
  'IP_HASH_SECRET',
  'BLOB_READ_WRITE_TOKEN',
  'N8N_REGISTRATION_WEBHOOK_URL',
] as const
export type SecretName = (typeof SECRET_NAMES)[number]

export interface StageConfig {
  readonly stage: Stage
  /** The Cloud Run service name; also the prefix of its secrets and service account. */
  readonly serviceName: string
  readonly minInstances: number
  readonly maxInstances: number
  /** vCPU as Cloud Run spells it ('1', '2'); instance-based billing needs a whole vCPU with concurrency > 1. */
  readonly cpu: string
  readonly memory: string
  readonly concurrency: number
  readonly timeoutSeconds: number
  /** 'full' = the prod alert set; 'minimal' = instance down + outbox dead letters. */
  readonly alerts: 'full' | 'minimal'
  /** Plain (non-secret) container environment: everything in apps/api/src/config/config.ts not listed under secrets. */
  readonly environment: Readonly<Record<string, string>>
}

export const secretName = (stage: Stage, name: SecretName) => `${STAGES[stage].serviceName}-${name}`
export const runtimeServiceAccount = (stage: Stage, projectId: string) => `${STAGES[stage].serviceName}-run@${projectId}.iam.gserviceaccount.com`
export const imageName = (projectId: string, tag: string) => `${REGION}-docker.pkg.dev/${projectId}/${REGISTRY_REPOSITORY}/api:${tag}`

/** Shared by both stages; the differences are spelled out per stage below. */
const common = {
  NODE_ENV: 'production',
  HOST: '0.0.0.0',
  // No PORT: Cloud Run reserves it and sets it to the container port (CONTAINER_PORT).
  // Cloud Run terminates TLS and adds X-Forwarded-Proto / X-Forwarded-For: one hop to trust.
  TRUST_PROXY: '1',
  RECAPTCHA_MIN_SCORE: '0.5',
  APP_BASE_URL: APP_ORIGIN,
  EMAIL_FROM: 'Remonta <community@remontaservices.com.au>',
  HASH_CONCURRENCY: '1',
  DB_POOL_SIZE: '5',
  DB_POOL_TIMEOUT_S: '5',
  OUTBOX_POLL_MS: '2000',
  RECONCILER_INTERVAL_MS: '300000',
  MAX_EVENT_LOOP_DELAY_MS: '200',
} as const

export const STAGES: Readonly<Record<Stage, StageConfig>> = {
  staging: {
    stage: 'staging',
    serviceName: 'remonta-api-staging',
    minInstances: 1,
    maxInstances: 1,
    cpu: '1',
    memory: '512Mi',
    concurrency: 80,
    timeoutSeconds: 60,
    alerts: 'minimal',
    environment: {
      ...common,
      // Vercel previews: one wildcard label (apps/api/src/config/hosts.ts, D11).
      CORS_ORIGINS: 'https://*.vercel.app',
      RECAPTCHA_ALLOWED_HOSTNAMES: '*.vercel.app',
      // The sign-up photo bucket (U3): created by bootstrap step 11; cloudrun/lib.sh names it too.
      PHOTO_BUCKET: 'remonta-api-photos-staging',
      PHOTO_PUBLIC_BASE_URL: 'https://storage.googleapis.com/remonta-api-photos-staging',
      MAX_IN_FLIGHT: '64',
    },
  },
  prod: {
    stage: 'prod',
    serviceName: 'remonta-api',
    minInstances: 1,
    maxInstances: 4,
    cpu: '1',
    memory: '1Gi',
    concurrency: 80,
    timeoutSeconds: 60,
    alerts: 'full',
    environment: {
      ...common,
      CORS_ORIGINS: APP_ORIGIN,
      RECAPTCHA_ALLOWED_HOSTNAMES: 'app.remontaservices.com.au',
      PHOTO_BUCKET: 'remonta-api-photos',
      PHOTO_PUBLIC_BASE_URL: 'https://storage.googleapis.com/remonta-api-photos',
      MAX_IN_FLIGHT: '128',
    },
  },
}
