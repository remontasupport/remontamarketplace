# S1 — Infrastructure Design plan for `apps/api`

**Stage:** Construction → Infrastructure Design (unit S1-registration). Step 3 of the path to
"deployed and in use" (`aidlc-state.md`, standing instruction of 2026-09-28).
**Inputs read:** `S1-design.md` §2.1–2.8, `S1-data-model.md`, `S1-production-run.md`,
`requirements.md` §6 (NFR-PERF, -SEC, -CMP, -OBS, -RES) and the open items OI-07 / OI-08,
`apps/api/src/config/config.ts`, `main.ts`, `app.ts`, `tsup.config.ts`, `load/README.md`,
`.github/workflows/ci-api.yml`.

Answer the `[Answer]:` tags below. Each question carries a recommendation; answering with the
letter is enough. The Dockerfile (§1) does not depend on any answer, so it is already written.

---

## 1. What the service needs from its host (facts, not questions)

Read from the code. Whatever compute is chosen has to provide all of these.

| Need | Where it comes from |
|---|---|
| **A long-running process with CPU between requests.** The outbox dispatcher polls every 2 s, the scheduler ticks (reconciler every 5 min, photo purge, outbox retention, rate-limit purge), and bcrypt runs in worker threads | `main.ts`: `dispatcher.start`, `Scheduler`, `WorkerPoolHasher` |
| **More than one instance is safe.** Jobs take a lease row in `scheduled_jobs`; outbox claims use `FOR UPDATE SKIP LOCKED`; rate limits count in the database | `platform/jobs/scheduler.ts`, `outbox/dispatcher.ts`, `rate-limit/rate-limiter.ts` |
| **Graceful stop on SIGTERM**: scheduler, dispatcher, hash workers, HTTP, pool | `main.ts` `shutdown()` |
| **A proxy in front terminating TLS.** In production `requireHttps` is on and the check reads `request.protocol`, which is the `X-Forwarded-Proto` header only when `TRUST_PROXY` ≥ 1. The client IP for rate limits comes from `X-Forwarded-For` the same way | `app.ts` onRequest hook; `config.ts` `TRUST_PROXY` |
| **Health endpoint** `GET /v1/health`: 200 when the process is up and `SELECT 1` answers; exempt from load shedding; 60/min per IP | `platform.contract.ts`, `platform.handlers.ts` |
| **Outbound HTTPS only to an allow-list**: Neon (Postgres), `www.google.com`, `api.resend.com`, `api.pwnedpasswords.com`, Vercel Blob, the n8n host | `config.ts` `outboundHosts`, `SafeHttpClient` |
| **Database connections are bounded per instance** (`DB_POOL_SIZE`, default 10) against Neon's pooler; the sum across instances must stay under Neon's limit | `persistence/db.ts` |
| **No filesystem state.** `PHOTO_STORE=local` is refused in production; the container is read-only apart from `/tmp` | `config.ts` |
| **Configuration = environment, validated at boot; a missing variable stops the start** | `config.ts` |
| **JSON logs on stdout** with a request id, personal data redacted | `platform/logging.ts` |

**Capacity (measured, `load/README.md`):** one instance with 2 hash threads absorbs ~6.6
sign-ups/s; the global limit is 500 sign-ups/h (0.14/s). One small instance is 45× the ceiling.
Two instances exist for availability (NFR-RES-06), not for throughput.

**The image** (`apps/api/Dockerfile`, built from the repository root): multi-stage, Node 22
pinned by digest, production dependencies only, the Prisma client generated at build for the
image's own platform, runs as `node`, no configuration baked in. `.dockerignore` at the root
keeps `.env` files, the other apps and the docs out of the context. Built and run locally on 2026-09-28: 623 MB; health 200 behind a forwarding proxy, 403 on plain HTTP, a scheduled job ran against the database, graceful stop on SIGTERM, Docker reports `healthy`.

---

## 2. Compute

The requirements table records the hosting decision as **AWS ECS Fargate, `ap-southeast-2`**
(Q11, C9 A). The resume note of 2026-09-28 said "App Runner recommended". Having now read
what the service does between requests, the recommendation is **ECS Fargate**, for one
decisive reason: App Runner allocates CPU to an instance only while it is handling requests
and throttles it when idle. The outbox dispatcher and the scheduled jobs would stall between
requests, so a confirmation email queued by the last sign-up of the evening would wait for
the next request. That is the opposite of what the outbox is for. Fargate runs the process
continuously. App Runner also has no canary traffic shifting (NFR-RES-04), no load balancer
access logs (NFR-SEC-02) and no security groups (NFR-SEC-05).

**Q2.1 — Compute service**

- A) **ECS Fargate + Application Load Balancer, `ap-southeast-2`** (Recommended; matches the
  requirements). Service of 2 tasks across 2 AZs, 0.5 vCPU / 1 GB each, ECS rolling deployment
  with the deployment circuit breaker (automatic rollback to the previous task definition when
  the new tasks fail health checks). Canary for S1 is the application switch
  (`switch:registration`), which already shifts traffic and rolls back without a deploy;
  CodeDeploy blue/green with weighted canary is a later addition on the same setup.
- B) **App Runner**. Simplest console setup, but the background work stalls when idle (above)
  unless the service is kept busy; would need a pinger and records three NFR deviations.
- C) Something else (say what).

[Answer]:a

**Q2.2 — Task size and count.** 2 tasks × 0.5 vCPU / 1 GB, `HASH_CONCURRENCY=1` per task
(0.5 vCPU has no spare core; the hash worker still keeps the event loop free),
`DB_POOL_SIZE=5` per task (10 in total), auto-scaling 2→4 on CPU > 60 %. About A$35/month for
the tasks plus ~A$25/month for the ALB.

- A) **As above** (Recommended)
- B) 1 task to start (cheaper, no AZ redundancy; NFR-RES-06 deviation recorded until cut-over)
- C) Larger tasks (say the size)

[Answer]: a

---

## 3. Networking and edge

**Q3.1 — Hostname.** The browser calls the api directly (`NEXT_PUBLIC_API_URL`; the form
engine's `createClient` runs client-side), so the api needs a public HTTPS name with a valid
certificate, and CORS allows only the app's origin.

- A) **`api.remontaservices.com.au`** (Recommended), certificate from ACM (free, auto-renewed),
  DNS-validated
- B) Another name (say which)

[Answer]: a

**Q3.2 — Where is DNS for `remontaservices.com.au` hosted today** (Vercel, the registrar,
Cloudflare, Route 53)? Needed for the two records: the ACM validation CNAME and the api
hostname pointing at the load balancer. Nothing else moves.

[Answer]: (not answered; found by DNS lookup 2026-09-28) Vercel DNS: ns1/ns2.vercel-dns.com. Records go in Vercel -> Domains -> remontaservices.com.au.

**Q3.3 — Subnets and egress.** Neon, Resend, Google, HIBP and Vercel Blob are all on the
public internet, so a NAT gateway (~A$50/month) buys nothing for S1.

- A) **Tasks in public subnets with public IPs; the security group allows inbound only from
  the load balancer** (Recommended). The ALB is the only thing reachable from outside.
- B) Private subnets + NAT gateway (NFR-SEC-05 to the letter; +A$50/month; needed later only
  if a data store moves into the VPC)

[Answer]: a

**Q3.4 — AWS WAF on the load balancer.** NFR-ARCH-01 lists AWS WAF. The service already has
per-IP and global rate limits, body limits, CAPTCHA and load shedding.

- A) **Later, after the switch is on and traffic is understood** (Recommended for S1)
- B) Now, with the AWS managed core rule set (~A$10/month)

[Answer]: b

**Q3.5 — Which origins does the api accept?** `CORS_ORIGINS` refuses wildcards, so Vercel
preview URLs cannot use api mode against production. NFR-RES-03 asks for a staging
equivalent of "verify the preview".

- A) **Production api accepts `https://app.remontaservices.com.au` only. A staging api service
  (same image, Neon branch, own hostname) is a separate later unit** (Recommended for S1: the
  first verification is done with the switch off, on production, per step 6)
- B) Build the staging service in this unit too (doubles the provisioning)

[Answer]: a

---

## 4. Storage and data

**Q4.1 — Neon.** The api uses the same Neon Sydney project as apps/app, through the pooled
connection string (`AUTH_DATABASE_URL`). Two facts decide pool sizes and NFR-RES-09
(backups, point-in-time recovery, retention): which **Neon plan** is the project on (Free,
Launch, Scale), and what is its **history retention** setting (Free: 6 h; Launch: up to 7 days)?
An RPO of 5 min (NFR-RES-02) is met by any of them; the retention decides how far back a
restore can go.

[Answer]: (not answered; runbook step 0 reads the plan from the Neon console and sets history retention to its maximum)

**Q4.2 — Registration photos and OI-07 (object storage location).** Today the api writes
sign-up photos to **Vercel Blob** with public URLs, as the legacy path does. Vercel Blob
stores live in one region chosen at creation; NFR-CMP-03 wants files in Australia. Please
read the store's region from the Vercel dashboard (Storage → the Blob store → Settings).

- A) **Keep Vercel Blob for S1 whatever the region, and record OI-07 as: move photos and
  compliance documents to S3 Sydney in the Onboarding unit, where documents are handled
  anyway** (Recommended: no new adapter now, and the legacy path already uses the store)
- B) If the store is not in Australia: add an S3 Sydney `PhotoStore` adapter in this unit
  (small: one class, one env switch, a bucket with private objects and presigned reads) and
  use it from the first api-mode sign-up
- C) Store is in Australia (say the region): keep Blob, OI-07 closed for photos

[Answer]: A

**Q4.3 — Migrations in production.** The plan (§2 of the code-generation plan) keeps
`migrate:deploy` **out** of the deploy: it is run deliberately, per the runbook, by a person.
The image carries no Prisma CLI.

- A) **Keep it manual; run from a developer machine with the direct string per
  `S1-production-run.md`** (Recommended for S1)
- B) A GitHub Actions job, manually triggered (`workflow_dispatch`), holding the direct string
  as a repository secret

[Answer]: A

---

## 5. Messaging and background work

Decided by the design: the transactional outbox in Postgres with an in-process dispatcher
(S1-design §2.4); no queue technology in S1 (OI-08 stays open). Scheduled jobs are leased in
`scheduled_jobs`. Nothing to provision. **Rate limits** count in `rate_limit_buckets` until
OI-08 decides Redis. No question; recorded here so the category is covered.

---

## 6. Secrets and configuration

Decided: **AWS Secrets Manager** (NFR-SEC-09, S1-design §2.7), read by the task's execution
role at start; plain settings as task-definition environment. The service validates all of
them at boot and refuses to start otherwise.

| Secret (Secrets Manager) | Plain (task environment) |
|---|---|
| `AUTH_DATABASE_URL` (Neon **pooled** string) | `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT=4000` |
| `RECAPTCHA_SECRET_KEY` | `TRUST_PROXY=1` (the ALB is one hop) |
| `RESEND_API_KEY` | `CORS_ORIGINS=https://app.remontaservices.com.au` |
| `IP_HASH_SECRET` (32+ random chars; also signs the email-code tickets) | `RECAPTCHA_ALLOWED_HOSTNAMES=app.remontaservices.com.au` |
| `BLOB_READ_WRITE_TOKEN` | `PHOTO_STORE=vercel-blob` |
| `N8N_REGISTRATION_WEBHOOK_URL` (has a token in the path) | `APP_BASE_URL=https://app.remontaservices.com.au` |
|  | `EMAIL_FROM=Remonta <noreply@remontaservices.com.au>` (verified Resend domain) |
|  | `HASH_CONCURRENCY`, `DB_POOL_SIZE` per Q2.2 |

**Q6.1 — Who enters the secret values?** Values never go through this chat.

- A) **You, in the Secrets Manager console, from a checklist in the design** (Recommended)
- B) You, into a local file that a provisioning script reads once and deletes

[Answer]:A

---

## 7. Provisioning and deployment pipeline

**Q7.1 — How is the AWS infrastructure defined?**

- A) **AWS CDK in TypeScript, a new workspace package `infra/`** (Recommended: same language
  and lint as the monorepo, reviewed in PRs like everything else, `cdk diff` before every
  change, re-creatable in a second account for staging)
- B) Terraform (a second toolchain and a state bucket to manage)
- C) The AWS console, following a written runbook (fastest first time; not reproducible;
  drift is invisible)

[Answer]: A

**Q7.2 — Image build and deploy trigger.** The image is built by GitHub Actions and pushed
to ECR in Sydney, tagged with the commit SHA (never `latest`), with an SBOM attached
(NFR-SEC-07). GitHub authenticates to AWS with OIDC (no long-lived keys in GitHub).

- A) **Build on every push to `main` that touches the api or its packages, then deploy
  automatically** (Recommended: `main` is production for the two apps already; the ECS
  circuit breaker rolls back a bad image; the switch gates real traffic)
- B) Build on `main`, deploy by a manual approval in GitHub (an `environment` with a required
  reviewer)

[Answer]: A

**Q7.3 — AWS account.** Is there an AWS account already, and is it a single account for
everything, or do you want production separated from a future staging account? With one
account, resources are prefixed `remonta-api-prod-` and a staging set can be added later
under `remonta-api-staging-`. Also: who holds the root/admin credentials to bootstrap the
first deploy (the CDK bootstrap and the OIDC role need an administrator once)?

- A) **One account, `ap-southeast-2` only, prefixes per environment** (Recommended)
- B) Separate accounts per environment (AWS Organizations; more setup)

[Answer]: A

---

## 8. Monitoring, logging, alerting

**Q8.1 — Logs.** Task stdout → CloudWatch Logs, retention **90 days** (NFR-SEC-10), the
application role cannot delete log groups. The ALB writes access logs to an S3 bucket
(NFR-SEC-02). Logs already carry no personal data (redaction in `logging.ts`), so an offshore
error tracker is allowed by C8 A.

**Q8.2 — Alerts for the first deploy.** Delivered by SNS to an email address (say which).

- A) **CloudWatch alarms only for S1** (Recommended): healthy target count < 2; 5xx rate
  > 2 % over 5 min; p95 latency > 2 s; task CPU > 80 %; a metric filter on the log field
  `alert: "outbox-dead-letter"` (an email or CRM notification that will never be delivered);
  a metric filter on `"request failed"` (any 500). Error tracking with an external service
  (NFR-OBS-02) and OpenTelemetry traces (NFR-OBS-03) come with the observability unit.
- B) Add Sentry now (a DSN in Secrets Manager, one line in `main.ts`)

[Answer]: A

**Q8.3 — Alert destination email address** (an inbox someone reads; can be a group).

[Answer]: support@remontaservices.com.au

---

## 9. Shared infrastructure

The api is the only AWS workload. Neon (database), Vercel (both apps, Blob), Upstash (the
switch and the app's caches), Resend and n8n stay where they are. Nothing is multi-tenant.
The VPC, the ALB and the ECR repository created here are the ones later units reuse; the
design will say which names they must use. No question.

---

## Plan steps

- [x] Read the design artifacts and the code's runtime needs (§1)
- [x] Write `apps/api/Dockerfile` and the root `.dockerignore`; build the image locally and
      run it against the local database with the health check
- [x] Collect the answers above (2026-09-28; Q3.2 by lookup, Q4.1 deferred to the runbook)
- [x] `aidlc-docs/construction/S1-registration/infrastructure-design/infrastructure-design.md`:
      the services, sizes, IAM roles, security groups, secrets list, alarms, costs, and the
      NFR mapping (each NFR-SEC/RES/OBS/CMP item: met, deferred to which unit, or deviated)
- [x] `aidlc-docs/construction/S1-registration/infrastructure-design/deployment-architecture.md`:
      the diagram, the build → ECR → deploy flow, rollback (previous image tag), the first-deploy
      runbook with the checklist of values to enter, the DNS records, the verification steps
      (health, suburb search, a photo upload) and the switch flip
- [ ] User review and approval
- [ ] Then, per the answers: the `infra/` package (CDK) or the runbook, and the GitHub Actions
      workflow `deploy-api.yml`
