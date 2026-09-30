#!/usr/bin/env bash
# After `cdk deploy` of an api stage: wait for the ECS service to settle (the circuit
# breaker has rolled back by then if the new tasks never became healthy), then prove
# the deployed service answers its probe with 200. A rolled-back deploy therefore
# fails this job visibly instead of reporting success.
#
# Usage: api-health.sh <staging|prod>     (AWS credentials and AWS_REGION in the environment)
#
# The check prefers the public hostname. On the very first deploy of a stage the
# CNAME may not exist yet, so it falls back to the load balancer's own DNS name
# (from the stack output) with the Host header set and certificate checks off --
# enough to prove the service, not the DNS.
set -euo pipefail

stage="${1:?stage (staging|prod)}"
case "$stage" in
  staging) stack=RemontaApiStaging; host=api-staging.remontaservices.com.au ;;
  prod)    stack=RemontaApiProd;    host=api.remontaservices.com.au ;;
  *) echo "unknown stage: $stage" >&2; exit 2 ;;
esac
cluster="remonta-api-$stage"
service="remonta-api-$stage"

echo "waiting for ECS service $service to settle..."
aws ecs wait services-stable --cluster "$cluster" --services "$service"

rollout=$(aws ecs describe-services --cluster "$cluster" --services "$service" \
  --query 'services[0].deployments[?status==`PRIMARY`].rolloutState' --output text)
echo "primary deployment rollout state: $rollout"
if [ "$rollout" != "COMPLETED" ]; then
  echo "the deployment did not complete (circuit breaker rolled back?)" >&2
  exit 1
fi

probe() { curl -sS -o /tmp/health.json -w '%{http_code}' --max-time 10 "$@" || echo 000; }

code=$(probe "https://$host/v1/health")
if [ "$code" != "200" ]; then
  echo "https://$host/v1/health answered $code; trying the load balancer directly (DNS may not exist yet)"
  alb=$(aws cloudformation describe-stacks --stack-name "$stack" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiLoadBalancerDns'].OutputValue" --output text)
  code=$(probe -k -H "Host: $host" "https://$alb/v1/health")
fi
echo "health: $code $(cat /tmp/health.json 2>/dev/null || true)"
[ "$code" = "200" ] || { echo "health check failed" >&2; exit 1; }
