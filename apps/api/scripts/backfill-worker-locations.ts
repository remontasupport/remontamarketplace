// pnpm --filter @remonta/api backfill:locations [-- --apply --report=<file>]
//
// Step 10: a HOME row for every worker without one, matched from the legacy
// worker_profiles columns to au_localities. Prints matched / ambiguous / unmatched;
// ambiguous and unmatched rows are listed for review and never guessed. Dry run by
// default; see backfill-cli.ts for the flags and the database variable.
import { backfillWorkerLocations, formatLocationReport } from '../src/modules/locations/backfill'
import { runBackfill } from './backfill-cli'

await runBackfill('backfill-worker-locations', backfillWorkerLocations, formatLocationReport)
