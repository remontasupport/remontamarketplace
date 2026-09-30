# S1 — Infrastructure Design: `apps/api` on AWS

**Unit:** S1-registration. **Date:** 2026-09-28. **Status:** approved 2026-09-28; **hosting superseded 2026-09-30 by Google
Cloud Run** (`plans/S1-infrastructure-code-generation-plan.md` §3b, D14–D21): the user judged AWS too complicated for the
requirements. The requirement that drove this design (an always-on process for the outbox and the scheduler) is met on
Cloud Run by instance-based billing with a minimum of one instance; the ALB, WAF, VPC, IAM/OIDC and CDK are replaced by
Cloud Run's managed equivalents, Secret Manager, Workload Identity Federation and a rendered service definition
(`infra/`). Kept as the reasoning record: the sizing, the probe requirement (§4), secrets (§6), alerts (§7), NFR mapping.
**Inputs:** the answered plan `aidlc-docs/construction/plans/S1-registration-infrastructure-design-plan.md`,
`S1-design.md` §2, `requirements.md` §6, the code (`config.ts`, `main.ts`, `app.ts`, the contracts).
**Companion:** `deployment-architecture.md` (diagram, pipeline, first-deploy runbook, rollback).

## 1. Decisions (from the plan's answers)

| # | Decision | Answer |
|---|---|---|
| Q2.1 | Compute | **ECS Fargate + Application Load Balancer, `ap-southeast-2`** |
| Q2.2 | Size | 2 tasks × 0.5 vCPU / 1 GB, across 2 AZs; auto-scale 2→4 on CPU > 60 % |
| Q3.1 | Hostname | `api.remontaservices.com.au`, ACM certificate |
| Q3.2 | DNS host | **Vercel DNS** (`ns1/ns2.vercel-dns.com`, found by lookup 2026-09-28): records go in the Vercel dashboard |
| Q3.3 | Subnets | Public subnets with public IPs; inbound only from the load balancer; no NAT gateway |
| Q3.4 | WAF | **Now**, AWS managed rules on the load balancer |
| Q3.5 | Origins | Production api accepts the app's origin only. **Amended 2026-09-30 (D9, D11):** a `staging` stack exists first, at `api-staging.remontaservices.com.au`, admitting Vercel previews through one wildcard label (`https://*.vercel.app`) |
| Q4.1 | Neon plan / retention | *Not answered yet* — read from the Neon console at first deploy (runbook step 0); decides how far back point-in-time restore reaches |
| Q4.2 | Photos | Keep Vercel Blob for S1; **OI-07** → the Onboarding unit moves photos and documents to S3 Sydney |
| Q4.3 | Migrations | Manual, from a developer machine, per `S1-production-run.md` |
| Q6.1 | Secrets | The user enters values in the Secrets Manager console from the checklist |
| Q7.1 | Provisioning | **AWS CDK, TypeScript**, workspace package `infra/` |
| Q7.2 | Deploy trigger | Push to `main` touching the api → build image → push ECR → deploy automatically |
| Q7.3 | Account | One AWS account, `ap-southeast-2` only, resource prefix `remonta-api-prod-` |
| Q8.2 | Alerts | CloudWatch alarms only for S1 |
| Q8.3 | Alert email | `support@remontaservices.com.au` |

## 2. Component map

Logical component (S1-design) → infrastructure.

| Logical component | Infrastructure | Notes |
|---|---|---|
| `apps/api` process (HTTP, outbox dispatcher, scheduler, hash workers) | ECS Fargate task, 1 container `api` from ECR `remonta-api`, port 4000 | Runs continuously: the dispatcher and jobs need CPU between requests |
| Its scaling | ECS service `remonta-api-prod`, desired 2, min 2, max 4, target-tracking on CPU 60 % | Two tasks = two AZs (NFR-RES-06). Throughput is not the reason: one task absorbs 45× the sign-up ceiling |
| TLS termination, routing, health | ALB `remonta-api-prod`, listener 443 (ACM cert), listener 80 → 301 to 443, target group HTTP:4000 | The ALB adds `X-Forwarded-For` / `X-Forwarded-Proto`; the task runs with `TRUST_PROXY=1` |
| Edge protection | AWS WAF web ACL on the ALB (§5) | In addition to the service's own rate limits, CAPTCHA and load shedding |
| Database | **Neon** Sydney, existing project, pooled connection string | Unchanged. `DB_POOL_SIZE=5` per task, 20 at max scale; Neon's pooler allows far more |
| Outbox + scheduled jobs + rate-limit counters | Tables in the same Neon database | No queue, no Redis in S1 (OI-08 open) |
| Photos | Vercel Blob (existing store), token in Secrets Manager | OI-07 deferred to Onboarding |
| Email | Resend (API key in Secrets Manager) | `EMAIL_FROM` on a verified domain — pending user action |
| CAPTCHA, breached-password check, n8n | Outbound HTTPS from the task's public IP | No allow-list at the network level; the code's `SafeHttpClient` allow-list is the control (P5) |
| Configuration | Task definition environment (plain) + Secrets Manager (secrets) | §6 |
| Logs | CloudWatch Logs group `/remonta/api/prod`, 90-day retention | JSON from pino, already redacted |
| Alerts | CloudWatch alarms → SNS topic `remonta-api-prod-alerts` → email | §7 |
| Image registry | ECR `remonta-api`, immutable tags, scan on push, keep the last 20 images | Tag = git SHA; never `latest` |
| CI → AWS trust | IAM OIDC provider for GitHub; role `remonta-api-prod-deploy` assumable only by `remontasupport/remontamarketplace` on `main` | No long-lived AWS keys in GitHub |
| Infrastructure code | CDK app in `infra/` (`@remonta/infra`), one stack `RemontaApiProd` | `cdk diff` in PRs, `cdk deploy` from the workflow |

## 3. Network

- **VPC** `remonta-api-prod` 10.42.0.0/16, **2 public subnets** (one per AZ, `ap-southeast-2a/b`), an internet gateway, no NAT gateway, no private subnets in S1. VPC flow logs off (cost; nothing sensitive in the VPC).
- **Security groups:**
  - `alb`: inbound 443 and 80 from 0.0.0.0/0; outbound to `api` on 4000.
  - `api`: inbound **4000 from the `alb` group only**; outbound 443 anywhere (Neon 5432 also outbound; Neon speaks TLS on 5432 — allow 5432 outbound too).
- Tasks get a public IP (needed for egress without NAT). Nothing can reach them except through the load balancer: the `api` group has no inbound rule from the internet.
- **Why not private subnets (Q3.3 A):** every dependency is public SaaS. A NAT gateway would cost ~A$50/month to route traffic that would go to the same public endpoints. NFR-SEC-05's intent (the service is the only thing that can reach the data stores) is met at Neon by its own auth and TLS, not by a VPC. Recorded as a deliberate deviation; revisit if a data store moves into the VPC.

## 4. Load balancer and health

- Listener 443: ACM certificate for `api.remontaservices.com.au`, TLS policy `ELBSecurityPolicy-TLS13-1-2-2021-06` (TLS 1.2+, NFR-SEC-01). Listener 80: redirect to 443. Idle timeout 60 s (the photo upload of 5 MB is well inside). HTTP/2 on. Drop invalid header fields on.
- **HSTS at the edge:** the service sets `strict-transport-security` itself when `requireHttps` is on, so nothing to add at the ALB.
- **Access logs** to S3 bucket `remonta-api-prod-alb-logs`, 90-day lifecycle (NFR-SEC-02).
- **Target group:** IP targets (Fargate), HTTP on 4000, deregistration delay 20 s (the service drains on SIGTERM; ECS gives it `stopTimeout` 30 s).
- **Health check:** `GET /v1/health`, interval 15 s, timeout 5 s, healthy 2, unhealthy 3, success code 200. The endpoint proves the process and its database (`SELECT 1`). It is exempt from load shedding so a burst does not get a healthy task replaced (measured in `load/README.md`).

**A code change this design requires (found while verifying the image, 2026-09-28).** In production the service refuses any request whose `request.protocol` is not `https` (P6, `app.ts`). Behind the ALB that protocol comes from `X-Forwarded-Proto`, which the ALB adds to **proxied** requests. The **health checker** is not a proxied request: it is the load balancer node itself calling the target over plain HTTP, and the AWS documentation lists no forwarded headers for it. With the code as it is, every health check gets 403 "https required", the target never becomes healthy, and the deployment circuit breaker rolls back forever. The Docker `HEALTHCHECK` hit exactly this locally and was fixed by sending the header; the ALB cannot be told to send one.

The fix is a contract-level notion of an infrastructure **probe**, replacing today's `loadShedding: 'exempt'`:

```ts
// packages/api-contract/src/meta.ts
/** An infrastructure probe (a cheap GET with no input and no personal data): never
 *  load-shed, and served over plain HTTP because the load balancer's health checker
 *  is not a proxied request and carries no X-Forwarded-Proto. */
probe?: true
```

`binder.ts` puts `probe` into the route config; the `onRequest` hook in `app.ts` skips both the shedding and the HTTPS check when it is set, and still sends HSTS on every other route. `platformContract.health` declares `probe: true`; no other entry may (the OpenAPI drift test and the contract checks cover it). This is the only code change in this unit; it goes in the same PR as `infra/` so that the first deploy has it.

## 5. WAF (Q3.4 B)

Web ACL `remonta-api-prod`, associated with the ALB, default action allow, rules in order:

| Priority | Rule | Action | Why |
|---|---|---|---|
| 1 | `AWSManagedRulesAmazonIpReputationList` | block | Known bad sources |
| 2 | `AWSManagedRulesCommonRuleSet` with **`SizeRestrictions_BODY` set to count** | block | The core set. `SizeRestrictions_BODY` blocks bodies over 8 KB, which would block every photo upload (up to 5 MB) and the 16 KB registration body; the service enforces `maxBodyKb` per route itself |
| 3 | `AWSManagedRulesKnownBadInputsRuleSet` | block | Log4j-style and similar payloads |
| 4 | Rate-based: 1,000 requests per 5 min per IP | block | A backstop above the service's own per-IP limits (the strictest is 120/min on suburb search); ordinary use never reaches it |

Body inspection stays at the ALB default (16 KB); the registration body fits, the photo body is multipart and inspected only in its first 16 KB. WAF logs to CloudWatch Logs `aws-waf-logs-remonta-api-prod`, 30 days. Cost ~A$10–12/month.

## 6. Configuration and secrets

**Secrets Manager**, one secret per variable, names `remonta/api/prod/<VARIABLE>`, plain-text values (not JSON), encrypted with the AWS-managed key. The task **execution role** may read exactly these. Values are entered by the user in the console (Q6.1 A); the checklist is in `deployment-architecture.md` §5.

| Secret | Source of the value |
|---|---|
| `AUTH_DATABASE_URL` | Neon console → the project's **pooled** connection string (`-pooler` in the host), role with read/write on the application schema. Not the direct string: that one is for migrations only |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA admin, the v3 site used by `apps/app` |
| `RESEND_API_KEY` | Resend dashboard, a key scoped to sending |
| `IP_HASH_SECRET` | Generate: `openssl rand -hex 32` (64 hex chars). Also signs the 10-minute email-code tickets |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → the Blob store → the existing token used by `apps/app` |
| `N8N_REGISTRATION_WEBHOOK_URL` | Optional until step 5 of the path (CRM notification) is built; the webhook URL carries a token |

**Plain environment** on the task definition (visible in the console, not secret):

```
NODE_ENV=production
HOST=0.0.0.0
PORT=4000
TRUST_PROXY=1
CORS_ORIGINS=https://app.remontaservices.com.au
RECAPTCHA_ALLOWED_HOSTNAMES=app.remontaservices.com.au
RECAPTCHA_MIN_SCORE=0.5
APP_BASE_URL=https://app.remontaservices.com.au
EMAIL_FROM=Remonta <noreply@remontaservices.com.au>
PHOTO_STORE=vercel-blob
HASH_CONCURRENCY=1
DB_POOL_SIZE=5
DB_POOL_TIMEOUT_S=5
OUTBOX_POLL_MS=2000
RECONCILER_INTERVAL_MS=300000
MAX_IN_FLIGHT=128
MAX_EVENT_LOOP_DELAY_MS=200
```

`MAX_IN_FLIGHT` is halved from the default: the default suited the 16-core test machine; a 0.5-vCPU task should shed earlier. **Open point for the review:** CLAUDE.md says the application serves `app.remontaservices.com.au` "+ 3 domains". If the sign-up page is reachable on another origin, that origin must be added to `CORS_ORIGINS` and `RECAPTCHA_ALLOWED_HOSTNAMES`, or api-mode sign-ups from it fail at the browser. Please list them.

## 7. Observability and alerting

- **Logs:** the `awslogs` driver, group `/remonta/api/prod`, stream per task, retention 90 days, the deploy role and the task roles have no `DeleteLogGroup` / `DeleteLogStream` (NFR-SEC-10).
- **Metric filters** on the group: `outboxDeadLetter` (JSON field `alert = "outbox-dead-letter"`), `requestFailed` (`msg = "request failed"`, i.e. any 500), `configRefused` (the boot message `apps/api will not start`).
- **Alarms** (→ SNS `remonta-api-prod-alerts` → `support@remontaservices.com.au`, subscription confirmed by the user at first deploy):

| Alarm | Condition | Meaning |
|---|---|---|
| `healthy-hosts` | ALB `HealthyHostCount` < 2 for 2 min | A task is down or unhealthy |
| `5xx-rate` | `HTTPCode_Target_5XX_Count` / `RequestCount` > 2 % over 5 min (min 20 requests) | The service is failing |
| `latency-p95` | `TargetResponseTime` p95 > 2 s over 5 min | Saturation; sign-ups are ~1.6 s at full load |
| `cpu-high` | ECS service CPU > 80 % for 10 min | Scaling ceiling reached |
| `outbox-dead-letter` | `outboxDeadLetter` ≥ 1 in 5 min | An email/CRM event will never be delivered; someone must look at `outbox_events WHERE status='DEAD'` |
| `request-failed` | `requestFailed` ≥ 5 in 5 min | Repeated 500s |
| `deployment-rolled-back` | ECS deployment state `FAILED` (EventBridge rule) | The circuit breaker fired |

- **Dashboard** `remonta-api-prod`: request count, 5xx, p50/p95, healthy hosts, CPU/memory per task, outbox DEAD count (from the metric filter), WAF blocked requests.
- **Deferred to the observability unit:** OpenTelemetry traces/metrics (NFR-OBS-03), an external error tracker (NFR-OBS-02), dashboards for security events beyond WAF.

## 8. IAM (least privilege, NFR-SEC-05)

| Role | May |
|---|---|
| `remonta-api-prod-task-execution` (ECS agent) | Pull from ECR `remonta-api`; write to the log group; read the six secrets above |
| `remonta-api-prod-task` (the process) | Nothing. The service calls no AWS API in S1 (Blob is Vercel, mail is Resend). Exists so that a later unit (S3 in Onboarding) adds one statement instead of restructuring |
| `remonta-api-prod-deploy` (GitHub OIDC) | Trust: `token.actions.githubusercontent.com`, condition `repo:remontasupport/remontamarketplace:ref:refs/heads/main`. Permissions: ECR push to `remonta-api`; assume the CDK bootstrap roles (`cdk-*-deploy-role`, `cdk-*-file-publishing-role`, `cdk-*-lookup-role`) which CloudFormation then uses |
| The user's admin identity | CDK bootstrap once; entering secrets; confirming the SNS subscription |

## 9. Sizing and cost (Sydney, on-demand, approximate, AUD/month)

| Item | Cost |
|---|---|
| Fargate 2 × (0.5 vCPU, 1 GB), 730 h | ~36 |
| ALB (hourly + LCU at this traffic) | ~28 |
| WAF (web ACL + 4 rules + requests) | ~11 |
| Public IPv4 × 2 tasks + 2 ALB nodes | ~16 |
| CloudWatch (logs ~1 GB, 7 alarms, dashboard) | ~8 |
| ECR (a few GB), S3 access logs, Secrets Manager (6 secrets) | ~5 |
| **Total** | **~A$105/month**; scaling to 4 tasks adds ~36 |

## 10. NFR mapping

| NFR | Status | How |
|---|---|---|
| NFR-PERF-01/-03 | Met | Bounded pool per task; horizontal scaling; one task is 45× the sign-up ceiling |
| NFR-SEC-01 | Met | TLS 1.2+ at the ALB; Neon over TLS; Secrets Manager encrypted; ALB logs bucket encrypted |
| NFR-SEC-02 | Met | ALB access logs to S3; JSON logs with request id, redacted |
| NFR-SEC-03/-04/-06/-08/-11 | Met by the service | Unchanged from S1-design §2.3 |
| NFR-SEC-05 | **Deviation, deliberate** | Public subnets, no NAT (§3). Security group admits only the ALB. Revisit when a store moves into the VPC |
| NFR-SEC-07 | Met | Lockfile; base image pinned by digest; ECR scan on push; SBOM attached at build (`docker buildx build --sbom=true`); image tags immutable |
| NFR-SEC-09 | Met | Secrets Manager; none in source; task execution role scoped to the six names |
| NFR-SEC-10 | Met (logs); partial (alerts) | 90-day retention, no delete rights. Alerts on auth failures come with the Identity slice (no auth endpoints yet) |
| NFR-CMP-03 / CON-04 | Met for compute and database; **OI-07 deferred** | Sydney everywhere on AWS; Neon Sydney; photos stay on Vercel Blob until Onboarding (Q4.2 A) |
| NFR-OBS-01 | Met | Request id accepted from `apps/app` (`genReqId`) and on every line |
| NFR-OBS-02/-03/-04 | Partial | CloudWatch alarms and dashboard now; traces, error tracker, security dashboards in the observability unit |
| NFR-RES-02 (99.9 %, RTO 30 min, RPO 5 min) | Met | 2 AZs; a lost AZ leaves one task and the ALB re-routes in ≤ 45 s; Neon is multi-AZ; RPO from Neon's continuous history |
| NFR-RES-03 (staging) | **Met (amended 2026-09-30, D9/D10)** | `RemontaApiStaging`: the same construct, one small task on the `rehearse-w1` copy, deployed automatically on every push to `main`; production is a promotion of an image verified there from a Vercel preview |
| NFR-RES-04 (canary, auto-rollback) | Met at two levels | ECS circuit breaker rolls back a bad task definition; the application switch is the traffic canary and its rollback (flip back) |
| NFR-RES-05 (shallow + deep health) | Partial | One check, shallow + database. Storage/queue checks when those exist |
| NFR-RES-06 | Met | 2 AZs, min 2 / max 4, quotas: Fargate vCPU default quota is ample |
| NFR-RES-07 | Met by the service | Timeouts and allow-list in `SafeHttpClient`; outbox retries |
| NFR-RES-09 (backups, PITR, retention, test restore) | Met by Neon; **retention unknown** (Q4.1) | Runbook step 0 reads the plan and sets history retention to the plan's maximum; a test restore = a branch from a timestamp (rehearsed on `rehearse-w1`) |

## 11. What this unit does NOT do

- No second account, no NAT, no private subnets, no OpenTelemetry, no external error tracker, no S3 for photos, no Redis, no queue. Each is recorded above with the unit that picks it up. (A staging environment **was** added on 2026-09-30, D9: the same construct, deployed first.)
- No change to `apps/app` or Vercel other than, at the end, the two public environment variables and the switch (deployment-architecture §6).
- No migration or backfill: those are step 2 of the path, run manually and before the first deploy.
