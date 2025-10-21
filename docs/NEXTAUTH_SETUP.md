# NextAuth Environment Variables Setup

## Required Environment Variables

Add these variables to your `.env.local` file:

```bash
# ============================================
# NextAuth Configuration
# ============================================

# NextAuth Secret - REQUIRED
# Generate a secure secret key using one of these methods:
# Method 1 (recommended): openssl rand -base64 32
# Method 2: Go to https://generate-secret.vercel.app/32
# Method 3: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

NEXTAUTH_SECRET="YOUR_GENERATED_SECRET_HERE"

# NextAuth URL
# Development:
NEXTAUTH_URL=http://localhost:3000

# Production (when deploying):
# NEXTAUTH_URL=https://yourdomain.com
```

## How to Generate NEXTAUTH_SECRET

### Option 1: Using OpenSSL (Recommended)
```bash
openssl rand -base64 32
```

### Option 2: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Option 3: Online Generator
Visit: https://generate-secret.vercel.app/32

## Important Security Notes

1. **NEVER** commit `.env.local` to git
2. **ALWAYS** use different secrets for development and production
3. **STORE** production secrets securely (use environment variable management in your hosting platform)
4. **ROTATE** secrets periodically for enhanced security

## Example .env.local Addition

Add these lines to your existing `.env.local` file:

```bash
# Add this to the end of your .env.local file

# ============================================
# NextAuth Configuration (Added on 2025-10-21)
# ============================================
NEXTAUTH_SECRET="YOUR_GENERATED_SECRET_GOES_HERE"
NEXTAUTH_URL="http://localhost:3000"
```

## Verifying the Setup

After adding the environment variables:

1. Restart your development server
2. Visit http://localhost:3000/login
3. Try logging in with any email/password (mock mode)
4. Check if you get redirected to the appropriate dashboard

## Testing Different User Roles (Mock Mode)

While in development/testing mode (before database connection):

- Email containing "client" → Redirects to `/dashboard/client`
- Email containing "coordinator" → Redirects to `/dashboard/coordinator`
- Any other email → Redirects to `/dashboard/worker`

Example test credentials:
- worker@test.com (any password) → Worker Dashboard
- client@test.com (any password) → Client Dashboard
- coordinator@test.com (any password) → Coordinator Dashboard

## Next Steps

Once environment variables are set:
1. Generate NEXTAUTH_SECRET
2. Add to .env.local
3. Restart dev server (`npm run dev`)
4. Test the login flow
5. Proceed to database integration (Phase 2)
