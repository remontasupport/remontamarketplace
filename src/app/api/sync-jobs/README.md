# Job Sync API Documentation

## Overview
Secure cron job endpoint that syncs job listings from Zoho Deals (stage: "Matching") to the database.

## Security Features ✅
- **API Secret Authentication**: Prevents unauthorized access
- **Concurrency Lock**: Prevents multiple syncs running simultaneously
- **Error Handling**: Comprehensive error handling without info leakage
- **Rate Limiting**: Built-in through mutex lock

## Performance Features ⚡
- **Batch Operations**: Efficient database updates
- **Upsert Pattern**: Creates or updates records in one operation
- **Concurrent Request Safe**: Handles multiple requests without data corruption
- **Transaction Support**: Ensures data consistency

## Endpoints

### POST /api/sync-jobs
Triggers a job sync from Zoho to database.

**Authentication Required**: Yes

**Headers:**
```
x-api-secret: <SYNC_API_SECRET from .env.local>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Jobs synced successfully",
  "stats": {
    "created": 5,
    "updated": 10,
    "deactivated": 2,
    "errors": 0
  },
  "syncTime": "2025-11-11T12:00:00.000Z",
  "duration": "2345ms",
  "totalJobs": 15
}
```

**Response (Conflict - Sync in Progress):**
```json
{
  "error": "Sync already in progress",
  "lastSyncTime": "2025-11-11T11:55:00.000Z",
  "message": "Another sync is currently running. Please try again later."
}
```

**Response (Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

### GET /api/sync-jobs
Check sync status (no authentication required).

**Response:**
```json
{
  "isSyncing": false,
  "lastSyncTime": "2025-11-11T12:00:00.000Z",
  "message": "Last sync completed at 2025-11-11T12:00:00.000Z"
}
```

## Usage

### Manual Trigger (Local Development)
```bash
curl -X POST http://localhost:3000/api/sync-jobs \
  -H "x-api-secret: 3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785"
```

### Manual Trigger (Production)
```bash
curl -X POST https://www.remontaservices.com.au/api/sync-jobs \
  -H "x-api-secret: YOUR_PRODUCTION_SECRET"
```

### Check Status
```bash
curl http://localhost:3000/api/sync-jobs
```

## Setting Up Cron Job

### Option 1: Vercel Cron (Recommended for Vercel hosting)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/sync-jobs",
    "schedule": "0 */6 * * *"
  }]
}
```

**Note**: Vercel Cron automatically includes authentication. Update the route to allow Vercel Cron:
```typescript
// Check if request is from Vercel Cron
const authHeader = request.headers.get('authorization')
if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
  // Allow Vercel Cron
}
```

### Option 2: External Cron Service (EasyCron, cron-job.org)

1. Sign up for a cron service
2. Create a cron job with:
   - **URL**: `https://www.remontaservices.com.au/api/sync-jobs`
   - **Method**: POST
   - **Headers**: `x-api-secret: YOUR_SECRET`
   - **Schedule**: Every 6 hours (0 */6 * * *)

### Option 3: GitHub Actions

Create `.github/workflows/sync-jobs.yml`:
```yaml
name: Sync Jobs from Zoho

on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch: # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -X POST https://www.remontaservices.com.au/api/sync-jobs \
            -H "x-api-secret: ${{ secrets.SYNC_API_SECRET }}"
```

## How It Works

1. **Authentication**: Verifies API secret
2. **Concurrency Check**: Ensures no sync is already running
3. **Fetch from Zoho**: Gets all deals with stage = "Matching"
4. **Transform Data**: Maps Zoho fields to database schema
5. **Upsert Jobs**: Creates new jobs or updates existing ones
6. **Deactivate Missing**: Sets `active = false` for jobs no longer in "Matching"
7. **Return Stats**: Reports created/updated/deactivated counts

## Data Flow

```
Zoho Deals (Matching) → Sync API → Neon Database → Frontend
     ↓                      ↓              ↓            ↓
  16 deals           Transform       Store/Update   Display
                                     (active=true)
```

## Active Status Logic

- **Job in "Matching" stage**: `active = true` → Shows on website
- **Job moved to other stage**: `active = false` → Hidden from website
- **Job deleted in Zoho**: `active = false` → Hidden from website

## Monitoring

Check sync logs in your deployment platform:
- Vercel: Functions → Logs
- Look for `[Sync Jobs]` prefix in logs

## Troubleshooting

**Sync fails with 401 Unauthorized:**
- Check `SYNC_API_SECRET` in `.env.local`
- Ensure header `x-api-secret` matches the secret

**Sync fails with 409 Conflict:**
- Another sync is running
- Wait for completion or check logs for stuck syncs

**Sync fails with 502 Bad Gateway:**
- Zoho API is down or unreachable
- Check Zoho credentials and API limits

**Jobs not appearing on frontend:**
- Check if `active = true` in database
- Verify deals are in "Matching" stage in Zoho

## Security Best Practices

1. ✅ Never commit `.env.local` to git
2. ✅ Use different secrets for dev/staging/production
3. ✅ Rotate API secret periodically (every 90 days)
4. ✅ Monitor sync logs for suspicious activity
5. ✅ Set up alerts for sync failures
