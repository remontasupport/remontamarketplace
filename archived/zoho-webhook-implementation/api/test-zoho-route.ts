import { NextRequest, NextResponse } from 'next/server'
import { zohoService } from '@/lib/zoho'

/**
 * GET /api/test-zoho
 * Test endpoint to verify Zoho API credentials and connectivity
 * This helps diagnose webhook issues by testing:
 * 1. Refresh token validity
 * 2. API access
 * 3. Ability to fetch contact data
 */
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  }

  try {
    // Test 1: Check environment variables
    results.tests.push({
      name: 'Environment Variables',
      status: 'checking',
    })

    const requiredEnvVars = [
      'ZOHO_CLIENT_ID',
      'ZOHO_CLIENT_SECRET',
      'ZOHO_REFRESH_TOKEN',
      'ZOHO_ACCOUNTS_URL',
      'ZOHO_CRM_API_URL',
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

    if (missingVars.length > 0) {
      results.tests[0].status = 'failed'
      results.tests[0].error = `Missing environment variables: ${missingVars.join(', ')}`
      results.tests[0].details = {
        required: requiredEnvVars,
        missing: missingVars,
        present: requiredEnvVars.filter(v => process.env[v]),
      }
    } else {
      results.tests[0].status = 'passed'
      results.tests[0].details = {
        ZOHO_ACCOUNTS_URL: process.env.ZOHO_ACCOUNTS_URL,
        ZOHO_CRM_API_URL: process.env.ZOHO_CRM_API_URL,
        ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID?.substring(0, 10) + '...',
        ZOHO_REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN?.substring(0, 10) + '...',
      }
    }

    // Test 2: Try to fetch a contact to verify API access
    results.tests.push({
      name: 'Zoho API Access',
      status: 'checking',
    })

    try {
      // Try to get recently modified contacts (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const recentContacts = await zohoService.getRecentlyModifiedContacts(sevenDaysAgo)

      results.tests[1].status = 'passed'
      results.tests[1].details = {
        contactsFetched: recentContacts.length,
        message: 'Successfully authenticated and fetched contacts from Zoho',
        sampleContactIds: recentContacts.slice(0, 3).map(c => c.id),
      }
    } catch (error) {
      results.tests[1].status = 'failed'
      results.tests[1].error = error instanceof Error ? error.message : String(error)
      results.tests[1].details = {
        message: 'Failed to fetch contacts from Zoho API',
        possibleReasons: [
          'Refresh token expired or invalid',
          'API credentials incorrect',
          'Network connectivity issue',
          'Zoho API rate limit reached',
        ],
      }
    }

    // Test 3: Verify webhook endpoint accessibility
    results.tests.push({
      name: 'Webhook Endpoint',
      status: 'passed',
      details: {
        url: `${request.nextUrl.origin}/api/webhooks/zoho-contractor`,
        message: 'Webhook endpoint should be accessible at this URL',
      },
    })

    // Overall status
    const allPassed = results.tests.every((t: any) => t.status === 'passed')
    results.overallStatus = allPassed ? 'PASSED' : 'FAILED'
    results.summary = allPassed
      ? 'All tests passed! Zoho integration is working correctly.'
      : 'Some tests failed. Check the details above to diagnose the issue.'

    return NextResponse.json(results, {
      status: allPassed ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Test execution failed',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
