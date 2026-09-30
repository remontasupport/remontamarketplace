// Edge protection on the load balancer (infrastructure-design §5). Default allow;
// four rules in order: IP reputation, the common rule set (with SizeRestrictions_BODY
// counted, not blocked -- it would block every photo upload and the 16 KB
// registration body; the service enforces maxBodyKb per route itself), known bad
// inputs, and a per-IP rate backstop far above the service's own limits.
// Logs go to CloudWatch Logs (the group name must start with aws-waf-logs-).
import { Fn, RemovalPolicy } from 'aws-cdk-lib'
import type * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as wafv2 from 'aws-cdk-lib/aws-wafv2'
import type { Construct } from 'constructs'
import type { Stage } from './stages'

export const RATE_LIMIT_PER_5_MIN = 1000

export interface WafProps {
  readonly stage: Stage
  readonly loadBalancer: elbv2.IApplicationLoadBalancer
}

const visibility = (metricName: string): wafv2.CfnWebACL.VisibilityConfigProperty => ({
  sampledRequestsEnabled: true,
  cloudWatchMetricsEnabled: true,
  metricName,
})

const managed = (priority: number, name: string, overrides?: wafv2.CfnWebACL.RuleActionOverrideProperty[]): wafv2.CfnWebACL.RuleProperty => ({
  name,
  priority,
  overrideAction: { none: {} },
  statement: { managedRuleGroupStatement: { vendorName: 'AWS', name, ...(overrides ? { ruleActionOverrides: overrides } : {}) } },
  visibilityConfig: visibility(name),
})

export class Waf {
  readonly webAcl: wafv2.CfnWebACL
  readonly logGroup: logs.LogGroup

  constructor(scope: Construct, props: WafProps) {
    const name = `remonta-api-${props.stage}`
    this.webAcl = new wafv2.CfnWebACL(scope, 'WebAcl', {
      name,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: visibility(name),
      rules: [
        managed(1, 'AWSManagedRulesAmazonIpReputationList'),
        managed(2, 'AWSManagedRulesCommonRuleSet', [{ name: 'SizeRestrictions_BODY', actionToUse: { count: {} } }]),
        managed(3, 'AWSManagedRulesKnownBadInputsRuleSet'),
        {
          name: 'rate-backstop',
          priority: 4,
          action: { block: {} },
          statement: { rateBasedStatement: { limit: RATE_LIMIT_PER_5_MIN, aggregateKeyType: 'IP' } },
          visibilityConfig: visibility(`${name}-rate-backstop`),
        },
      ],
    })

    new wafv2.CfnWebACLAssociation(scope, 'WebAclAssociation', {
      resourceArn: props.loadBalancer.loadBalancerArn,
      webAclArn: this.webAcl.attrArn,
    })

    this.logGroup = new logs.LogGroup(scope, 'WafLogs', {
      logGroupName: `aws-waf-logs-${name}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.RETAIN,
    })
    // WAF wants the log group ARN without the trailing ":*" that CloudFormation returns.
    new wafv2.CfnLoggingConfiguration(scope, 'WafLogging', {
      resourceArn: this.webAcl.attrArn,
      logDestinationConfigs: [Fn.select(0, Fn.split(':*', this.logGroup.logGroupArn))],
    })
  }
}
