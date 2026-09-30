#!/usr/bin/env node
// `cdk` entry point (cdk.json → npx tsx bin/remonta-api.ts). The composition lives in
// lib/app.ts so the tests can build the same app with a fixed account.
// The image tag comes from context (-c imageTag=<sha>); without one, 'local'.
import { App } from 'aws-cdk-lib'
import { buildApp, PLACEHOLDER_ACCOUNT } from '../lib/app'

const app = new App()
buildApp(app, {
  account: process.env.CDK_DEFAULT_ACCOUNT ?? PLACEHOLDER_ACCOUNT,
  imageTag: (app.node.tryGetContext('imageTag') as string | undefined) ?? 'local',
})
