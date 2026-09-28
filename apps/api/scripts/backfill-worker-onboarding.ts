// pnpm --filter @remonta/api backfill:onboarding [-- --apply --report=<file>]
//
// Step 10: a first onboarding marker (stage from deriveStage, source BACKFILL,
// timestamps from the facts) for every worker without one. Prints the stage
// distribution and how many timestamps had to be estimated. Dry run by default;
// see backfill-cli.ts for the flags and the database variable.
import { backfillWorkerOnboarding, formatOnboardingReport } from '../src/modules/onboarding/backfill'
import { runBackfill } from './backfill-cli'

await runBackfill('backfill-worker-onboarding', backfillWorkerOnboarding, formatOnboardingReport)
