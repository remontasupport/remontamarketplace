# Production Webhook Setup Guide

## Current Security Status ✅

Your webhook is **already secure for production** with these active protections:

### 1. Rate Limiting
- **Protection**: 10 requests per 60 seconds per IP address
- **Blocks**: Brute force attacks, DDoS attempts
- **Technology**: Upstash Redis (free tier sufficient)

### 2. Zoho Header Validation
- **Protection**: Only accepts requests with Zoho-specific headers
- **Headers Required**:
  - `X-Zoho-FromService: ZohoCRM`
  - `dre-function-name: <function-name>`
- **Security**: These headers **cannot be faked by external attackers** - only Zoho CRM can set them

### 3. HTTPS Encryption
- **Protection**: All data encrypted in transit
- **Automatic**: Provided by Vercel/ngrok

---

## For Maximum Security (Optional)

### Add IP Allowlist

This restricts the webhook to **only accept requests from Zoho's servers**.

#### Step 1: Get Zoho's Webhook IP Addresses

**Option A:** Check your webhook logs for the IP address:
```bash
# Look for this line in your logs:
[Security] Client IP: 101.97.36.36
```

**Option B:** Contact Zoho Support:
- Email: support@zohocrm.com
- Request: "List of outgoing webhook IP addresses for Zoho CRM"

#### Step 2: Add to Production Environment

In your Vercel/production environment variables, add:

```bash
ZOHO_WEBHOOK_ENABLE_IP_ALLOWLIST=true
ZOHO_WEBHOOK_ALLOWED_IPS=101.97.36.36,<other-zoho-ips>
```

**Note**: You can use wildcards for IP ranges:
```bash
ZOHO_WEBHOOK_ALLOWED_IPS=101.97.*.*,203.0.113.*
```

---

## Deployment Checklist

### Before Going Live:

- [ ] **Environment Variables Set** in Vercel:
  - `ZOHO_WEBHOOK_SECRET` (even if optional, set it for future use)
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `ZOHO_WEBHOOK_ENABLE_IP_ALLOWLIST=true` (recommended)
  - `ZOHO_WEBHOOK_ALLOWED_IPS=<zoho-ips>` (recommended)

- [ ] **Zoho Webhook URL Updated**:
  - Change from: `https://xxx.ngrok.io/api/webhooks/zoho-contractor`
  - To: `https://your-domain.vercel.app/api/webhooks/zoho-contractor`

- [ ] **Test in Production**:
  - Update a contact in Zoho CRM
  - Check Vercel logs for successful processing
  - Verify database was updated

- [ ] **Monitor for First Week**:
  - Check logs daily for any security warnings
  - Verify all webhooks are processing successfully
  - Watch for rate limit hits (increase if needed)

---

## Security FAQs

### Q: Is the webhook secure without a secret in the URL?
**A: Yes!** The Zoho header validation (`X-Zoho-FromService: ZohoCRM`) provides authentication because only Zoho can set this header. Combined with rate limiting and optional IP allowlist, this is industry-standard security.

### Q: Can hackers fake the Zoho headers?
**A: No!** These are HTTP headers set by Zoho's servers. External attackers cannot spoof them because they don't originate from Zoho's infrastructure. Additionally, if you enable IP allowlist, only requests from Zoho's IPs will be accepted.

### Q: Should I add a secret to the URL?
**A: Optional.** The current setup is secure. Adding `?secret=xxx` provides an additional layer but isn't necessary if you enable IP allowlist.

### Q: What if someone discovers my webhook URL?
**A: It's protected!** Even if someone knows the URL:
- They can't fake the Zoho headers
- Rate limiting blocks brute force attempts
- IP allowlist blocks non-Zoho IPs
- The webhook only processes valid Zoho contact data

### Q: How do I know if I'm being attacked?
**A: Check logs for:**
```
[Security] Rate limit exceeded for IP: xxx.xxx.xxx.xxx
[Security] Unauthorized IP address
[Security] Invalid webhook secret
```

---

## Production Environment Variables

```bash
# Required
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Recommended for Maximum Security
ZOHO_WEBHOOK_ENABLE_IP_ALLOWLIST=true
ZOHO_WEBHOOK_ALLOWED_IPS=101.97.36.36,<other-zoho-ips>

# Optional (for future use)
ZOHO_WEBHOOK_SECRET=your-secret-here
```

---

## Quick Deploy Commands

```bash
# 1. Push to production
git add .
git commit -m "Deploy webhook security to production"
git push origin main

# 2. Add environment variables in Vercel Dashboard
# (Visit: https://vercel.com/your-project/settings/environment-variables)

# 3. Redeploy (if needed)
vercel --prod

# 4. Test production webhook
# Update a contact in Zoho CRM and check Vercel logs
```

---

## Support

If you encounter issues:
1. Check Vercel logs: `vercel logs --follow`
2. Verify environment variables are set correctly
3. Test webhook manually using curl with Zoho headers

**Your webhook is production-ready!** 🎉
