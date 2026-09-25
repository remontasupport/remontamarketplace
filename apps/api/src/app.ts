// Assembles the service. main.ts calls this with real adapters; tests call it with
// fakes for the ports (rate limiter, CAPTCHA, authenticator) and their own handlers.
//
// Nest provides the module system and lifecycle; HTTP is Fastify, and every route is
// created by the contract binder -- there are no Nest controllers (lint rule).
import 'reflect-metadata'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import type { Contract, PublicEndpoint } from '@remonta/api-contract'
import type { FastifyError, FastifyInstance } from 'fastify'
import type { Config } from './config/config'
import { bindContracts, recordRoutes, verifyRoutes } from './platform/contract/binder'
import type { HandlerSet } from './platform/contract/handlers'
import { ApiError, errorBody, statusOf } from './platform/errors'
import { genReqId, loggerOptions } from './platform/logging'
import type { PipelineDeps } from './platform/pipeline/pipeline'

export interface AppOptions {
  config: Pick<Config, 'CORS_ORIGINS' | 'TRUST_PROXY' | 'requireHttps' | 'NODE_ENV'>
  contracts: readonly Contract[]
  handlerSets: readonly HandlerSet[]
  publicEndpoints: readonly PublicEndpoint[]
  deps: PipelineDeps
  logLevel?: string
}

@Module({})
class AppModule {}

/**
 * Nest installs its own not-found and error handlers during init(), in Nest's
 * response format. Fastify allows each to be set once, and ours (below) must win so
 * that every response -- including for URLs no contract declares -- has the
 * contract's error shape. Nest's calls are therefore ignored.
 */
class ContractOnlyAdapter extends FastifyAdapter {
  override setNotFoundHandler(): ReturnType<FastifyAdapter['setNotFoundHandler']> {
    return this.getInstance() as never
  }
  override setErrorHandler(): ReturnType<FastifyAdapter['setErrorHandler']> {
    return this.getInstance() as never
  }
}

const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'cross-origin-opener-policy': 'same-origin',
}

export async function createApp(opts: AppOptions): Promise<NestFastifyApplication> {
  const adapter = new ContractOnlyAdapter({
    logger: loggerOptions(opts.logLevel ?? (opts.config.NODE_ENV === 'test' ? 'silent' : 'info')),
    genReqId,
    requestIdHeader: false, // genReqId validates x-request-id itself
    trustProxy: opts.config.TRUST_PROXY || false,
    exposeHeadRoutes: false, // only the contract's methods exist
    bodyLimit: 16 * 1024, // default ceiling; each route sets its own from maxBodyKb
  })
  const fastify = adapter.getInstance() as unknown as FastifyInstance
  const seen = recordRoutes(fastify)

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, { logger: false, abortOnError: false })

  // 1. Request id (genReqId), security headers, CORS allow-list, HTTPS only.
  fastify.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id)
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) reply.header(k, v)
    reply.header('cache-control', 'no-store')
    if (opts.config.requireHttps) {
      reply.header('strict-transport-security', 'max-age=31536000; includeSubDomains')
      if (request.protocol !== 'https') throw new ApiError(403, 'https required')
    }
  })
  await fastify.register(cors, {
    origin: opts.config.CORS_ORIGINS,
    methods: [...new Set(opts.contracts.flatMap((c) => Object.values(c.entries).map((e) => e.method)))],
    allowedHeaders: ['content-type', 'x-request-id', 'authorization'],
    exposedHeaders: ['x-request-id', 'retry-after'],
    credentials: false,
    maxAge: 600,
  })
  await fastify.register(multipart, { throwFileSizeLimit: true })

  // 11. Error mapping: one shape, generic messages, request id; causes to the log.
  fastify.setErrorHandler((err: FastifyError | ApiError | Error, request, reply) => {
    const status = statusOf(err)
    if (status >= 500) request.log.error({ err }, 'request failed')
    else request.log.info({ status, cause: err instanceof ApiError ? err.cause_ : err.message }, 'request refused')
    if (err instanceof ApiError && err.headers) reply.headers(err.headers)
    const fields = err instanceof ApiError ? err.fields : undefined
    return reply.status(status).send(errorBody(status, request.id, fields))
  })
  fastify.setNotFoundHandler((request, reply) => reply.status(404).send(errorBody(404, request.id)))

  bindContracts(fastify, opts)
  await app.init()
  await fastify.ready()
  verifyRoutes(seen, opts.contracts)
  return app
}
