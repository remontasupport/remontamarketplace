# Admin Verification Workflow - Complete Guide

## Overview

Your system is designed with **admin-controlled verification** where workers must be manually approved before accessing advanced features.

---

## Verification Status Flow

```
NOT_STARTED
    ↓ (Worker uploads documents)
IN_PROGRESS
    ↓ (Worker clicks "Submit for Review")
PENDING_REVIEW ← Admin fetches these workers
    ↓
    ├─→ APPROVED ← Worker can use advanced features
    └─→ REJECTED ← Worker must resubmit
```

---

## Worker Capabilities by Status

### ✅ **NOT_STARTED / IN_PROGRESS / PENDING_REVIEW / REJECTED**

**Can do (BASIC features):**
- ✅ Login to dashboard
- ✅ View/edit their profile
- ✅ Upload verification documents
- ✅ View verification status
- ✅ See rejection reasons (if rejected)

**Cannot do (VERIFIED features):**
- ❌ Search for clients
- ❌ View client requests
- ❌ Accept bookings
- ❌ Message clients
- ❌ Public profile (not searchable)
- ❌ Receive notifications

### ✅ **APPROVED**

**Can do (ALL features):**
- ✅ Everything from BASIC
- ✅ Search for clients
- ✅ View client requests
- ✅ Accept bookings
- ✅ Message clients
- ✅ Public profile (searchable by clients)
- ✅ Receive notifications

---

## Admin Dashboard (Future Implementation)

### **1. Fetching Unverified Workers**

**API Endpoint:**
```typescript
GET /api/admin/verification?status=PENDING_REVIEW

Response:
{
  "workers": [
    {
      "id": "worker_123",
      "userId": "user_456",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "verificationStatus": "PENDING_REVIEW",
      "verificationSubmittedAt": "2025-10-21T10:30:00Z",
      "verificationRequirements": [
        {
          "requirementType": "police_check",
          "status": "SUBMITTED",
          "documentUrl": "https://..."
        },
        {
          "requirementType": "wwcc",
          "status": "SUBMITTED",
          "documentUrl": "https://..."
        }
      ]
    }
  ],
  "count": 5
}
```

**Helper Function:**
```typescript
import { getWorkersAwaitingVerification } from '@/lib/verification';

const workers = await getWorkersAwaitingVerification();
// Returns workers with PENDING_REVIEW status
```

---

### **2. Approving a Worker**

**API Endpoint:**
```typescript
POST /api/admin/verification

Body:
{
  "action": "approve",
  "workerProfileId": "worker_123",
  "adminUserId": "admin_789",
  "notes": "All documents verified successfully"
}

Response:
{
  "success": true,
  "message": "Worker verification approved successfully",
  "worker": {
    "id": "worker_123",
    "verificationStatus": "APPROVED",
    "approvedAt": "2025-10-21T11:00:00Z"
  }
}
```

**What Happens:**
- ✅ Worker's `verificationStatus` → APPROVED
- ✅ Worker's `isPublished` → true (profile becomes public)
- ✅ All document requirements → APPROVED
- ✅ Timestamps recorded
- ✅ Audit log created
- ✅ Worker can now access advanced features

**Helper Function:**
```typescript
import { approveWorkerVerification } from '@/lib/verification';

await approveWorkerVerification(
  workerProfileId,
  adminUserId,
  'All documents look good!'
);
```

---

### **3. Rejecting a Worker**

**API Endpoint:**
```typescript
POST /api/admin/verification

Body:
{
  "action": "reject",
  "workerProfileId": "worker_123",
  "adminUserId": "admin_789",
  "reason": "Police check document is expired. Please upload current version."
}

Response:
{
  "success": true,
  "message": "Worker verification rejected",
  "worker": {
    "id": "worker_123",
    "verificationStatus": "REJECTED",
    "rejectedAt": "2025-10-21T11:00:00Z",
    "reason": "Police check document is expired..."
  }
}
```

**What Happens:**
- ✅ Worker's `verificationStatus` → REJECTED
- ✅ Worker's `isPublished` → false (profile stays hidden)
- ✅ All document requirements → REJECTED
- ✅ Rejection reason stored
- ✅ Audit log created
- ✅ Worker sees rejection reason and can resubmit

**Helper Function:**
```typescript
import { rejectWorkerVerification } from '@/lib/verification';

await rejectWorkerVerification(
  workerProfileId,
  adminUserId,
  'Police check is expired - please upload current version'
);
```

---

### **4. Getting Verification Statistics**

**API Endpoint:**
```typescript
GET /api/admin/verification?stats=true

Response:
{
  "stats": {
    "notStarted": 12,
    "inProgress": 8,
    "pendingReview": 5,  ← These need admin attention!
    "approved": 45,
    "rejected": 3,
    "total": 73
  }
}
```

**Helper Function:**
```typescript
import { getVerificationStatistics } from '@/lib/verification';

const stats = await getVerificationStatistics();
// Shows breakdown by status
```

---

## Feature Access Control

### **Protecting Advanced Features**

**In API Routes:**
```typescript
import { requireFeatureAccess } from '@/lib/feature-access';

// In your API route
export async function POST(request: Request) {
  const session = await getSession();

  // Require worker to be verified
  await requireFeatureAccess(session.user.id, 'accept_bookings');

  // If not verified, throws error:
  // "This feature requires admin verification. Please complete your verification process."

  // Continue with booking logic...
}
```

**In Components:**
```typescript
import { canAccessFeature, getVerificationStatusMessage } from '@/lib/feature-access';

// Check access
const canMessage = await canAccessFeature(userId, 'message_clients');

if (!canMessage) {
  // Show upgrade prompt or verification required message
}

// Get status message
const status = await getVerificationStatusMessage(userId);
/*
Returns:
{
  status: 'PENDING_REVIEW',
  message: 'Your verification is under review...',
  canAccessAdvancedFeatures: false,
  nextStep: 'Wait for admin review'
}
*/
```

---

## Database Schema

### **WorkerProfile - Verification Fields**

```sql
verificationStatus        VerificationStatus  -- Enum: NOT_STARTED, IN_PROGRESS, PENDING_REVIEW, APPROVED, REJECTED
verificationChecklist     Json                -- { police_check: true, wwcc: true, ... }
submittedDocuments        Json                -- { police_check: "url", wwcc: "url", ... }
verificationSubmittedAt   DateTime            -- When worker submitted
verificationReviewedAt    DateTime            -- When admin reviewed
verificationApprovedAt    DateTime            -- When approved
verificationRejectedAt    DateTime            -- When rejected
verificationNotes         Text                -- Admin notes/rejection reason
isPublished               Boolean             -- Public profile (true only if APPROVED)
```

### **VerificationRequirement - Individual Documents**

```sql
id                  String
workerProfileId     String
requirementType     String            -- 'police_check', 'wwcc', 'ndis_screening'
requirementName     String            -- 'Police Check'
isRequired          Boolean
status              RequirementStatus -- PENDING, SUBMITTED, APPROVED, REJECTED, EXPIRED
documentUrl         String            -- URL to uploaded document
documentUploadedAt  DateTime
submittedAt         DateTime
reviewedAt          DateTime
reviewedBy          String            -- Admin user ID
approvedAt          DateTime
rejectedAt          DateTime
expiresAt           DateTime          -- For documents that expire
notes               Text
rejectionReason     Text
```

---

## Future Admin Dashboard Features

### **Page: `/dashboard/admin/verification`**

**Components to Build:**

1. **Statistics Widget**
   ```
   ┌─────────────────────────────────┐
   │ Pending Review: 5 workers       │
   │ Approved Today: 12 workers      │
   │ Rejected: 2 workers             │
   └─────────────────────────────────┘
   ```

2. **Worker Queue**
   ```
   ┌──────────────────────────────────────┐
   │ John Doe | Submitted 2 days ago      │
   │ Documents: ✓ Police ✓ WWCC ✓ NDIS   │
   │ [View Details] [Approve] [Reject]    │
   ├──────────────────────────────────────┤
   │ Jane Smith | Submitted 1 day ago     │
   │ Documents: ✓ Police ✗ WWCC ✓ NDIS   │
   │ [View Details] [Approve] [Reject]    │
   └──────────────────────────────────────┘
   ```

3. **Worker Detail Modal**
   ```
   ┌─────────────────────────────────────────┐
   │ Worker: John Doe (john@example.com)    │
   ├─────────────────────────────────────────┤
   │ Police Check:                           │
   │ ✓ Submitted on 2025-10-19              │
   │ [View Document] Expires: 2028-10-19    │
   ├─────────────────────────────────────────┤
   │ WWCC:                                   │
   │ ✓ Submitted on 2025-10-19              │
   │ [View Document] Expires: 2030-10-19    │
   ├─────────────────────────────────────────┤
   │ [Approve All] [Reject with Reason]     │
   └─────────────────────────────────────────┘
   ```

4. **Filters**
   ```
   Status: [All] [Pending] [Approved] [Rejected]
   Sort: [Oldest First] [Newest First]
   ```

---

## Example Queries for Admin Dashboard

### **Get workers awaiting review (oldest first):**
```typescript
const workers = await authPrisma.workerProfile.findMany({
  where: {
    verificationStatus: 'PENDING_REVIEW'
  },
  include: {
    user: { select: { email: true, createdAt: true } },
    verificationRequirements: true
  },
  orderBy: {
    verificationSubmittedAt: 'asc' // Oldest first (FIFO)
  }
});
```

### **Get approved workers from last 7 days:**
```typescript
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const recentlyApproved = await authPrisma.workerProfile.count({
  where: {
    verificationStatus: 'APPROVED',
    verificationApprovedAt: {
      gte: sevenDaysAgo
    }
  }
});
```

### **Get rejected workers (need attention):**
```typescript
const rejected = await authPrisma.workerProfile.findMany({
  where: {
    verificationStatus: 'REJECTED'
  },
  include: {
    user: { select: { email: true } }
  },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    verificationNotes: true, // Rejection reason
    verificationRejectedAt: true
  }
});
```

---

## Worker Dashboard Features

### **Verification Status Component**

```typescript
// In worker dashboard
const status = await getVerificationStatusMessage(userId);

return (
  <Card>
    <CardHeader>
      <CardTitle>Verification Status</CardTitle>
    </CardHeader>
    <CardContent>
      <Badge status={status.status}>
        {status.status}
      </Badge>
      <p>{status.message}</p>

      {status.nextStep && (
        <p>Next Step: {status.nextStep}</p>
      )}

      {status.reason && (
        <Alert variant="destructive">
          Rejection Reason: {status.reason}
        </Alert>
      )}

      {!status.canAccessAdvancedFeatures && (
        <Alert>
          Advanced features will be available after admin approval.
        </Alert>
      )}
    </CardContent>
  </Card>
);
```

---

## Summary

### ✅ **What's Already Built:**

1. **Database Schema** - Complete verification tracking
2. **Helper Functions** - All admin actions ready
3. **API Endpoints** - Fetch/approve/reject workers
4. **Feature Access Control** - Protect advanced features
5. **Status Messages** - User-friendly feedback

### 🔄 **To Build (Future):**

1. **Admin Dashboard UI** - Visual interface for admins
2. **Document Upload UI** - Worker uploads documents
3. **Email Notifications** - Approval/rejection emails
4. **Document Viewer** - Admin views uploaded documents
5. **Bulk Actions** - Approve/reject multiple workers

### 🎯 **Current State:**

- Workers can register & verify email ✅
- Workers login to dashboard ✅
- Workers see "verification required" message ✅
- Admins can use API to approve/reject ✅
- Advanced features are protected ✅
- Complete audit trail ✅

---

**Ready for admin dashboard implementation when you're ready!** 🚀
