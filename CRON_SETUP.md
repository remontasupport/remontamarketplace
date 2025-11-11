# Cron Job Setup Guide

## Overview

The job sync system automatically syncs job listings from Zoho Deals to your database every 6 hours using a cron job.

## Architecture

```
Cron Scheduler → /api/cron/sync-jobs → /api/sync-jobs → Zoho API → Database
                  (Vercel Cron)        (Secure Sync)
```

## Files Created

1. **`vercel.json`** - Vercel Cron configuration
2. **`/api/cron/sync-jobs/route.ts`** - Cron endpoint (called by Vercel)
3. **`/api/sync-jobs/route.ts`** - Main sync logic
4. **`/api/refresh-jobs/route.ts`** - Manual refresh endpoint

---

## Setup Instructions

### Option 1: Vercel Cron (Recommended) ✅

**Prerequisites:**
- Deployed on Vercel
- Vercel Pro plan or higher (Hobby plan has limited cron)

**Steps:**

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Add Environment Variables in Vercel Dashboard**
   - Go to: Project Settings → Environment Variables
   - Add these variables:

   ```
   SYNC_API_SECRET=3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785
   CRON_SECRET=c056ad70136b352a305d7bdc908ed5aa642c3236e239856c8d40e7f2236b564b
   ZOHO_CLIENT_ID=<your value>
   ZOHO_CLIENT_SECRET=<your value>
   ZOHO_REFRESH_TOKEN=<your value>
   ZOHO_ACCOUNTS_URL=https://accounts.zoho.com.au
   ZOHO_CRM_API_URL=https://www.zohoapis.com.au/crm/v2
   DATABASE_URL=<your neon database url>
   ```

3. **Verify Cron in Vercel Dashboard**
   - Go to: Project → Cron Jobs
   - You should see: `/api/cron/sync-jobs` scheduled for `0 */6 * * *`

4. **Test the Cron**
   - Click "Run" in Vercel Dashboard to manually trigger
   - Check logs in Vercel → Functions → Logs

**Schedule:**
- `0 */6 * * *` = Every 6 hours at minute 0
- Runs at: 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM (server time)

**To Change Schedule:**
Edit `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync-jobs",
    "schedule": "0 */4 * * *"  // Every 4 hours
  }]
}
```

Common schedules:
- Every 4 hours: `0 */4 * * *`
- Every 6 hours: `0 */6 * * *`
- Every 12 hours: `0 */12 * * *`
- Daily at 6am: `0 6 * * *`

---

### Option 2: External Cron Service (EasyCron, cron-job.org)

**Use when:**
- Not using Vercel
- Using a different hosting provider
- Need more control over cron execution

**Steps:**

1. **Sign up for a cron service:**
   - [EasyCron](https://www.easycron.com/) (Free tier available)
   - [cron-job.org](https://cron-job.org/) (Free)
   - [Render Cron Jobs](https://render.com/docs/cronjobs)

2. **Create a cron job:**
   - **URL:** `https://www.remontaservices.com.au/api/sync-jobs`
   - **Method:** POST
   - **Headers:**
     ```
     x-api-secret: 3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785
     Content-Type: application/json
     ```
   - **Schedule:** Every 6 hours (`0 */6 * * *`)

3. **Test:**
   - Use the service's "Run Now" feature
   - Check your application logs

**Security Note:**
- Keep your `SYNC_API_SECRET` secure
- Only share it with trusted cron services
- Rotate the secret periodically (every 90 days)

---

### Option 3: GitHub Actions

**Use when:**
- Your code is on GitHub
- Want version-controlled cron setup
- Free option for public repositories

**Steps:**

1. **Create `.github/workflows/sync-jobs.yml`:**

```yaml
name: Sync Jobs from Zoho

on:
  schedule:
    # Every 6 hours
    - cron: '0 */6 * * *'

  # Allow manual trigger
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Job Sync
        run: |
          curl -X POST https://www.remontaservices.com.au/api/sync-jobs \
            -H "x-api-secret: ${{ secrets.SYNC_API_SECRET }}" \
            -H "Content-Type: application/json" \
            --fail \
            --show-error

      - name: Check Status
        if: failure()
        run: echo "Job sync failed! Check the logs."
```

2. **Add Secret to GitHub:**
   - Go to: Repository → Settings → Secrets → Actions
   - Add secret: `SYNC_API_SECRET` = `3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785`

3. **Enable Actions:**
   - Go to: Repository → Actions
   - Enable workflows if disabled

4. **Test:**
   - Go to: Actions → Sync Jobs from Zoho → Run workflow

---

## Manual Refresh API

For immediate updates without waiting for the cron schedule:

### Usage

**Local:**
```bash
curl -X POST http://localhost:3000/api/refresh-jobs \
  -H "x-api-secret: 3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785"
```

**Production:**
```bash
curl -X POST https://www.remontaservices.com.au/api/refresh-jobs \
  -H "x-api-secret: 3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785"
```

**Response:**
```json
{
  "success": true,
  "message": "Jobs refreshed successfully",
  "triggeredBy": "manual",
  "stats": {
    "created": 0,
    "updated": 11,
    "deactivated": 0,
    "errors": 0
  },
  "syncTime": "2025-11-11T16:00:00.000Z",
  "duration": "3245ms",
  "totalJobs": 11
}
```

### When to Use Manual Refresh

- ✅ Just added new jobs in Zoho and want them on site immediately
- ✅ Testing after Zoho configuration changes
- ✅ Emergency updates before next scheduled sync
- ✅ After fixing data issues in Zoho

---

## Monitoring

### Check Sync Status

```bash
curl http://localhost:3000/api/sync-jobs
```

**Response:**
```json
{
  "isSyncing": false,
  "lastSyncTime": "2025-11-11T15:34:17.922Z",
  "message": "Last sync completed at 2025-11-11T15:34:17.922Z"
}
```

### View Logs

**Vercel:**
- Dashboard → Your Project → Functions → Logs
- Look for `[Sync Jobs]` and `[Cron]` prefixes

**Other platforms:**
- Check your application logs
- Search for `[Sync Jobs]`, `[Cron]`, `[Refresh Jobs]`

---

## Troubleshooting

### Cron not running

**Vercel:**
- Check: Project → Cron Jobs tab
- Ensure you're on a paid plan (Hobby has limits)
- Check environment variables are set

**External Service:**
- Verify the service is active
- Check service logs/notifications
- Ensure URL is correct and accessible

### Sync fails with 401 Unauthorized

- ❌ Wrong API secret
- ✅ Fix: Verify `SYNC_API_SECRET` in environment variables
- ✅ Ensure header is `x-api-secret` (lowercase, with hyphen)

### Sync fails with 409 Conflict

- ❌ Another sync is already running
- ✅ Wait a few minutes and try again
- ✅ Check logs for stuck syncs

### Jobs not appearing on website

- ❌ Sync succeeded but jobs not visible
- ✅ Check database: Are jobs marked `active = true`?
- ✅ Verify deals are in "Matching" stage in Zoho
- ✅ Check frontend is querying `where: { active: true }`

### Partial sync (some jobs failed)

- ❌ `stats.errors > 0`
- ✅ Check response `failedRecords` array
- ✅ Review logs for specific error messages
- ✅ Verify data integrity in Zoho for failed records

---

## Security Best Practices

1. ✅ **Never commit secrets to Git**
   - Add `.env.local` to `.gitignore`
   - Use environment variables for all secrets

2. ✅ **Use different secrets per environment**
   - Development: One set of secrets
   - Production: Different secrets

3. ✅ **Rotate secrets regularly**
   - Recommended: Every 90 days
   - After team member changes
   - If secret is compromised

4. ✅ **Monitor sync logs**
   - Set up alerts for failed syncs
   - Review logs weekly

5. ✅ **Limit API access**
   - Only trusted services should have `SYNC_API_SECRET`
   - Use firewall rules if possible

---

## Current Configuration

**Sync Frequency:** Every 6 hours

**Schedule:** `0 */6 * * *`
- 12:00 AM
- 6:00 AM
- 12:00 PM
- 6:00 PM

**Data Source:** Zoho Deals (Stage = "Matching")

**Database:** Neon PostgreSQL

**Active Jobs:** Jobs with `active = true` in database

**Deactivation Logic:** Jobs moved out of "Matching" stage → `active = false`

---

## Testing the Setup

1. **Test Manual Sync:**
   ```bash
   curl -X POST http://localhost:3000/api/sync-jobs \
     -H "x-api-secret: 3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785"
   ```

2. **Test Manual Refresh:**
   ```bash
   curl -X POST http://localhost:3000/api/refresh-jobs \
     -H "x-api-secret: 3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785"
   ```

3. **Check Status:**
   ```bash
   curl http://localhost:3000/api/sync-jobs
   ```

4. **Verify Database:**
   ```bash
   npx prisma studio
   ```
   - Go to Job table
   - Verify 11 records exist
   - Check `active` field is `true`

---

## Summary

✅ **Created:**
- Vercel cron configuration (`vercel.json`)
- Cron endpoint (`/api/cron/sync-jobs`)
- Sync API (`/api/sync-jobs`)
- Manual refresh API (`/api/refresh-jobs`)

✅ **Configured:**
- 6-hour sync schedule
- Security with API secrets
- Error handling and logging
- Concurrency protection

✅ **Ready for:**
- Automatic scheduled syncs
- Manual admin-triggered syncs
- Production deployment

**Next Steps:**
1. Deploy to Vercel (or your hosting platform)
2. Add environment variables
3. Test the cron job
4. Monitor logs for first few syncs
