// Renders a stage into the Knative Service definition Cloud Run runs (D15).
//
// `gcloud run services replace <file>` applies exactly this document. Two values
// are unknown until deploy time and are left as placeholders the workflow fills
// with sed: __PROJECT_ID__ (the service account's project) and __IMAGE_TAG__ (the
// git SHA). Everything else -- CPU always allocated, instance bounds, probes on the
// contract's probe entry, the plain environment, the six secret references -- comes
// from lib/stages.ts and nowhere else.
import { stringify } from 'yaml'
import { CONTAINER_PORT, HEALTH_PATH, imageName, REGION, runtimeServiceAccount, SECRET_NAMES, secretName, STAGES, type Stage } from './stages'

export const PROJECT_PLACEHOLDER = '__PROJECT_ID__'
export const TAG_PLACEHOLDER = '__IMAGE_TAG__'
/** Replaced per workflow run and attempt: `gcloud run services replace` makes a new
 *  revision only when the template changes, and secrets (`latest`) are read when a
 *  revision starts -- so without it, re-running a deploy after a secret fix changes nothing. */
export const DEPLOY_PLACEHOLDER = '__DEPLOY_ID__'

export interface KnativeService {
  apiVersion: 'serving.knative.dev/v1'
  kind: 'Service'
  metadata: { name: string; labels: Record<string, string>; annotations: Record<string, string> }
  spec: {
    template: {
      metadata: { labels: Record<string, string>; annotations: Record<string, string> }
      spec: {
        serviceAccountName: string
        containerConcurrency: number
        timeoutSeconds: number
        containers: [
          {
            name: 'api'
            image: string
            ports: [{ name: 'http1'; containerPort: number }]
            env: ({ name: string; value: string } | { name: string; valueFrom: { secretKeyRef: { name: string; key: 'latest' } } })[]
            resources: { limits: { cpu: string; memory: string } }
            startupProbe: { httpGet: { path: string; port: number }; initialDelaySeconds: number; periodSeconds: number; timeoutSeconds: number; failureThreshold: number }
            livenessProbe: { httpGet: { path: string; port: number }; periodSeconds: number; timeoutSeconds: number; failureThreshold: number }
          },
        ]
      }
    }
    traffic: [{ percent: 100; latestRevision: true }]
  }
}

export function renderService(stage: Stage, projectId = PROJECT_PLACEHOLDER, imageTag = TAG_PLACEHOLDER): KnativeService {
  const c = STAGES[stage]
  const labels = { 'remonta-project': 'remonta', 'remonta-service': 'api', 'remonta-stage': stage }
  return {
    apiVersion: 'serving.knative.dev/v1',
    kind: 'Service',
    metadata: {
      name: c.serviceName,
      labels: { ...labels, 'cloud.googleapis.com/location': REGION },
      annotations: {
        'run.googleapis.com/ingress': 'all',
        // Public: browsers and the deploy's health check call it with no Google identity.
        // This skips the invoker IAM check instead of granting allUsers, which an
        // organisation's domain-restricted-sharing policy may forbid.
        'run.googleapis.com/invoker-iam-disabled': 'true',
        'run.googleapis.com/description': `apps/api ${stage} -- rendered from infra/lib/stages.ts; do not edit by hand`,
      },
    },
    spec: {
      template: {
        metadata: {
          labels,
          annotations: {
            // Instance-based billing: CPU stays allocated between requests (the outbox dispatcher, the scheduler).
            'run.googleapis.com/cpu-throttling': 'false',
            'run.googleapis.com/startup-cpu-boost': 'true',
            'run.googleapis.com/execution-environment': 'gen2',
            'autoscaling.knative.dev/minScale': String(c.minInstances),
            'autoscaling.knative.dev/maxScale': String(c.maxInstances),
            'remonta-deploy-id': DEPLOY_PLACEHOLDER,
          },
        },
        spec: {
          serviceAccountName: runtimeServiceAccount(stage, projectId),
          containerConcurrency: c.concurrency,
          timeoutSeconds: c.timeoutSeconds,
          containers: [
            {
              name: 'api',
              image: imageName(projectId, imageTag),
              ports: [{ name: 'http1', containerPort: CONTAINER_PORT }],
              env: [
                ...Object.entries(c.environment).map(([name, value]) => ({ name, value })),
                ...SECRET_NAMES.map((name) => ({ name, valueFrom: { secretKeyRef: { name: secretName(stage, name), key: 'latest' as const } } })),
              ],
              resources: { limits: { cpu: c.cpu, memory: c.memory } },
              // The probe entry: never load-shed, served over plain HTTP (the checker sends no X-Forwarded-Proto).
              startupProbe: { httpGet: { path: HEALTH_PATH, port: CONTAINER_PORT }, initialDelaySeconds: 2, periodSeconds: 3, timeoutSeconds: 3, failureThreshold: 20 },
              livenessProbe: { httpGet: { path: HEALTH_PATH, port: CONTAINER_PORT }, periodSeconds: 15, timeoutSeconds: 5, failureThreshold: 3 },
            },
          ],
        },
      },
      traffic: [{ percent: 100, latestRevision: true }],
    },
  }
}

const HEADER = `# GENERATED by \`pnpm --filter @remonta/infra run render\` from infra/lib/stages.ts -- do not edit.\n# Deployed with: sed "s/__PROJECT_ID__/$PROJECT/g; s/__IMAGE_TAG__/$SHA/g; s/__DEPLOY_ID__/$RUN/g" | gcloud run services replace - --region ${REGION}\n`

export function renderYaml(stage: Stage): string {
  return HEADER + stringify(renderService(stage), { lineWidth: 0 })
}
