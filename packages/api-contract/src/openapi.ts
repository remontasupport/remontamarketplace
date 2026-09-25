// OpenAPI 3.1 from the contracts, via Zod 4's own JSON Schema output (ts-rest's
// generator emits empty schemas for Zod 4 -- D1). The committed openapi.json is the
// API inventory (P7); a test fails when it drifts from the contracts.
//
// Each operation also carries x-remonta-security: the entry's metadata, so the
// inventory shows who may call what, how often, and with what bot check.
import * as z from 'zod'
import type { Contract, EntryDef } from './define'
import { ERROR_CODES, errorResponseSchema, type ErrorStatus } from './errors'
import { allEntries } from './checks'

type Json = Record<string, unknown>

function schemaOf(s: z.ZodType, io: 'input' | 'output'): Json {
  const { $schema: _drop, ...js } = z.toJSONSchema(s, { io, unrepresentable: 'any' }) as Json
  return js
}

function errorStatuses(e: EntryDef): ErrorStatus[] {
  const s: ErrorStatus[] = []
  if (e.body || e.query || e.pathParams) s.push(400)
  if (e.meta.access !== 'public') s.push(401, 403)
  if (e.pathParams) s.push(404)
  if (e.body) s.push(413)
  if (e.body?.kind === 'multipart') s.push(415)
  s.push(429, 500)
  if (e.meta.bot !== 'none') s.push(503) // CAPTCHA provider unreachable: fails closed
  return s
}

function operation(id: string, e: EntryDef): Json {
  const parameters: Json[] = []
  for (const [where, obj] of [['path', e.pathParams], ['query', e.query]] as const) {
    if (!obj) continue
    const js = schemaOf(obj, 'input') as { properties?: Record<string, Json>; required?: string[] }
    for (const [name, schema] of Object.entries(js.properties ?? {})) {
      parameters.push({ name, in: where, required: where === 'path' || (js.required ?? []).includes(name), schema })
    }
  }

  let requestBody: Json | undefined
  if (e.body?.kind === 'json') {
    requestBody = { required: true, content: { 'application/json': { schema: schemaOf(e.body.schema, 'input') } } }
  } else if (e.body?.kind === 'multipart') {
    const files = e.body.files
    requestBody = {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: Object.keys(files),
            properties: Object.fromEntries(Object.keys(files).map((f) => [f, { type: 'string', contentMediaType: 'application/octet-stream' }])),
          },
          encoding: Object.fromEntries(Object.entries(files).map(([f, rule]) => [f, { contentType: rule.mimeTypes.join(', ') }])),
        },
      },
    }
  }

  const responses: Json = {}
  for (const [status, schema] of Object.entries(e.responses)) {
    if (schema) responses[status] = { description: 'Success', content: { 'application/json': { schema: schemaOf(schema, 'output') } } }
  }
  for (const s of errorStatuses(e)) {
    responses[String(s)] = { description: ERROR_CODES[s], content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
  }

  return {
    operationId: id,
    summary: e.summary,
    ...(e.meta.access === 'public' ? { security: [] } : {}),
    ...(parameters.length ? { parameters } : {}),
    ...(requestBody ? { requestBody } : {}),
    responses,
    'x-remonta-security': e.meta,
  }
}

export function toOpenApi(contracts: readonly Contract[], info: { title: string; version: string }): Json {
  const paths: Record<string, Record<string, Json>> = {}
  for (const { id, entry } of allEntries(contracts)) {
    const p = entry.path.replace(/:([a-zA-Z0-9]+)/g, '{$1}')
    ;(paths[p] ??= {})[entry.method.toLowerCase()] = operation(id, entry)
  }
  return {
    openapi: '3.1.0',
    info,
    paths,
    components: {
      schemas: { Error: schemaOf(errorResponseSchema, 'output') },
      securitySchemes: { session: { type: 'http', scheme: 'bearer' } },
    },
    security: [{ session: [] }],
  }
}
