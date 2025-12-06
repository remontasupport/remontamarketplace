/**
 * Test Queue Connection
 * Simple endpoint to test if pg-boss can initialize
 */

import { NextResponse } from 'next/server';
import PgBoss from 'pg-boss';

export async function GET() {
  try {
    console.log('🔍 Testing pg-boss connection...');
    console.log('📍 Database URL:', process.env.AUTH_DATABASE_URL ? 'Set (AUTH_DATABASE_URL)' : 'Not set');

    const connectionString = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;

    if (!connectionString) {
      return NextResponse.json({
        error: 'No database connection string found',
        message: 'AUTH_DATABASE_URL or DATABASE_URL must be set'
      }, { status: 500 });
    }

    console.log('🔗 Connection string exists');

    // Create a simple pg-boss instance
    const boss = new PgBoss({
      connectionString,
      max: 2,
    });

    console.log('⚙️ Starting pg-boss...');
    await boss.start();
    console.log('✅ pg-boss started successfully!');
    console.log('✅ Tables should now be created in pgboss schema');

    // Try to send a test job to verify it's working
    const testJobId = await boss.send('test-queue', { test: true });
    console.log('✅ Test job queued:', testJobId);

    // Don't stop the instance - let it stay running for other requests
    console.log('✅ Test complete - keeping pg-boss running');

    return NextResponse.json({
      success: true,
      message: 'pg-boss initialized successfully! Tables created in pgboss schema.',
      testJobId
    });

  } catch (error: any) {
    console.error('❌ Error:', error);

    return NextResponse.json({
      error: 'Failed to initialize pg-boss',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
