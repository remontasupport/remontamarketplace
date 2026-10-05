// The alert policies (cloudrun/monitoring/*.json) and the stage table in cloudrun/lib.sh
// that bootstrap.sh and apply-alerts.sh read. Files only, no credentials.
//
// latency-p95 is pinned in detail: it once fired on every slow single request because
// its p95 was taken per route and reduced with MAX. It must stay a service-wide p95
// with a request-volume floor, both held for two windows (U1, 2026-10-05).
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { STAGES } from '../lib/stages'

const here = dirname(fileURLToPath(import.meta.url))
const monitoringDir = join(here, '..', 'cloudrun', 'monitoring')
const PLACEHOLDERS = ['__SERVICE__', '__STAGE__', '__CHANNEL__', '__PROJECT_ID__']

interface Aggregation {
  alignmentPeriod: string
  perSeriesAligner: string
  crossSeriesReducer: string
  groupByFields: string[]
}
interface Condition {
  displayName: string
  conditionThreshold: {
    filter: string
    aggregations: Aggregation[]
    comparison: string
    thresholdValue: number
    duration: string
    trigger: { count: number }
    evaluationMissingData?: string
  }
}
interface Policy {
  displayName: string
  documentation: { content: string; mimeType: string }
  combiner: string
  conditions: Condition[]
  notificationChannels: string[]
  alertStrategy: { autoClose: string }
  severity: string
  userLabels: Record<string, string>
}

const policyFiles = readdirSync(monitoringDir).filter((f) => f.endsWith('.json'))
const policy = (name: string): Policy => JSON.parse(readFileSync(join(monitoringDir, `${name}.json`), 'utf8')) as Policy

/** The two tables from cloudrun/lib.sh, read the way the shell defines them. */
function shellTables(): { services: Record<string, string>; alerts: Record<string, string[]> } {
  const sh = readFileSync(join(here, '..', 'cloudrun', 'lib.sh'), 'utf8')
  const services: Record<string, string> = {}
  const alerts: Record<string, string[]> = {}
  for (const m of sh.matchAll(/(\w+)\) echo (\S+) ;;/g)) {
    const [, stage, value] = m
    if (!value!.startsWith('"')) services[stage!] = value!
  }
  for (const m of sh.matchAll(/(\w+)\) echo "([^"]*)" ;;/g)) alerts[m[1]!] = m[2]!.split(/\s+/).filter(Boolean)
  return { services, alerts }
}

describe('alert policy files', () => {
  it.each(policyFiles)('%s is a policy with the placeholders bootstrap renders', (file) => {
    const p = JSON.parse(readFileSync(join(monitoringDir, file), 'utf8')) as Policy
    expect(p.displayName.startsWith('__SERVICE__ ')).toBe(true)
    expect(p.displayName).toBe(`__SERVICE__ ${file.replace(/\.json$/, '')}`)
    expect(p.notificationChannels).toEqual(['__CHANNEL__'])
    expect(p.userLabels).toEqual({ 'remonta-stage': '__STAGE__', 'remonta-service': 'api' })
    expect(p.conditions.length).toBeGreaterThan(0)
    expect(['AND', 'OR']).toContain(p.combiner)
    for (const token of readFileSync(join(monitoringDir, file), 'utf8').match(/__[A-Z_]+__/g) ?? []) {
      expect(PLACEHOLDERS, `${file} uses an unknown placeholder ${token}`).toContain(token)
    }
  })
})

describe('the stage table in cloudrun/lib.sh', () => {
  const { services, alerts } = shellTables()

  it('names the same services as lib/stages.ts', () => {
    for (const stage of Object.keys(STAGES) as (keyof typeof STAGES)[]) {
      expect(services[stage]).toBe(STAGES[stage].serviceName)
    }
  })

  it('lists only policies that exist as files, the full set on prod and the minimal set on staging', () => {
    const files = policyFiles.map((f) => f.replace(/\.json$/, '')).sort()
    for (const [stage, names] of Object.entries(alerts)) {
      for (const n of names) expect(files, `${stage} lists ${n}`).toContain(n)
    }
    expect([...alerts.prod!].sort()).toEqual(files)
    expect(alerts.staging).toEqual(['instance-down', 'outbox-dead-letter'])
    expect(alerts.prod).toContain('latency-p95')
  })
})

describe('latency-p95', () => {
  const p = policy('latency-p95')
  const [latency, volume] = p.conditions

  it('fires only when both conditions hold at the same time, for two consecutive windows, and never on missing data', () => {
    expect(p.combiner).toBe('AND')
    expect(p.conditions).toHaveLength(2)
    for (const c of p.conditions) {
      expect(c.conditionThreshold.duration).toBe('600s')
      expect(c.conditionThreshold.trigger).toEqual({ count: 1 })
      expect(c.conditionThreshold.evaluationMissingData).toBe('EVALUATION_MISSING_DATA_INACTIVE')
      expect(c.conditionThreshold.aggregations).toHaveLength(1)
      expect(c.conditionThreshold.aggregations[0]!.alignmentPeriod).toBe('300s')
      expect(c.conditionThreshold.aggregations[0]!.groupByFields).toEqual(['resource.labels.service_name'])
    }
  })

  it('measures the service-wide p95 of request latency (merged across routes), not the slowest route', () => {
    expect(latency!.conditionThreshold.filter).toContain('run.googleapis.com/request_latencies')
    expect(latency!.conditionThreshold.aggregations[0]).toMatchObject({ perSeriesAligner: 'ALIGN_DELTA', crossSeriesReducer: 'REDUCE_PERCENTILE_95' })
    expect(latency!.conditionThreshold.comparison).toBe('COMPARISON_GT')
    expect(latency!.conditionThreshold.thresholdValue).toBe(2000)
  })

  it('requires at least 60 requests in the window, so one slow upload cannot be the p95', () => {
    expect(volume!.conditionThreshold.filter).toContain('run.googleapis.com/request_count')
    expect(volume!.conditionThreshold.aggregations[0]).toMatchObject({ perSeriesAligner: 'ALIGN_DELTA', crossSeriesReducer: 'REDUCE_SUM' })
    expect(volume!.conditionThreshold.comparison).toBe('COMPARISON_GT')
    expect(volume!.conditionThreshold.thresholdValue).toBe(59)
  })

  it('tells the reader what it means and how to change it', () => {
    expect(p.documentation.content).toContain('60 requests')
    expect(p.documentation.content).toContain('apply-alerts.sh')
    expect(p.severity).toBe('WARNING')
    expect(p.alertStrategy.autoClose).toBe('1800s')
  })
})
