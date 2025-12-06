/**
 * Deep Diagnostic - Thorough analysis of pg-boss null return issue
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';
import PgBoss from 'pg-boss';

export async function GET() {
  const results: any = {
    tests: [],
    errors: [],
    recommendations: [],
  };

  let boss: PgBoss | null = null;

  try {
    // TEST 1: Check database time vs local time
    console.log('🔍 TEST 1: Time synchronization check');
    const dbTimeResult = await authPrisma.$queryRaw<any[]>`SELECT NOW() as db_time`;
    const dbTime = new Date(dbTimeResult[0].db_time);
    const localTime = new Date();
    const timeDiff = (localTime.getTime() - dbTime.getTime()) / 1000; // in seconds

    results.tests.push({
      name: 'Time Sync Check',
      status: Math.abs(timeDiff) < 60 ? 'PASS' : 'WARN',
      details: {
        localTime: localTime.toISOString(),
        dbTime: dbTime.toISOString(),
        differenceSeconds: timeDiff,
        differenceHours: (timeDiff / 3600).toFixed(2),
      }
    });

    if (Math.abs(timeDiff) > 60) {
      results.recommendations.push('Clock skew detected. This is the likely cause of the null return issue.');
    }

    // TEST 2: Create fresh pg-boss instance
    console.log('🔍 TEST 2: Fresh pg-boss instance');
    const connectionString = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;

    boss = new PgBoss({
      connectionString,
      schema: 'pgboss',
      max: 2,
      // Set clock monitoring to max interval to minimize checks
      clockMonitorIntervalMinutes: 10,
    });

    await boss.start();
    results.tests.push({
      name: 'PgBoss Initialization',
      status: 'PASS',
      details: 'Fresh instance started successfully'
    });

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // TEST 3: Try sending with NO options
    console.log('🔍 TEST 3: Send job with NO options');
    try {
      const jobId1 = await boss.send('test-no-options', { test: 1 });
      results.tests.push({
        name: 'Send with NO options',
        status: jobId1 ? 'PASS' : 'FAIL',
        details: { jobId: jobId1 || 'NULL RETURNED' }
      });
      if (!jobId1) {
        results.errors.push('boss.send() returned null even with no options - this is critical');
      }
    } catch (error: any) {
      results.tests.push({
        name: 'Send with NO options',
        status: 'ERROR',
        details: error.message
      });
      results.errors.push(`Send with no options threw error: ${error.message}`);
    }

    // TEST 4: Try with minimal options
    console.log('🔍 TEST 4: Send job with minimal options');
    try {
      const jobId2 = await boss.send('test-minimal', { test: 2 }, {
        retryLimit: 0,
      });
      results.tests.push({
        name: 'Send with minimal options',
        status: jobId2 ? 'PASS' : 'FAIL',
        details: { jobId: jobId2 || 'NULL RETURNED' }
      });
      if (!jobId2) {
        results.errors.push('Minimal options also returns null');
      }
    } catch (error: any) {
      results.tests.push({
        name: 'Send with minimal options',
        status: 'ERROR',
        details: error.message
      });
    }

    // TEST 5: Try with keepUntil instead of expireIn
    console.log('🔍 TEST 5: Send with keepUntil (using DB time)');
    try {
      // Calculate keepUntil based on DB time to avoid clock skew
      const keepUntilDate = new Date(dbTime.getTime() + (24 * 60 * 60 * 1000)); // DB time + 24 hours

      const jobId3 = await boss.send('test-keepuntil', { test: 3 }, {
        retryLimit: 3,
        keepUntil: keepUntilDate,
      });
      results.tests.push({
        name: 'Send with keepUntil (DB-based)',
        status: jobId3 ? 'PASS' : 'FAIL',
        details: {
          jobId: jobId3 || 'NULL RETURNED',
          keepUntil: keepUntilDate.toISOString(),
        }
      });
      if (jobId3) {
        results.recommendations.push('Using keepUntil with DB time works! Use this approach.');
      }
    } catch (error: any) {
      results.tests.push({
        name: 'Send with keepUntil',
        status: 'ERROR',
        details: error.message
      });
    }

    // TEST 6: Check pg-boss version table
    console.log('🔍 TEST 6: Check pg-boss schema version');
    try {
      const versionResult = await authPrisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM pgboss.version ORDER BY version DESC LIMIT 1`
      );
      results.tests.push({
        name: 'PgBoss Schema Version',
        status: 'INFO',
        details: versionResult[0] || 'No version found'
      });
    } catch (error: any) {
      results.tests.push({
        name: 'PgBoss Schema Version',
        status: 'ERROR',
        details: error.message
      });
    }

    // TEST 7: Query existing jobs
    console.log('🔍 TEST 7: Query recent jobs');
    try {
      const recentJobs = await authPrisma.$queryRawUnsafe<any[]>(
        `SELECT id, name, state, createdon, starton, expireon
         FROM pgboss.job
         ORDER BY createdon DESC
         LIMIT 5`
      );
      results.tests.push({
        name: 'Recent Jobs in Database',
        status: 'INFO',
        details: {
          count: recentJobs.length,
          jobs: recentJobs.map(j => ({
            id: j.id,
            name: j.name,
            state: j.state,
            created: j.createdon,
            startOn: j.starton,
            expireOn: j.expireon,
          }))
        }
      });
    } catch (error: any) {
      results.tests.push({
        name: 'Recent Jobs Query',
        status: 'ERROR',
        details: error.message
      });
    }

    // TEST 8: Try sending directly to database (bypass pg-boss)
    console.log('🔍 TEST 8: Manual job insertion (bypass pg-boss)');
    try {
      const manualJobId = `manual-${Date.now()}`;
      await authPrisma.$executeRawUnsafe(`
        INSERT INTO pgboss.job (id, name, data, state, createdon, starton)
        VALUES (
          '${manualJobId}',
          'manual-test',
          '{"test": "manual"}',
          'created',
          NOW(),
          NOW()
        )
      `);

      // Check if it was inserted
      const checkJob = await authPrisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM pgboss.job WHERE id = '${manualJobId}'`
      );

      results.tests.push({
        name: 'Manual Job Insertion',
        status: checkJob.length > 0 ? 'PASS' : 'FAIL',
        details: {
          inserted: checkJob.length > 0,
          jobId: manualJobId,
        }
      });

      if (checkJob.length > 0) {
        results.recommendations.push('Manual insertion works - pg-boss send() logic is the issue');
      }
    } catch (error: any) {
      results.tests.push({
        name: 'Manual Job Insertion',
        status: 'ERROR',
        details: error.message
      });
    }

    // Cleanup
    await boss.stop();

    // Final analysis
    const failedTests = results.tests.filter((t: any) => t.status === 'FAIL' || t.status === 'ERROR');
    results.summary = {
      total: results.tests.length,
      passed: results.tests.filter((t: any) => t.status === 'PASS').length,
      failed: failedTests.length,
      warnings: results.tests.filter((t: any) => t.status === 'WARN').length,
    };

    return NextResponse.json(results, {
      status: failedTests.length > 0 ? 500 : 200
    });

  } catch (error: any) {
    console.error('❌ Deep diagnostic error:', error);

    if (boss) {
      try {
        await boss.stop();
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    results.errors.push(`Fatal error: ${error.message}`);
    return NextResponse.json(results, { status: 500 });
  }
}
