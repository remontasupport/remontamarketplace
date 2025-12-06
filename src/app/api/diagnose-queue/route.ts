/**
 * COMPREHENSIVE QUEUE DIAGNOSTIC
 * Tests every step of the queue process
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';
import PgBoss from 'pg-boss';

export async function GET() {
  const results: any = {
    step1_envCheck: 'pending',
    step2_prismaConnection: 'pending',
    step3_pgBossInit: 'pending',
    step4_sendJob: 'pending',
    step5_verifyJob: 'pending',
    errors: [],
  };

  try {
    // STEP 1: Check environment variables
    console.log('🔍 STEP 1: Checking environment variables...');
    const authDbUrl = process.env.AUTH_DATABASE_URL;
    const dbUrl = process.env.DATABASE_URL;

    if (!authDbUrl && !dbUrl) {
      results.step1_envCheck = 'FAILED';
      results.errors.push('No database URL found in environment');
      return NextResponse.json(results, { status: 500 });
    }

    results.step1_envCheck = 'PASSED';
    results.databaseUrl = authDbUrl ? 'AUTH_DATABASE_URL set' : 'DATABASE_URL set';
    console.log('✅ STEP 1 PASSED: Database URL exists');

    // STEP 2: Test Prisma connection
    console.log('🔍 STEP 2: Testing Prisma connection...');
    try {
      await authPrisma.$queryRaw`SELECT 1 as test`;
      results.step2_prismaConnection = 'PASSED';
      console.log('✅ STEP 2 PASSED: Prisma can connect to database');
    } catch (prismaError: any) {
      results.step2_prismaConnection = 'FAILED';
      results.errors.push(`Prisma connection failed: ${prismaError.message}`);
      console.error('❌ STEP 2 FAILED:', prismaError);
      return NextResponse.json(results, { status: 500 });
    }

    // STEP 3: Initialize pg-boss
    console.log('🔍 STEP 3: Initializing pg-boss...');
    let boss: PgBoss;
    try {
      const connectionString = authDbUrl || dbUrl;
      boss = new PgBoss({
        connectionString,
        max: 2,
      });

      boss.on('error', (error) => {
        console.error('❌ pg-boss error event:', error);
        results.errors.push(`pg-boss error: ${error.message}`);
      });

      await boss.start();
      results.step3_pgBossInit = 'PASSED';
      console.log('✅ STEP 3 PASSED: pg-boss started');
    } catch (bossError: any) {
      results.step3_pgBossInit = 'FAILED';
      results.errors.push(`pg-boss init failed: ${bossError.message}`);
      console.error('❌ STEP 3 FAILED:', bossError);
      return NextResponse.json(results, { status: 500 });
    }

    // STEP 4: Try to send a job
    console.log('🔍 STEP 4: Sending test job...');
    let jobId: string | null = null;
    try {
      jobId = await boss.send('diagnostic-test', {
        timestamp: new Date().toISOString(),
        test: 'diagnostic'
      });

      if (!jobId) {
        results.step4_sendJob = 'FAILED';
        results.errors.push('boss.send() returned null - this is the problem!');
        console.error('❌ STEP 4 FAILED: boss.send() returned null');
      } else {
        results.step4_sendJob = 'PASSED';
        results.jobId = jobId;
        console.log('✅ STEP 4 PASSED: Job created with ID:', jobId);
      }
    } catch (sendError: any) {
      results.step4_sendJob = 'FAILED';
      results.errors.push(`boss.send() threw error: ${sendError.message}`);
      console.error('❌ STEP 4 FAILED:', sendError);
    }

    // STEP 5: Verify job in database
    if (jobId) {
      console.log('🔍 STEP 5: Verifying job in database...');
      try {
        const jobInDb = await authPrisma.$queryRawUnsafe<any[]>(
          `SELECT id, name, state FROM pgboss.job WHERE id = '${jobId}'`
        );

        if (jobInDb.length > 0) {
          results.step5_verifyJob = 'PASSED';
          results.jobInDatabase = jobInDb[0];
          console.log('✅ STEP 5 PASSED: Job found in database');
        } else {
          results.step5_verifyJob = 'FAILED';
          results.errors.push('Job ID returned but not found in database');
          console.error('❌ STEP 5 FAILED: Job not in database');
        }
      } catch (dbError: any) {
        results.step5_verifyJob = 'FAILED';
        results.errors.push(`Database query failed: ${dbError.message}`);
        console.error('❌ STEP 5 FAILED:', dbError);
      }
    }

    // Cleanup
    await boss.stop();

    // Final result
    const allPassed = results.step1_envCheck === 'PASSED' &&
                     results.step2_prismaConnection === 'PASSED' &&
                     results.step3_pgBossInit === 'PASSED' &&
                     results.step4_sendJob === 'PASSED' &&
                     results.step5_verifyJob === 'PASSED';

    results.overallStatus = allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌';

    return NextResponse.json(results, {
      status: allPassed ? 200 : 500
    });

  } catch (error: any) {
    console.error('❌ DIAGNOSTIC ERROR:', error);
    results.errors.push(`Unexpected error: ${error.message}`);
    results.overallStatus = 'DIAGNOSTIC FAILED';

    return NextResponse.json(results, { status: 500 });
  }
}
