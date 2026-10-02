// Semgrep rule tests for remonta.yml (CLAUDE.md: "a boundary rule that has never
// rejected anything may be unenforceable"). `semgrep --test .semgrep/` checks that
// every `ruleid:` line is reported by that rule and every `ok:` line is not.
// This file is never scanned as a target (.semgrepignore, codeql-config.yml) and
// is never imported; it only has to parse.
/* eslint-disable */
// @ts-nocheck

// ---- remonta-no-raw-fetch-to-api ------------------------------------------------
// ruleid: remonta-no-raw-fetch-to-api
fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/localities?q=parra`);
// ruleid: remonta-no-raw-fetch-to-api
fetch("https://remonta-api-staging-1.australia-southeast1.run.app/v1/health");
// ok: remonta-no-raw-fetch-to-api
fetch(`/api/suburbs?q=${encodeURIComponent("parra")}`);

// ---- remonta-api-no-manual-limit-or-captcha -------------------------------------
async function handler(deps: any, req: any) {
  // ruleid: remonta-api-no-manual-limit-or-captcha
  await deps.rateLimiter.hit(`x:${req.ip}`, 10, "1h");
  // ruleid: remonta-api-no-manual-limit-or-captcha
  await deps.captcha.verify(req.body.captchaToken, "worker_register", req.ip);
  // ok: remonta-api-no-manual-limit-or-captcha
  await deps.localities.search(req.query.q);
}

// ---- remonta-api-no-unsafe-raw-sql ---------------------------------------------
async function query(db: any, email: string) {
  // ruleid: remonta-api-no-unsafe-raw-sql
  await db.$queryRawUnsafe(`SELECT id FROM users WHERE email = '${email}'`);
  // ruleid: remonta-api-no-unsafe-raw-sql
  await db.$executeRawUnsafe("DELETE FROM outbox_events");
  // ok: remonta-api-no-unsafe-raw-sql
  await db.$queryRaw`SELECT id FROM users WHERE lower(email) = lower(${email})`;
}

// ---- remonta-web-no-database-import ---------------------------------------------
// ruleid: remonta-web-no-database-import
import { prisma } from "@remonta/db";
// ruleid: remonta-web-no-database-import
import { PrismaClient } from "@prisma/client";
// ok: remonta-web-no-database-import
import { workerRegistrationSchema } from "@remonta/schemas/schema/workerRegistrationSchema";

// ---- remonta-api-no-nest-controllers --------------------------------------------
// ruleid: remonta-api-no-nest-controllers
@Controller("health")
class HealthController {
  // ruleid: remonta-api-no-nest-controllers
  @Get()
  health() {
    return { status: "ok" };
  }
}
