// CDK assertions over the synthesised templates: the properties the design commits
// to and that a future edit could silently lose. Synthesised with a fixed account
// and no AWS credentials, the way CI runs it.
import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../lib/app'
import { SECRET_NAMES, STAGES, type Stage } from '../lib/stages'

const ACCOUNT = '123456789012'
let templates: Record<'ecr' | 'oidc' | 'staging' | 'prod', Template>

beforeAll(() => {
  const app = new App()
  const stacks = buildApp(app, { account: ACCOUNT, imageTag: 'abc1234' })
  templates = {
    ecr: Template.fromStack(stacks.ecr),
    oidc: Template.fromStack(stacks.oidc),
    staging: Template.fromStack(stacks.staging),
    prod: Template.fromStack(stacks.prod),
  }
})

describe('the image repository', () => {
  it('has immutable tags, scans on push and keeps the last 20 images', () => {
    templates.ecr.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'remonta-api',
      ImageTagMutability: 'IMMUTABLE',
      ImageScanningConfiguration: { ScanOnPush: true },
      LifecyclePolicy: { LifecyclePolicyText: Match.stringLikeRegexp('"countNumber":20') },
    })
    templates.ecr.hasResource('AWS::ECR::Repository', { DeletionPolicy: 'Retain' })
  })
})

describe('the GitHub deploy role', () => {
  it('is assumable only by the repository on main, and can only push images and assume the CDK roles', () => {
    templates.oidc.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'remonta-api-deploy',
      AssumeRolePolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: {
              StringEquals: {
                'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                'token.actions.githubusercontent.com:sub': 'repo:remontasupport/remontamarketplace:ref:refs/heads/main',
              },
            },
          }),
        ],
      },
    })
    const policies = templates.oidc.findResources('AWS::IAM::Policy')
    const statements = Object.values(policies).flatMap((p) => (p as { Properties: { PolicyDocument: { Statement: { Action: string | string[] }[] } } }).Properties.PolicyDocument.Statement)
    const actions = new Set(statements.flatMap((s) => (Array.isArray(s.Action) ? s.Action : [s.Action])))
    for (const a of actions) expect(a, a).toMatch(/^(ecr:|sts:AssumeRole$|ecs:Describe|ecs:List)/)
    expect(actions.has('ecr:PutImage')).toBe(true)
    expect(actions.has('sts:AssumeRole')).toBe(true)
  })
})

describe.each<Stage>(['staging', 'prod'])('the api stack: %s', (stage) => {
  const cfg = STAGES[stage]
  const t = () => templates[stage]

  it('admits traffic to the tasks only from the load balancer, never from the internet', () => {
    const groups = t().findResources('AWS::EC2::SecurityGroup')
    const api = Object.values(groups).find((g) => (g as { Properties: { GroupName: string } }).Properties.GroupName === `remonta-api-${stage}-api`) as {
      Properties: { SecurityGroupIngress?: unknown[] }
    }
    expect(api, 'api security group').toBeDefined()
    // Ingress from another group is a separate resource; the group itself carries no CIDR ingress.
    expect(api.Properties.SecurityGroupIngress ?? []).toEqual([])
    const ingress = Object.values(t().findResources('AWS::EC2::SecurityGroupIngress')) as { Properties: { FromPort: number; ToPort: number; CidrIp?: string; SourceSecurityGroupId?: unknown } }[]
    expect(ingress.length).toBeGreaterThan(0)
    for (const r of ingress) {
      expect(r.Properties.CidrIp, 'no CIDR ingress to the api').toBeUndefined()
      expect(r.Properties.SourceSecurityGroupId).toBeDefined()
      expect(r.Properties.FromPort).toBe(4000)
      expect(r.Properties.ToPort).toBe(4000)
    }
  })

  it('redirects 80 to 443 and terminates TLS 1.2+ with the stage certificate', () => {
    t().hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      DefaultActions: [{ Type: 'redirect', RedirectConfig: Match.objectLike({ Protocol: 'HTTPS', Port: '443', StatusCode: 'HTTP_301' }) }],
    })
    t().hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', { Port: 443, Protocol: 'HTTPS', SslPolicy: 'ELBSecurityPolicy-TLS13-1-2-2021-06' })
    t().hasResourceProperties('AWS::CertificateManager::Certificate', { DomainName: cfg.hostname, ValidationMethod: 'DNS' })
    t().hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      // idle timeout 60 s is the ALB default, so CloudFormation carries no attribute for it.
      LoadBalancerAttributes: Match.arrayWith([
        { Key: 'routing.http.drop_invalid_header_fields.enabled', Value: 'true' },
        { Key: 'access_logs.s3.enabled', Value: 'true' },
      ]),
    })
  })

  it('health-checks the probe entry and drains in 20 s', () => {
    t().hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      HealthCheckPath: '/v1/health',
      HealthCheckIntervalSeconds: 15,
      HealthCheckTimeoutSeconds: 5,
      HealthyThresholdCount: 2,
      UnhealthyThresholdCount: 3,
      Matcher: { HttpCode: '200' },
      TargetGroupAttributes: Match.arrayWith([{ Key: 'deregistration_delay.timeout_seconds', Value: '20' }]),
    })
  })

  it(`runs ${cfg.desiredCount} task(s) of ${cfg.cpu}/${cfg.memoryMiB} with the circuit breaker and rollback`, () => {
    t().hasResourceProperties('AWS::ECS::Service', {
      ServiceName: `remonta-api-${stage}`,
      DesiredCount: cfg.desiredCount,
      DeploymentConfiguration: Match.objectLike({ MinimumHealthyPercent: 100, MaximumPercent: 200, DeploymentCircuitBreaker: { Enable: true, Rollback: true } }),
      HealthCheckGracePeriodSeconds: 60,
      NetworkConfiguration: { AwsvpcConfiguration: Match.objectLike({ AssignPublicIp: 'ENABLED' }) },
    })
    t().hasResourceProperties('AWS::ECS::TaskDefinition', { Cpu: String(cfg.cpu), Memory: String(cfg.memoryMiB), RequiresCompatibilities: ['FARGATE'] })
    t().resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', cfg.autoScale ? 1 : 0)
  })

  it(`references exactly the six remonta/api/${stage}/* secrets, and the stage's environment`, () => {
    const defs = Object.values(t().findResources('AWS::ECS::TaskDefinition')) as {
      Properties: { ContainerDefinitions: { Image: unknown; Secrets: { Name: string; ValueFrom: unknown }[]; Environment: { Name: string; Value: string }[]; StopTimeout: number }[] }
    }[]
    expect(defs).toHaveLength(1)
    const c = defs[0]!.Properties.ContainerDefinitions[0]!
    expect(c.Secrets.map((s) => s.Name).sort()).toEqual([...SECRET_NAMES].sort())
    for (const s of c.Secrets) expect(JSON.stringify(s.ValueFrom)).toContain(`:secret:remonta/api/${stage}/${s.Name}`)
    const env = Object.fromEntries(c.Environment.map((e) => [e.Name, e.Value]))
    expect(env).toEqual(cfg.environment)
    for (const n of SECRET_NAMES) expect(env[n], `${n} must not be plain environment`).toBeUndefined()
    expect(c.StopTimeout).toBe(30)
    expect(JSON.stringify(c.Image)).toContain('abc1234')
  })

  it(`keeps logs for ${cfg.logRetention} days and retains the group`, () => {
    t().hasResourceProperties('AWS::Logs::LogGroup', { LogGroupName: `/remonta/api/${stage}`, RetentionInDays: cfg.logRetention })
    t().hasResource('AWS::Logs::LogGroup', { Properties: { LogGroupName: `/remonta/api/${stage}` }, DeletionPolicy: 'Retain' })
  })

  it('protects the load balancer with the WAF rules, SizeRestrictions_BODY counted not blocked', () => {
    t().hasResourceProperties('AWS::WAFv2::WebACL', {
      Scope: 'REGIONAL',
      DefaultAction: { Allow: {} },
      Rules: Match.arrayWith([
        Match.objectLike({
          Statement: {
            ManagedRuleGroupStatement: Match.objectLike({ Name: 'AWSManagedRulesCommonRuleSet', RuleActionOverrides: [{ Name: 'SizeRestrictions_BODY', ActionToUse: { Count: {} } }] }),
          },
        }),
        Match.objectLike({ Statement: { RateBasedStatement: { Limit: 1000, AggregateKeyType: 'IP' } } }),
      ]),
    })
    t().resourceCountIs('AWS::WAFv2::WebACLAssociation', 1)
    t().hasResourceProperties('AWS::Logs::LogGroup', { LogGroupName: `aws-waf-logs-remonta-api-${stage}` })
  })

  it(`has the ${cfg.alarms === 'full' ? 'seven' : 'two'} alarms of its stage, each notifying the alert topic`, () => {
    const alarms = Object.values(t().findResources('AWS::CloudWatch::Alarm')) as { Properties: { AlarmName: string; AlarmActions: unknown[] } }[]
    const names = alarms.map((a) => a.Properties.AlarmName.replace(`remonta-api-${stage}-`, '')).sort()
    const expected = cfg.alarms === 'full' ? ['5xx-rate', 'config-refused', 'cpu-high', 'healthy-hosts', 'latency-p95', 'outbox-dead-letter', 'request-failed'] : ['healthy-hosts', 'outbox-dead-letter']
    expect(names).toEqual(expected)
    for (const a of alarms) expect(a.Properties.AlarmActions, a.Properties.AlarmName).toHaveLength(1)
    t().hasResourceProperties('AWS::SNS::Subscription', { Protocol: 'email', Endpoint: 'support@remontaservices.com.au' })
    t().hasResourceProperties('AWS::Events::Rule', { EventPattern: Match.objectLike({ 'detail-type': ['ECS Deployment State Change'], detail: { eventName: ['SERVICE_DEPLOYMENT_FAILED'] } }) })
  })

  it('gives the task itself no permissions; the execution role reads only this stage’s secrets', () => {
    const policies = Object.values(t().findResources('AWS::IAM::Policy')) as { Properties: { PolicyName: string; PolicyDocument: { Statement: { Action: string | string[]; Resource: unknown }[] } } }[]
    const taskPolicies = policies.filter((p) => p.Properties.PolicyName.startsWith('TaskRole'))
    expect(taskPolicies).toEqual([])
    const secretStatements = policies.flatMap((p) => p.Properties.PolicyDocument.Statement).filter((s) => JSON.stringify(s.Action).includes('secretsmanager:GetSecretValue'))
    expect(secretStatements.length).toBeGreaterThan(0)
    for (const s of secretStatements) {
      const other = stage === 'prod' ? 'staging' : 'prod'
      expect(JSON.stringify(s.Resource)).toContain(`remonta/api/${stage}/`)
      expect(JSON.stringify(s.Resource)).not.toContain(`remonta/api/${other}/`)
    }
  })

  it('has no NAT gateway and two public subnets in 2a/2b', () => {
    t().resourceCountIs('AWS::EC2::NatGateway', 0)
    t().resourceCountIs('AWS::EC2::Subnet', 2)
    t().hasResourceProperties('AWS::EC2::Subnet', { AvailabilityZone: 'ap-southeast-2a', MapPublicIpOnLaunch: true })
    t().hasResourceProperties('AWS::EC2::Subnet', { AvailabilityZone: 'ap-southeast-2b', MapPublicIpOnLaunch: true })
    t().hasResourceProperties('AWS::EC2::VPC', { CidrBlock: cfg.vpcCidr })
  })
})

describe('the staging stage admits Vercel previews and production does not', () => {
  it('staging carries the one-label wildcard; prod carries exact values', () => {
    expect(STAGES.staging.environment.CORS_ORIGINS).toBe('https://*.vercel.app')
    expect(STAGES.staging.environment.RECAPTCHA_ALLOWED_HOSTNAMES).toBe('*.vercel.app')
    expect(STAGES.prod.environment.CORS_ORIGINS).toBe('https://app.remontaservices.com.au')
    expect(STAGES.prod.environment.RECAPTCHA_ALLOWED_HOSTNAMES).toBe('app.remontaservices.com.au')
    for (const s of Object.values(STAGES)) for (const v of Object.values(s.environment)) expect(v).not.toMatch(/\*\*|\*\.\*/)
  })
})

describe('synth without an image tag', () => {
  it('uses the local tag so tests and CI need no build', () => {
    const app = new App()
    const { prod } = buildApp(app, { account: ACCOUNT, imageTag: 'local' })
    const defs = Object.values(Template.fromStack(prod).findResources('AWS::ECS::TaskDefinition')) as { Properties: { ContainerDefinitions: { Image: unknown }[] } }[]
    expect(JSON.stringify(defs[0]!.Properties.ContainerDefinitions[0]!.Image)).toContain(':local')
  })
})
