// The staging checklist for the Services entries and the performance fixes (api-review U3a, U3b, audit P1-P8;
// aidlc-docs/inception/review/u3b-service-documents-design.md):
//
//   cd apps/api && node --import tsx scripts/staging-services-check.ts
//
// STAGING ONLY (the rehearse-w1 copy, the staging bucket). Reads the staging token secret and database URL through
// `gcloud secrets versions access` (or STAGING_API_TOKEN_SECRET / STAGING_AUTH_DATABASE_URL), mints a five-minute
// token for one worker of the copy who offers Nursing Services, and runs: the profile read and a section save with
// their timings; an unchanged services save; a registration save; a service document end to end (ticket, the
// browser's upload to the bucket, confirm, the signed link opened, delete). The worker's service rows, registration
// and documents are put back exactly as they were. Prints results only: never a secret, a token or a link.
import { execSync } from 'node:child_process'
import { SignJWT } from 'jose'
import { createDb } from '../src/platform/persistence/db'

const BASE = 'https://remonta-api-staging-154148201608.australia-southeast1.run.app'

function secret(name: 'API_TOKEN_SECRET' | 'AUTH_DATABASE_URL'): string {
  const explicit = process.env[`STAGING_${name}`]
  if (explicit) return explicit
  return execSync(`gcloud secrets versions access latest --secret=remonta-api-staging-${name}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
}

const results: { step: string; ok: boolean; detail: string }[] = []
function record(step: string, ok: boolean, detail: string): void {
  results.push({ step, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${step.padEnd(44)} ${detail}`)
}

async function mint(sub: string, key: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ sub, role: 'WORKER', iss: 'remonta-app', aud: 'remonta-api', jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT', kid: 'current' })
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(new TextEncoder().encode(key))
}

const PDF = Buffer.from('%PDF-1.4\n% staging-services-check\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n', 'binary')

async function main(): Promise<void> {
  const dbUrl = secret('AUTH_DATABASE_URL').trim()
  if (!/ep-wandering-shadow/.test(dbUrl)) throw new Error('refusing: the database is not the staging copy (rehearse-w1)')
  const db = createDb(dbUrl, { poolSize: 2, poolTimeoutS: 10 })
  const key = secret('API_TOKEN_SECRET')

  const row = await db.workerService.findFirst({
    where: { categoryId: 'nursing-services', workerProfile: { user: { status: 'ACTIVE' } } },
    select: { workerProfileId: true, workerProfile: { select: { userId: true, introduction: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  if (!row) throw new Error('no active worker offering Nursing Services on the staging copy')
  const profileId = row.workerProfileId
  const userId = row.workerProfile.userId
  const bio = row.workerProfile.introduction
  const servicesBefore = await db.workerService.findMany({ where: { workerProfileId: profileId }, orderBy: { createdAt: 'asc' } })
  const docsBefore = await db.verificationRequirement.findMany({ where: { workerProfileId: profileId, documentCategory: 'SERVICE_QUALIFICATION' } })
  const token = await mint(userId, key)
  const auth = { authorization: `Bearer ${token}` }

  const call = async (method: string, path: string, body?: unknown) => {
    const started = performance.now()
    const res = await fetch(BASE + path, { method, headers: { ...auth, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined })
    const ms = Math.round(performance.now() - started)
    return { status: res.status, ms, json: (await res.json().catch(() => null)) as any }
  }
  const timed = async (label: string, method: string, path: string, body?: unknown, expect = 200) => {
    const ms: number[] = []
    let last
    for (let i = 0; i < 3; i++) {
      last = await call(method, path, body)
      ms.push(last.ms)
    }
    record(label, last!.status === expect, `${last!.status}; ${ms.join(' / ')} ms from here (3 calls)`)
    return last!
  }

  try {
    record('health', (await call('GET', '/v1/health')).status === 200, '')
    const prof = await timed('GET /v1/worker/profile', 'GET', '/v1/worker/profile')
    record('  profile carries the U3 fields', Array.isArray(prof.json?.serviceRegistrations) && Array.isArray(prof.json?.serviceDocuments), `registrations ${prof.json?.serviceRegistrations?.length}, documents ${prof.json?.serviceDocuments?.length}`)
    if (bio) await timed('PUT bio (unchanged)', 'PUT', '/v1/worker/profile/bio', { bio })
    await timed('PUT services (unchanged)', 'PUT', '/v1/worker/services', { services: servicesBefore.map((s) => s.categoryId), subcategoryIds: servicesBefore.flatMap((s) => s.subcategoryIds) })
    const nextYear = `${new Date().getUTCFullYear() + 1}-06-30`
    await timed('PUT registration', 'PUT', '/v1/worker/services/nursing-services/registration', { categoryId: 'nursing-services', nursingType: 'registered', hasExperience: true, registrationNumber: 'NMW0009999999', expiryDate: nextYear })

    // A service document end to end, as the browser will do it.
    const ticket = await call('POST', '/v1/worker/service-documents/tickets', { contentType: 'application/pdf', sizeBytes: PDF.byteLength })
    record('document ticket', ticket.status === 201, `${ticket.status}; ${ticket.ms} ms`)
    if (ticket.status !== 201) return
    const form = new FormData()
    for (const [k, v] of Object.entries(ticket.json.upload.fields as Record<string, string>)) form.append(k, v)
    form.append('file', new Blob([PDF], { type: 'application/pdf' }), 'staging-check.pdf')
    const up0 = performance.now()
    const up = await fetch(ticket.json.upload.url, { method: 'POST', body: form })
    record('  upload straight to the bucket', up.status === 201 || up.status === 204, `${up.status}; ${Math.round(performance.now() - up0)} ms`)
    const confirm = await call('POST', '/v1/worker/service-documents', { uploadId: ticket.json.uploadId, categoryId: 'nursing-services', requirementType: 'ahpra-registration', fileName: 'staging-check.pdf' })
    record('document confirm', confirm.status === 201, `${confirm.status}; ${confirm.ms} ms; url ${String(confirm.json?.url).replace(/[^/]+$/, '…')}`)
    if (confirm.status !== 201) return
    const id = confirm.json.id as string
    const link = await call('GET', `/v1/worker/service-documents/${id}/link`)
    record('document link', link.status === 200 && !!link.json?.expiresAt, `${link.status}; ${link.ms} ms`)
    if (link.status === 200) {
      const file = await fetch(link.json.url)
      const head = Buffer.from(await file.arrayBuffer()).subarray(0, 5).toString('latin1')
      record('  the signed link opens the PDF', file.status === 200 && head === '%PDF-', `${file.status}; ${file.headers.get('content-type')}; ${file.headers.get('content-disposition')?.split(';')[0]}`)
      const bare = await fetch(link.json.url.split('?')[0])
      record('  the object is not public', bare.status === 401 || bare.status === 403, `${bare.status} without the signature`)
    }
    const del = await call('DELETE', `/v1/worker/service-documents/${id}`)
    record('document delete', del.status === 200, `${del.status}; ${del.ms} ms`)
    record('  link after delete', (await call('GET', `/v1/worker/service-documents/${id}/link`)).status === 404, '404')
  } finally {
    // Put the worker back exactly as found: the service rows (ids, order, registration) and the documents.
    await db.$transaction([
      db.workerService.deleteMany({ where: { workerProfileId: profileId } }),
      db.workerService.createMany({ data: servicesBefore as never }),
      db.verificationRequirement.deleteMany({ where: { workerProfileId: profileId, documentCategory: 'SERVICE_QUALIFICATION' } }),
      ...(docsBefore.length ? [db.verificationRequirement.createMany({ data: docsBefore as never })] : []),
    ])
    const after = await db.workerService.findMany({ where: { workerProfileId: profileId }, orderBy: { createdAt: 'asc' } })
    record('worker restored', JSON.stringify(after) === JSON.stringify(servicesBefore), 'service rows identical')
    await db.$disconnect()
  }
  const failed = results.filter((r) => !r.ok).length
  console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED')
  process.exitCode = failed ? 1 : 0
}

main().catch((err: unknown) => {
  console.error('ABORTED', err instanceof Error ? err.message : String(err))
  process.exitCode = 2
})
