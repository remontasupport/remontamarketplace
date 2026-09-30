// Alerts and the dashboard (infrastructure-design §7). Every alarm notifies one SNS
// topic whose email subscription the user confirms at first deploy. Staging runs
// the 'minimal' set: a task down, or an outbox event that will never be delivered.
// Production runs all seven of the design. The metric filters read the service's
// JSON logs (pino): the field names below are the ones apps/api writes.
import { Duration } from 'aws-cdk-lib'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions'
import type * as ecs from 'aws-cdk-lib/aws-ecs'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions'
import type { Construct } from 'constructs'
import type { StageConfig } from './stages'

export interface ObservabilityProps {
  readonly config: StageConfig
  readonly loadBalancer: elbv2.ApplicationLoadBalancer
  readonly targetGroup: elbv2.ApplicationTargetGroup
  readonly service: ecs.FargateService
  readonly logGroup: logs.LogGroup
  readonly wafMetricName: string
}

export class Observability {
  readonly topic: sns.Topic
  readonly alarms: cloudwatch.Alarm[] = []
  readonly dashboard: cloudwatch.Dashboard

  constructor(scope: Construct, props: ObservabilityProps) {
    const { config, loadBalancer, targetGroup, service, logGroup } = props
    const name = `remonta-api-${config.stage}`

    this.topic = new sns.Topic(scope, 'Alerts', { topicName: `${name}-alerts`, displayName: `Remonta api ${config.stage} alerts` })
    this.topic.addSubscription(new subscriptions.EmailSubscription(config.alertEmail))

    const alarm = (id: string, props: cloudwatch.AlarmProps) => {
      const a = new cloudwatch.Alarm(scope, id, { ...props, alarmName: `${name}-${props.alarmName}` })
      a.addAlarmAction(new cwActions.SnsAction(this.topic))
      a.addOkAction(new cwActions.SnsAction(this.topic))
      this.alarms.push(a)
      return a
    }

    // ---- metric filters over the service's own log lines ---------------------------
    const filterMetric = (id: string, metricName: string, filterPattern: logs.IFilterPattern) => {
      new logs.MetricFilter(scope, id, {
        logGroup,
        metricNamespace: 'Remonta/Api',
        metricName: `${metricName}-${config.stage}`,
        filterPattern,
        metricValue: '1',
        defaultValue: 0,
      })
      return new cloudwatch.Metric({ namespace: 'Remonta/Api', metricName: `${metricName}-${config.stage}`, statistic: 'Sum', period: Duration.minutes(5) })
    }
    const outboxDeadLetter = filterMetric('OutboxDeadLetterFilter', 'outboxDeadLetter', logs.FilterPattern.stringValue('$.alert', '=', 'outbox-dead-letter'))
    const requestFailed = filterMetric('RequestFailedFilter', 'requestFailed', logs.FilterPattern.stringValue('$.msg', '=', 'request failed'))
    const configRefused = filterMetric('ConfigRefusedFilter', 'configRefused', logs.FilterPattern.literal('"apps/api will not start"'))

    // ---- the alarms -------------------------------------------------------------------
    alarm('HealthyHostsAlarm', {
      alarmName: 'healthy-hosts',
      alarmDescription: `Fewer than ${config.desiredCount} healthy api task(s) behind the load balancer for 2 minutes`,
      metric: targetGroup.metrics.healthyHostCount({ period: Duration.minutes(1), statistic: 'Minimum' }),
      threshold: config.desiredCount,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    })
    alarm('OutboxDeadLetterAlarm', {
      alarmName: 'outbox-dead-letter',
      alarmDescription: "An outbox event exhausted its retries: look at outbox_events WHERE status='DEAD'",
      metric: outboxDeadLetter,
      threshold: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    })

    if (config.alarms === 'full') {
      const requests = loadBalancer.metrics.requestCount({ period: Duration.minutes(5), statistic: 'Sum' })
      const target5xx = loadBalancer.metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT, { period: Duration.minutes(5), statistic: 'Sum' })
      alarm('FiveXxRateAlarm', {
        alarmName: '5xx-rate',
        alarmDescription: 'More than 2 % of responses are 5xx over 5 minutes (at least 20 requests)',
        metric: new cloudwatch.MathExpression({
          expression: 'IF(requests >= 20, 100 * FILL(errors, 0) / requests, 0)',
          usingMetrics: { requests, errors: target5xx },
          period: Duration.minutes(5),
          label: '5xx %',
        }),
        threshold: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      })
      alarm('LatencyP95Alarm', {
        alarmName: 'latency-p95',
        alarmDescription: 'p95 response time above 2 s over 5 minutes (saturation)',
        metric: targetGroup.metrics.targetResponseTime({ period: Duration.minutes(5), statistic: 'p95' }),
        threshold: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      })
      alarm('CpuHighAlarm', {
        alarmName: 'cpu-high',
        alarmDescription: 'Service CPU above 80 % for 10 minutes (scaling ceiling)',
        metric: service.metricCpuUtilization({ period: Duration.minutes(5), statistic: 'Average' }),
        threshold: 80,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      })
      alarm('RequestFailedAlarm', {
        alarmName: 'request-failed',
        alarmDescription: 'Five or more 500s in 5 minutes',
        metric: requestFailed,
        threshold: 5,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      })
      alarm('ConfigRefusedAlarm', {
        alarmName: 'config-refused',
        alarmDescription: 'A task refused to start: a configuration or contract problem (see the log group)',
        metric: configRefused,
        threshold: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      })
    }

    // ---- a deployment the circuit breaker rolled back ----------------------------------
    new events.Rule(scope, 'DeploymentFailedRule', {
      ruleName: `${name}-deployment-rolled-back`,
      description: 'ECS deployment circuit breaker fired',
      eventPattern: {
        source: ['aws.ecs'],
        detailType: ['ECS Deployment State Change'],
        detail: { eventName: ['SERVICE_DEPLOYMENT_FAILED'] },
        resources: [service.serviceArn],
      },
      targets: [new targets.SnsTopic(this.topic)],
    })

    // ---- dashboard ------------------------------------------------------------------
    this.dashboard = new cloudwatch.Dashboard(scope, 'Dashboard', { dashboardName: name })
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({ title: 'Requests / 5xx', left: [loadBalancer.metrics.requestCount()], right: [loadBalancer.metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT)], width: 8 }),
      new cloudwatch.GraphWidget({
        title: 'Response time p50 / p95',
        left: [targetGroup.metrics.targetResponseTime({ statistic: 'p50' }), targetGroup.metrics.targetResponseTime({ statistic: 'p95' })],
        width: 8,
      }),
      new cloudwatch.GraphWidget({ title: 'Healthy hosts', left: [targetGroup.metrics.healthyHostCount()], width: 8 }),
    )
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({ title: 'CPU / memory', left: [service.metricCpuUtilization()], right: [service.metricMemoryUtilization()], width: 8 }),
      new cloudwatch.GraphWidget({ title: 'Outbox dead letters', left: [outboxDeadLetter], width: 8 }),
      new cloudwatch.GraphWidget({
        title: 'WAF blocked requests',
        left: [new cloudwatch.Metric({ namespace: 'AWS/WAFV2', metricName: 'BlockedRequests', dimensionsMap: { WebACL: props.wafMetricName, Region: 'ap-southeast-2', Rule: 'ALL' }, statistic: 'Sum' })],
        width: 8,
      }),
    )
  }
}
