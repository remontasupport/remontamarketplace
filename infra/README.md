# `@remonta/infra` — apps/api on AWS, as code

The AWS side of `apps/api`, in CDK (TypeScript). Four stacks, one account, `ap-southeast-2`:

| Stack | What | Deployed by |
|---|---|---|
| `RemontaApiEcr` | the image repository `remonta-api` (immutable tags, scan on push, last 20 kept) | the user, once |
| `RemontaGithubOidc` | the GitHub OIDC provider and the role `remonta-api-deploy` (trusts `main` only) | the user, once |
| `RemontaApiStaging` | the api against the `rehearse-w1` Neon copy; admits Vercel previews; 1 small task | the workflow, on every push to `main` |
| `RemontaApiProd` | the api against production; 2 tasks, auto-scaling, seven alarms | the workflow, on `workflow_dispatch` only (a promotion) |

The two api stacks are one construct, `lib/api-stack.ts`, driven by the stage table in `lib/stages.ts`.
The design they implement: `aidlc-docs/construction/S1-registration/infrastructure-design/`
(`infrastructure-design.md`, `deployment-architecture.md`) and the 2026-09-30 amendments in
`aidlc-docs/construction/plans/S1-infrastructure-code-generation-plan.md` §3a.

## Quality gate (no AWS credentials needed)

```bash
pnpm --filter @remonta/infra run quality     # eslint · tsc · vitest (CDK assertions) · cdk synth --all
```

The tests synthesise every stack with a fixed account and assert what the design commits to: the api
security group admits only the load balancer; each stage references exactly its six
`remonta/api/<stage>/*` secrets and nothing else as plain environment; log retention; the circuit
breaker; TLS policy and the 80→443 redirect; the WAF override; the alarm set per stage; no NAT.

## Bootstrap (the user, once; runbook in `deployment-architecture.md` §5)

```bash
export CDK_DEFAULT_ACCOUNT=<account id>          # an admin identity, for the bootstrap only
pnpm --filter @remonta/infra exec cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/ap-southeast-2
pnpm --filter @remonta/infra exec cdk deploy RemontaApiEcr RemontaGithubOidc
# → output DeployRoleArn: set it as the GitHub repository VARIABLE AWS_DEPLOY_ROLE_ARN
```

Then create the six secrets for the stage you are about to deploy (Secrets Manager, plain-text values,
names exactly `remonta/api/<stage>/<NAME>`: `AUTH_DATABASE_URL`, `RECAPTCHA_SECRET_KEY`,
`RESEND_API_KEY`, `IP_HASH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `N8N_REGISTRATION_WEBHOOK_URL`).
A task whose secret is missing fails to start and the deploy rolls back — by design.

## Deploying

- **Staging** deploys itself: merge to `main` touching `apps/api/**`, `packages/**`, `infra/**` or the
  lockfile → `.github/workflows/deploy-api.yml` builds the image, pushes `remonta-api:<sha>`, deploys
  `RemontaApiStaging` with `-c imageTag=<sha>`, waits for the service to settle and checks health.
- **Production** is a promotion: Actions → deploy-api → Run workflow → `stage=prod`,
  `imageTag=<the sha that passed the preview checklist>`. Nothing deploys to production on a push.
- **Rollback**, either stage: the same dispatch with a previous SHA. Images stay in ECR (last 20); a
  rollback is a redeploy of an existing image, never a rebuild. A bad task definition is rolled back by
  the ECS circuit breaker on its own.
- **First deploy of a stage:** the stack requests an ACM certificate; the deploy pauses until the DNS
  validation CNAME it prints is added in Vercel DNS. Afterwards add `api` / `api-staging` CNAME → the
  `ApiLoadBalancerDns` output.

## Local commands

```bash
pnpm --filter @remonta/infra run synth                              # all stacks, placeholder account
pnpm --filter @remonta/infra exec cdk synth RemontaApiStaging -c imageTag=abc1234
pnpm --filter @remonta/infra exec cdk diff RemontaApiProd            # needs credentials + bootstrap
```

`cdk.out/` is build output and is not committed.
