# Zoho Webhook Implementation - ARCHIVED

**Archived Date:** October 20, 2025
**Reason:** Migrating to direct worker signup workflow instead of Zoho CRM integration

---

## Overview

This archive contains the complete Zoho CRM webhook implementation that was previously used to sync contractor/worker data from Zoho CRM to the Remonta platform database.

## Architecture

### Data Flow (Previous Implementation)

```
Zoho CRM Contact (Create/Update/Delete)
         ↓
  [Webhook Trigger]
         ↓
POST /api/webhooks/zoho-contractor
         ↓
  [Fetch Full Contact from Zoho API]
  [Transform Zoho Fields → Database Schema]
  [Geocode Address → Lat/Long Coordinates]
  [Upload Profile Picture → Vercel Blob]
         ↓
  [Upsert to PostgreSQL via Prisma]
         ↓
  [Data Available for SearchSupport]
```

## Archived Files

### API Routes (`/api`)
- **`webhooks/zoho-contractor/route.ts`** - Main webhook endpoint
  - Handles create/update/delete operations from Zoho
  - Supports multiple payload formats (JSON, form-encoded, query params)
  - Fallback mechanism for recently modified contacts
  - Retry logic for profile picture uploads

- **`sync-contractors-route.ts`** - Manual bulk sync endpoint
  - Fetches all contractors from Zoho CRM
  - Processes in batches of 50
  - Authentication via SYNC_API_SECRET
  - Used for initial data import or full resync

- **`test-zoho-route.ts`** - Zoho connectivity test endpoint
  - Validates environment variables
  - Tests API access and authentication
  - Verifies webhook endpoint accessibility

### Library Files (`/lib`)
- **`zoho.ts`** - Zoho CRM API service
  - OAuth token management (refresh token flow)
  - Contact fetching and querying
  - Profile picture downloads
  - Rate limit handling

- **`geocoding.ts`** - Google Maps Geocoding utilities
  - Address → Coordinates conversion
  - Distance calculation (Haversine formula)
  - Bounding box calculations
  - Used for location-based search

- **`blobStorage.ts`** - Vercel Blob storage utilities
  - Profile picture uploads
  - File name generation
  - Used for storing contractor profile images

### Documentation (`/docs`)
- `WEBHOOK_PRODUCTION_SETUP.md` - Production deployment guide
- `WEBHOOK_SECURITY_SETUP.md` - Security configuration
- `WEBHOOK_TESTING_GUIDE.md` - Testing procedures
- `ZOHO_SYNC_COMPLETE.md` - Sync completion documentation

## Key Features

### 1. Real-time Sync
- Webhooks triggered on Zoho CRM contact changes
- Automatic data synchronization within seconds
- Soft delete support (deletedAt timestamp)

### 2. Data Transformation
- Intelligent name parsing (handles various formats)
- Boolean field conversion (Yes/No → true/false)
- Years of experience validation (0-100)
- Duplicate email handling (appends Zoho ID)

### 3. Geocoding
- Converts address to coordinates for distance-based search
- Handles Australian addresses (states, postcodes, suburbs)
- Caches coordinates in database

### 4. Profile Pictures
- Downloads from Zoho Record_Image field
- Uploads to Vercel Blob storage
- Retry logic (3 attempts with exponential backoff)

### 5. Error Handling
- Graceful fallbacks for missing data
- Detailed error logging
- Batch processing with individual error tracking

## Environment Variables Required

```bash
# Zoho CRM API
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com.au
ZOHO_CRM_API_URL=https://www.zohoapis.com.au/crm/v6

# Google Maps Geocoding
GOOGLE_MAPS_API_KEY=your_api_key

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_blob_token

# Sync API Authentication
SYNC_API_SECRET=your_secret_token
```

## Database Schema (ContractorProfile)

The webhook populated the following fields:

### Identity
- `id` (UUID) - Primary key
- `zohoContactId` (String) - Zoho CRM contact ID
- `email` (String) - Unique email address

### Personal Information
- `firstName`, `lastName`
- `phone`, `gender`
- `profilePicture` (URL)

### Location
- `city`, `state`, `postalZipCode`
- `latitude`, `longitude` (for distance calculations)

### Professional Details
- `titleRole` (e.g., "Support Worker", "Physiotherapist")
- `yearsOfExperience` (Integer)
- `qualificationsAndCertifications`
- `languageSpoken`
- `hasVehicleAccess` (Boolean)

### Profile Content
- `aboutYou`
- `funFact`
- `hobbiesAndInterests`
- `whatMakesBusinessUnique`
- `additionalInformation`

### System Fields
- `createdAt`, `updatedAt`
- `lastSyncedAt` - Last webhook sync timestamp
- `deletedAt` - Soft delete marker

## API Endpoints

### Webhook Endpoint
```
POST /api/webhooks/zoho-contractor
```

**Payload Formats Supported:**
- JSON: `{ "module": "Contacts", "ids": ["123"], "operation": "update" }`
- Form-encoded: `ids=123&module=Contacts&operation=update`
- Query params: `?id=123&module=Contacts&operation=update`
- Headers: `ids: 123` (for Zoho workflow webhooks)

**Operations:**
- `insert` - Create new contractor
- `update` - Update existing contractor
- `delete` - Soft delete (sets deletedAt)

### Manual Sync Endpoint
```
POST /api/sync-contractors
Authorization: Bearer YOUR_SYNC_API_SECRET
```

**Response:**
```json
{
  "success": true,
  "message": "Contractor sync completed",
  "stats": {
    "total": 150,
    "synced": 148,
    "created": 10,
    "updated": 138,
    "errors": 2
  },
  "duration": 45230
}
```

### Test Endpoint
```
GET /api/test-zoho
```

**Response:**
```json
{
  "overallStatus": "PASSED",
  "tests": [
    { "name": "Environment Variables", "status": "passed" },
    { "name": "Zoho API Access", "status": "passed" },
    { "name": "Webhook Endpoint", "status": "passed" }
  ]
}
```

## Why This Was Archived

The Zoho CRM integration added complexity:
- Required maintaining Zoho API credentials
- Dependency on external CRM system
- Additional API calls for geocoding and image uploads
- Complex webhook payload handling
- Zoho-specific field mapping

**New Approach:**
- Direct worker signup via web forms
- Data stored directly in database
- Simpler architecture without external dependencies
- Better control over data validation and processing

## Migration Notes

### What's Still Used:
1. **`/api/contractors` endpoint** - Still used by SearchSupport
2. **Database schema** - ContractorProfile table remains unchanged
3. **Geocoding** - May still be used for new signup addresses
4. **Distance calculations** - Still used in search functionality

### What's Disabled:
1. Webhook endpoint (deprecated but not deleted)
2. Zoho sync endpoints
3. Zoho API service
4. Automatic profile picture uploads from Zoho

### Data Preservation:
- All existing contractor data remains in the database
- No data migration required
- SearchSupport continues working with existing data

## Restoring This Implementation

If you need to restore the Zoho webhook integration:

1. **Copy files back:**
   ```bash
   cp archived/zoho-webhook-implementation/api/webhooks/* src/app/api/webhooks/
   cp archived/zoho-webhook-implementation/lib/zoho.ts src/lib/
   ```

2. **Restore environment variables** (see list above)

3. **Remove deprecation notices** from webhook endpoint

4. **Configure Zoho CRM webhook** (see WEBHOOK_PRODUCTION_SETUP.md)

5. **Test with:** `GET /api/test-zoho`

## Reference Documentation

For detailed implementation details, see the archived documentation in `/docs`:
- Webhook setup and configuration
- Security best practices
- Testing procedures
- Troubleshooting guides

---

**Last Updated:** October 20, 2025
**Archived By:** Development Team
**Contact:** For questions about this implementation, check git history or contact the development team
