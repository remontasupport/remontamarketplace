// One deployment of apps/api (infrastructure-design §2-§8), parameterised by stage
// (lib/stages.ts). Instantiated twice: RemontaApiStaging and RemontaApiProd.
//
// Network: a VPC with two public subnets and no NAT; tasks get a public IP for
// egress, and nothing reaches them except the load balancer (the api security group
// admits only the alb group on 4000). Edge: ACM certificate, TLS 1.2+, 80 → 443,
// access logs to S3, WAF. Compute: ECS Fargate, rolling deploys with the circuit
// breaker, health check on the contract's probe entry. Configuration: plain
// environment from the stage table, six secrets from Secrets Manager read by the
// execution role at task start. Nothing here is an image-specific setting: the image
// tag is a CDK context value passed by the deploy workflow.
import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import type * as ecr from 'aws-cdk-lib/aws-ecr'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import type { Construct } from 'constructs'
import { Observability } from './observability'
import { SECRET_NAMES, secretPath, type StageConfig } from './stages'
import { Waf } from './waf'

export const CONTAINER_PORT = 4000
export const HEALTH_PATH = '/v1/health'
export const AVAILABILITY_ZONES = ['ap-southeast-2a', 'ap-southeast-2b']

export interface ApiStackProps extends StackProps {
  readonly config: StageConfig
  readonly repository: ecr.IRepository
  /** The image tag to run (a git SHA from the workflow; 'local' when synthesising without one). */
  readonly imageTag: string
}

export class ApiStack extends Stack {
  readonly vpc: ec2.Vpc
  readonly loadBalancer: elbv2.ApplicationLoadBalancer
  readonly service: ecs.FargateService
  readonly logGroup: logs.LogGroup

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)
    const { config } = props
    const name = `remonta-api-${config.stage}`

    // ---- network (§3) ------------------------------------------------------------------
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: name,
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
      availabilityZones: AVAILABILITY_ZONES,
      natGateways: 0,
      subnetConfiguration: [{ name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 20 }],
    })
    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', { vpc: this.vpc, securityGroupName: `${name}-alb`, description: 'load balancer: 80/443 from the internet', allowAllOutbound: false })
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'https from anywhere')
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'http from anywhere (redirected to https)')
    const apiSg = new ec2.SecurityGroup(this, 'ApiSecurityGroup', { vpc: this.vpc, securityGroupName: `${name}-api`, description: 'api tasks: 4000 from the load balancer only', allowAllOutbound: false })
    apiSg.addIngressRule(albSg, ec2.Port.tcp(CONTAINER_PORT), 'from the load balancer')
    albSg.addEgressRule(apiSg, ec2.Port.tcp(CONTAINER_PORT), 'to the api tasks')
    apiSg.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Resend, Google, HIBP, Vercel Blob, n8n')
    apiSg.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5432), 'Neon over TLS')

    // ---- edge (§4) ----------------------------------------------------------------------
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: config.hostname,
      validation: acm.CertificateValidation.fromDns(), // the CNAME goes into Vercel DNS (runbook step 2)
    })
    const accessLogs = new s3.Bucket(this, 'AlbAccessLogs', {
      bucketName: `${name}-alb-logs-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: false,
      lifecycleRules: [{ expiration: Duration.days(90) }],
      removalPolicy: RemovalPolicy.RETAIN,
    })
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      loadBalancerName: name,
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSg,
      idleTimeout: Duration.seconds(60),
      dropInvalidHeaderFields: true,
      http2Enabled: true,
    })
    this.loadBalancer.logAccessLogs(accessLogs)
    this.loadBalancer.addRedirect({ sourcePort: 80, sourceProtocol: elbv2.ApplicationProtocol.HTTP, targetPort: 443, targetProtocol: elbv2.ApplicationProtocol.HTTPS })
    const https = this.loadBalancer.addListener('Https', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      sslPolicy: elbv2.SslPolicy.RECOMMENDED_TLS,
    })

    // ---- compute (§2) --------------------------------------------------------------------
    const cluster = new ecs.Cluster(this, 'Cluster', { clusterName: name, vpc: this.vpc, containerInsightsV2: ecs.ContainerInsights.DISABLED })
    this.logGroup = new logs.LogGroup(this, 'Logs', {
      logGroupName: `/remonta/api/${config.stage}`,
      retention: config.logRetention,
      removalPolicy: RemovalPolicy.RETAIN,
    })
    // The process itself calls no AWS API in S1 (§8); the role exists so a later unit adds a statement.
    const taskRole = new iam.Role(this, 'TaskRole', { roleName: `${name}-task`, assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com') })
    const executionRole = new iam.Role(this, 'TaskExecutionRole', { roleName: `${name}-task-execution`, assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com') })
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      family: name,
      cpu: config.cpu,
      memoryLimitMiB: config.memoryMiB,
      taskRole,
      executionRole,
      runtimePlatform: { cpuArchitecture: ecs.CpuArchitecture.X86_64, operatingSystemFamily: ecs.OperatingSystemFamily.LINUX },
    })
    const secrets = Object.fromEntries(
      SECRET_NAMES.map((n) => [n, ecs.Secret.fromSecretsManager(secretsmanager.Secret.fromSecretNameV2(this, `Secret${n}`, secretPath(config.stage, n)))]),
    )
    taskDefinition.addContainer('api', {
      containerName: 'api',
      image: ecs.ContainerImage.fromEcrRepository(props.repository, props.imageTag),
      environment: { ...config.environment },
      secrets,
      portMappings: [{ containerPort: CONTAINER_PORT, protocol: ecs.Protocol.TCP }],
      logging: ecs.LogDrivers.awsLogs({ logGroup: this.logGroup, streamPrefix: 'api' }),
      stopTimeout: Duration.seconds(30),
      readonlyRootFilesystem: false, // PHOTO_LOCAL_DIR is unused (vercel-blob) but the runtime writes temp files
    })

    this.service = new ecs.FargateService(this, 'Service', {
      serviceName: name,
      cluster,
      taskDefinition,
      desiredCount: config.desiredCount,
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [apiSg],
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      circuitBreaker: { enable: true, rollback: true },
      healthCheckGracePeriod: Duration.seconds(60),
      enableExecuteCommand: false,
    })
    if (config.autoScale) {
      this.service
        .autoScaleTaskCount({ minCapacity: config.minCount, maxCapacity: config.maxCount })
        .scaleOnCpuUtilization('Cpu', { targetUtilizationPercent: 60, scaleInCooldown: Duration.minutes(5), scaleOutCooldown: Duration.minutes(1) })
    }

    const targetGroup = https.addTargets('Api', {
      targetGroupName: name,
      port: CONTAINER_PORT,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.service],
      deregistrationDelay: Duration.seconds(20),
      healthCheck: {
        path: HEALTH_PATH,
        interval: Duration.seconds(15),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        healthyHttpCodes: '200',
      },
    })

    // ---- edge protection (§5) and alerting (§7) ------------------------------------------
    const waf = new Waf(this, { stage: config.stage, loadBalancer: this.loadBalancer })
    new Observability(this, { config, loadBalancer: this.loadBalancer, targetGroup, service: this.service, logGroup: this.logGroup, wafMetricName: name })

    // ---- outputs ---------------------------------------------------------------------------
    new CfnOutput(this, 'ApiLoadBalancerDns', { value: this.loadBalancer.loadBalancerDnsName, description: `CNAME target for ${config.hostname} (Vercel DNS)` })
    new CfnOutput(this, 'ApiHostname', { value: config.hostname })
    new CfnOutput(this, 'ServiceName', { value: this.service.serviceName })
    new CfnOutput(this, 'ClusterName', { value: cluster.clusterName })
    new CfnOutput(this, 'LogGroupName', { value: this.logGroup.logGroupName })
    new CfnOutput(this, 'CertificateArn', { value: certificate.certificateArn })
    new CfnOutput(this, 'WebAclArn', { value: waf.webAcl.attrArn })
  }
}
