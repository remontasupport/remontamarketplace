// The CDK app's composition: four stacks in one account and region (infrastructure-design §1, D9).
//
//   RemontaApiEcr       the image repository                 -- once, by the user (bootstrap)
//   RemontaGithubOidc   the GitHub deploy role               -- once, by the user (bootstrap)
//   RemontaApiStaging   the api against the rehearse-w1 copy -- on every push to main
//   RemontaApiProd      the api against production           -- by workflow_dispatch, a promotion
//
// bin/remonta-api.ts calls buildApp for `cdk`; the tests call it with a fixed account.
import { Tags, type App } from 'aws-cdk-lib'
import { ApiStack } from './api-stack'
import { EcrStack } from './ecr-stack'
import { GithubOidcStack } from './github-oidc-stack'
import { STAGES } from './stages'

export const REGION = 'ap-southeast-2'
/** Synth without credentials (tests, CI): a real deploy always has CDK_DEFAULT_ACCOUNT. */
export const PLACEHOLDER_ACCOUNT = '000000000000'

export function buildApp(app: App, opts: { account: string; imageTag: string }) {
  const env = { account: opts.account, region: REGION }
  const ecr = new EcrStack(app, 'RemontaApiEcr', { env, description: 'apps/api image repository (remonta-api)' })
  const oidc = new GithubOidcStack(app, 'RemontaGithubOidc', { env, repository: ecr.repository, description: 'GitHub Actions OIDC provider and the apps/api deploy role' })
  const staging = new ApiStack(app, 'RemontaApiStaging', { env, config: STAGES.staging, repository: ecr.repository, imageTag: opts.imageTag, description: 'apps/api staging: the rehearse-w1 copy, Vercel previews' })
  const prod = new ApiStack(app, 'RemontaApiProd', { env, config: STAGES.prod, repository: ecr.repository, imageTag: opts.imageTag, description: 'apps/api production' })
  for (const [stack, environment] of [
    [ecr, 'shared'],
    [oidc, 'shared'],
    [staging, 'staging'],
    [prod, 'prod'],
  ] as const) {
    Tags.of(stack).add('Project', 'remonta')
    Tags.of(stack).add('Service', 'api')
    Tags.of(stack).add('Environment', environment)
  }
  return { ecr, oidc, staging, prod }
}
