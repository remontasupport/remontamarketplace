// What the stage table commits to, checked on the rendered Knative documents (D14, D15):
// CPU always allocated and at least one instance (the background work), probes on the
// contract's probe entry, exactly the six secrets per stage and nothing secret in the
// plain environment, staging's wildcards and prod's exact origins, and the committed
// YAML equal to the render (drift).
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { DEPLOY_PLACEHOLDER, PROJECT_PLACEHOLDER, renderService, renderYaml, TAG_PLACEHOLDER } from '../lib/render'
import { REGION, SECRET_NAMES, STAGES, type Stage } from '../lib/stages'

const here = dirname(fileURLToPath(import.meta.url))
const stages = Object.keys(STAGES) as Stage[]

describe.each(stages)('service definition: %s', (stage) => {
  const cfg = STAGES[stage]
  const svc = renderService(stage)
  const tpl = svc.spec.template
  const container = tpl.spec.containers[0]

  it('is a Cloud Run service in Sydney named after its stage', () => {
    expect(svc.apiVersion).toBe('serving.knative.dev/v1')
    expect(svc.metadata.name).toBe(cfg.serviceName)
    expect(svc.metadata.labels['cloud.googleapis.com/location']).toBe(REGION)
    expect(REGION).toBe('australia-southeast1')
  })

  it('is reachable without a Google identity (browsers and the health check call it; the api does its own checks)', () => {
    expect(svc.metadata.annotations['run.googleapis.com/ingress']).toBe('all')
    expect(svc.metadata.annotations['run.googleapis.com/invoker-iam-disabled']).toBe('true')
  })

  it('carries a per-deploy marker, so every deploy (a re-run too) is a new revision that re-reads the secrets', () => {
    expect(tpl.metadata.annotations['remonta-deploy-id']).toBe(DEPLOY_PLACEHOLDER)
  })

  it('sets none of the variables Cloud Run reserves (it refuses the whole definition otherwise)', () => {
    // Cloud Run sets PORT to the container port itself; the api reads it from there.
    const reserved = ['PORT', 'K_SERVICE', 'K_REVISION', 'K_CONFIGURATION']
    const names = (container.env as { name: string }[]).map((e) => e.name)
    expect(names.filter((n) => reserved.includes(n))).toEqual([])
  })

  it('keeps CPU allocated between requests and never scales to zero (the outbox dispatcher and the scheduler)', () => {
    expect(tpl.metadata.annotations['run.googleapis.com/cpu-throttling']).toBe('false')
    expect(Number(tpl.metadata.annotations['autoscaling.knative.dev/minScale'])).toBeGreaterThanOrEqual(1)
    expect(Number(tpl.metadata.annotations['autoscaling.knative.dev/maxScale'])).toBe(cfg.maxInstances)
    expect(tpl.metadata.annotations['run.googleapis.com/execution-environment']).toBe('gen2')
    // Instance-based billing needs at least 512 MiB and a whole vCPU at this concurrency.
    expect(['512Mi', '1Gi', '2Gi']).toContain(container.resources.limits.memory)
    expect(container.resources.limits.cpu).toMatch(/^[1-8]$/)
  })

  it('probes the contract probe entry on the container port, for start-up and liveness', () => {
    expect(container.ports).toEqual([{ name: 'http1', containerPort: 4000 }])
    expect(container.startupProbe.httpGet).toEqual({ path: '/v1/health', port: 4000 })
    expect(container.livenessProbe.httpGet).toEqual({ path: '/v1/health', port: 4000 })
    expect(container.livenessProbe.periodSeconds).toBe(15)
    expect(tpl.spec.timeoutSeconds).toBe(60)
    expect(tpl.spec.containerConcurrency).toBe(80)
  })

  it(`references exactly the six ${cfg.serviceName}-* secrets, and nothing secret as plain environment`, () => {
    const secretRefs = container.env.filter((e) => 'valueFrom' in e) as { name: string; valueFrom: { secretKeyRef: { name: string; key: string } } }[]
    expect(secretRefs.map((e) => e.name).sort()).toEqual([...SECRET_NAMES].sort())
    for (const e of secretRefs) {
      expect(e.valueFrom.secretKeyRef).toEqual({ name: `${cfg.serviceName}-${e.name}`, key: 'latest' })
    }
    const plain = Object.fromEntries(container.env.filter((e) => 'value' in e).map((e) => [e.name, (e as { value: string }).value]))
    expect(plain).toEqual(cfg.environment)
    for (const n of SECRET_NAMES) expect(plain[n], `${n} must not be plain environment`).toBeUndefined()
    expect(plain.TRUST_PROXY).toBe('1')
    expect(plain.NODE_ENV).toBe('production')
    // The sign-up photo bucket (U3): one per stage, named in the table; the api refuses to boot without it.
    expect(plain.PHOTO_STORE).toBeUndefined()
    expect(plain.PHOTO_BUCKET).toMatch(/^remonta-api-photos(-staging)?$/)
    expect(plain.PHOTO_PUBLIC_BASE_URL).toBe(`https://storage.googleapis.com/${plain.PHOTO_BUCKET}`)
  })

  it('runs as its own service account and the placeholders are where the workflow substitutes', () => {
    expect(tpl.spec.serviceAccountName).toBe(`${cfg.serviceName}-run@${PROJECT_PLACEHOLDER}.iam.gserviceaccount.com`)
    expect(container.image).toBe(`${REGION}-docker.pkg.dev/${PROJECT_PLACEHOLDER}/remonta/api:${TAG_PLACEHOLDER}`)
    expect(renderService(stage, 'my-project', 'abc1234').spec.template.spec.containers[0].image).toBe(`${REGION}-docker.pkg.dev/my-project/remonta/api:abc1234`)
  })

  it('the committed cloudrun/service.<stage>.yaml is exactly the render (drift)', () => {
    const committed = readFileSync(join(here, '..', 'cloudrun', `service.${stage}.yaml`), 'utf8').replace(/\r\n/g, '\n')
    expect(committed).toBe(renderYaml(stage))
    expect(parse(committed.replace(/^#.*\n/gm, ''))).toEqual(renderService(stage))
  })
})

describe('the stages differ only where the design says', () => {
  it('staging admits Vercel previews with one wildcard label; prod is exact', () => {
    expect(STAGES.staging.environment.CORS_ORIGINS).toBe('https://*.vercel.app')
    expect(STAGES.staging.environment.RECAPTCHA_ALLOWED_HOSTNAMES).toBe('*.vercel.app')
    expect(STAGES.prod.environment.CORS_ORIGINS).toBe('https://app.remontaservices.com.au')
    expect(STAGES.prod.environment.RECAPTCHA_ALLOWED_HOSTNAMES).toBe('app.remontaservices.com.au')
    for (const s of Object.values(STAGES)) for (const v of Object.values(s.environment)) expect(v).not.toMatch(/\*\*|\*\.\*/)
  })
  it('everything else in the environment is shared', () => {
    const differing = Object.keys(STAGES.prod.environment).filter((k) => STAGES.prod.environment[k] !== STAGES.staging.environment[k])
    expect(differing.sort()).toEqual(['CORS_ORIGINS', 'MAX_IN_FLIGHT', 'PHOTO_BUCKET', 'PHOTO_PUBLIC_BASE_URL', 'RECAPTCHA_ALLOWED_HOSTNAMES'])
    expect(Object.keys(STAGES.prod.environment).sort()).toEqual(Object.keys(STAGES.staging.environment).sort())
  })
  it('staging is one small instance; prod scales to four', () => {
    expect([STAGES.staging.minInstances, STAGES.staging.maxInstances]).toEqual([1, 1])
    expect([STAGES.prod.minInstances, STAGES.prod.maxInstances]).toEqual([1, 4])
    expect(STAGES.staging.alerts).toBe('minimal')
    expect(STAGES.prod.alerts).toBe('full')
  })
})

describe('the deploy workflow', () => {
  const workflow = readFileSync(join(here, '../../.github/workflows/deploy-api.yml'), 'utf8')
  const applies = workflow.split('\n').filter((l) => l.includes('sed "s/') && l.includes('service.'))

  it('fills every placeholder on each path that applies a service definition', () => {
    expect(applies.length).toBe(2) // push -> staging, and the promotion
    for (const line of applies) for (const p of [PROJECT_PLACEHOLDER, TAG_PLACEHOLDER, DEPLOY_PLACEHOLDER]) expect(line).toContain(`s/${p}/`)
  })

  it('makes the deploy id unique per run AND per attempt (a re-run must be a new revision)', () => {
    for (const line of applies) expect(line).toMatch(/__DEPLOY_ID__\/\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}\//)
  })
})
