# Admin User Impersonation

This feature allows administrators to access user accounts without knowing their passwords for customer support and debugging purposes.

## Security Features

✅ **Secure & Production-Ready**
- Only users with `ADMIN` role can impersonate
- No passwords required - uses secure session tokens
- Full audit trail of all impersonation events
- Stores impersonator ID for accountability
- Time-stamped logs for compliance

❌ **What This Is NOT**
- This is NOT a master password system (security vulnerability)
- This does NOT bypass authentication
- This does NOT allow access without logging

## How It Works

1. **Admin initiates impersonation** → API validates admin role
2. **Impersonation logged** → Creates audit log entries for both admin and target user
3. **Session created** → New session with impersonation flag
4. **Admin views as user** → Full access to user's account
5. **Exit impersonation** → Returns to admin dashboard, logs the exit

## Usage

### Option 1: Using the React Component (Recommended)

```tsx
import { ImpersonationButton, ImpersonationBanner } from '@/components/admin/ImpersonationButton'
import { useSession } from 'next-auth/react'
import { isImpersonating } from '@/lib/impersonation'

function AdminUserList() {
  const { data: session } = useSession()

  return (
    <div>
      {/* Show banner if currently impersonating */}
      {isImpersonating(session) && <ImpersonationBanner />}

      {/* User list with impersonation buttons */}
      <table>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>
                <ImpersonationButton
                  userEmail={user.email}
                  userName={user.name}
                  userRole={user.role}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Option 2: Using the Helper Functions

```tsx
import { startImpersonation, endImpersonation, getRoleBasedDashboard } from '@/lib/impersonation'

async function handleImpersonate(userEmail: string) {
  const result = await startImpersonation({
    userEmail,
    reason: 'Customer support - debugging issue #123'
  })

  if (result.success) {
    const dashboardUrl = getRoleBasedDashboard(result.data.targetUser.role)
    window.location.href = dashboardUrl
  } else {
    alert(result.error)
  }
}

async function handleExitImpersonation() {
  const result = await endImpersonation()

  if (result.success) {
    window.location.href = '/admin'
  }
}
```

### Option 3: Direct API Calls

**Start Impersonation:**
```bash
POST /api/admin/impersonate
Content-Type: application/json

{
  "userEmail": "user@example.com",
  "reason": "Customer support ticket #123"
}
```

**End Impersonation:**
```bash
DELETE /api/admin/impersonate
```

## Audit Trail

All impersonation events are logged in the `audit_logs` table:

```sql
-- View all impersonation events
SELECT
  al.createdAt,
  u.email as admin_email,
  al.metadata->>'targetUserEmail' as target_email,
  al.metadata->>'reason' as reason,
  al.action
FROM audit_logs al
JOIN users u ON u.id = al.userId
WHERE al.action IN ('IMPERSONATION_START', 'IMPERSONATION_END')
ORDER BY al.createdAt DESC;
```

## Best Practices

1. **Always provide a reason** - Include ticket number or description
2. **Use for legitimate purposes only** - Customer support, debugging, testing
3. **Exit when done** - Don't leave impersonation sessions active
4. **Review audit logs** - Periodically check impersonation history
5. **Limit admin access** - Only give ADMIN role to trusted users

## Examples

### Customer Support Scenario

```tsx
// Customer reports they can't see their dashboard
// Admin impersonates to debug

const result = await startImpersonation({
  userEmail: 'customer@example.com',
  reason: 'Support ticket #456 - Dashboard not loading'
})

// View as customer, identify the issue, fix it
// Exit impersonation when done

await endImpersonation()
```

### Testing Different Roles

```tsx
// Test how the WORKER dashboard looks
await startImpersonation({
  userEmail: 'test.worker@example.com',
  reason: 'Testing worker dashboard UI updates'
})

// Test CLIENT dashboard
await startImpersonation({
  userEmail: 'test.client@example.com',
  reason: 'Testing client onboarding flow'
})
```

## Compliance & Privacy

- All impersonation is logged with timestamps
- Metadata includes: admin ID, target user ID, reason, timestamp
- Logs are immutable (cannot be deleted via normal operations)
- Admins are identified by their user ID in logs
- Consider notifying users when their account is accessed (optional)

## Troubleshooting

**Error: "Forbidden - ADMIN role required"**
- Only users with ADMIN role can impersonate
- Check `session.user.role === 'ADMIN'`

**Error: "User not found"**
- Verify the email address is correct
- User must exist in the database

**Error: "Cannot impersonate suspended account"**
- Only ACTIVE accounts can be impersonated
- Activate the account first

**Impersonation session not working?**
- Check that Prisma schema is migrated
- Verify NextAuth callbacks are updated
- Check browser console for errors

## Migration Required

Before using this feature, run the database migration:

```bash
npm run db:push
```

This adds the `impersonatedBy` field to the Session table and new audit actions.
