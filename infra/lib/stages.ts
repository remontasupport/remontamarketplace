// The two deployments of apps/api, as data (D9, 2026-09-30). One ApiStack construct
// reads this table; nothing else differs between staging and production.
//
// staging: the first thing deployed. It talks to the `rehearse-w1` Neon branch (a
// reset copy of production) and admits Vercel previews, so the preview checklist
// (aidlc-docs/construction/plans/S1-preview-first-verification-plan.md §3) can run
// against real infrastructure before production exists. Small, one task.
//
// prod: the design as approved on 2026-09-28 (infrastructure-design.md).
import { RetentionDays } from 'aws-cdk-lib/aws-logs'

export type Stage = 'staging' | 'prod'

export interface StageConfig {
  readonly stage: Stage
  /** Public hostname; the ACM certificate is requested for it, DNS lives in Vercel. */
  readonly hostname: string
  /** The VPC's CIDR; each stage has its own VPC. */
  readonly vpcCidr: string
  readonly desiredCount: number
  readonly minCount: number
  readonly maxCount: number
  /** Target-tracking on CPU 60 % between min and max; off = a fixed desiredCount. */
  readonly autoScale: boolean
  /** Fargate task size (CPU units: 256 = 0.25 vCPU). */
  readonly cpu: number
  readonly memoryMiB: number
  readonly logRetention: RetentionDays
  /** 'full' = the seven alarms of the design; 'minimal' = healthy hosts + outbox dead letters. */
  readonly alarms: 'full' | 'minimal'
  readonly alertEmail: string
  /** Plain (non-secret) task environment. Everything in apps/api/src/config/config.ts not listed under secrets. */
  readonly environment: Readonly<Record<string, string>>
}

/** The six values held in Secrets Manager as `remonta/api/<stage>/<NAME>` (infrastructure-design §6). */
export const SECRET_NAMES = [
  'AUTH_DATABASE_URL',
  'RECAPTCHA_SECRET_KEY',
  'RESEND_API_KEY',
  'IP_HASH_SECRET',
  'BLOB_READ_WRITE_TOKEN',
  'N8N_REGISTRATION_WEBHOOK_URL',
] as const

export const secretPath = (stage: Stage, name: (typeof SECRET_NAMES)[number]) => `remonta/api/${stage}/${name}`

export const ALERT_EMAIL = 'support@remontaservices.com.au'
export const APP_ORIGIN = 'https://app.remontaservices.com.au'

/** Shared by both stages; the differences are spelled out per stage below. */
const common = {
  NODE_ENV: 'production',
  HOST: '0.0.0.0',
  PORT: '4000',
  TRUST_PROXY: '1',
  RECAPTCHA_MIN_SCORE: '0.5',
  APP_BASE_URL: APP_ORIGIN,
  EMAIL_FROM: 'Remonta <noreply@remontaservices.com.au>',
  PHOTO_STORE: 'vercel-blob',
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
    hostname: 'api-staging.remontaservices.com.au',
    vpcCidr: '10.43.0.0/16',
    desiredCount: 1,
    minCount: 1,
    maxCount: 1,
    autoScale: false,
    cpu: 256,
    memoryMiB: 512,
    logRetention: RetentionDays.ONE_MONTH,
    alarms: 'minimal',
    alertEmail: ALERT_EMAIL,
    environment: {
      ...common,
      // Vercel previews: one wildcard label (apps/api/src/config/hosts.ts, D11).
      CORS_ORIGINS: 'https://*.vercel.app',
      RECAPTCHA_ALLOWED_HOSTNAMES: '*.vercel.app',
      MAX_IN_FLIGHT: '64',
    },
  },
  prod: {
    stage: 'prod',
    hostname: 'api.remontaservices.com.au',
    vpcCidr: '10.42.0.0/16',
    desiredCount: 2,
    minCount: 2,
    maxCount: 4,
    autoScale: true,
    cpu: 512,
    memoryMiB: 1024,
    logRetention: RetentionDays.THREE_MONTHS,
    alarms: 'full',
    alertEmail: ALERT_EMAIL,
    environment: {
      ...common,
      CORS_ORIGINS: APP_ORIGIN,
      RECAPTCHA_ALLOWED_HOSTNAMES: 'app.remontaservices.com.au',
      MAX_IN_FLIGHT: '128',
    },
  },
}
