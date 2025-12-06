/**
 * Create Partition for worker-registration
 * pg-boss v10+ requires partitions to be created before jobs can be inserted
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';

export async function POST() {
  try {
    console.log('🔧 Creating partition for worker-registration...');

    // Check existing partitions
    const existingPartitions = await authPrisma.$queryRawUnsafe<any[]>(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'pgboss'
      AND tablename LIKE 'j%'
    `);

    console.log('Existing partitions:', existingPartitions.map(p => p.tablename));

    // Create partition for worker-registration
    // pg-boss names partitions using a hash of the job name
    // We need to use pg-boss's createQueue function, but we can also do it manually

    // The partition table name is a hash - let's let pg-boss create it
    // by registering a worker for this job type
    const PgBoss = (await import('pg-boss')).default;

    const boss = new PgBoss({
      connectionString: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL,
      schema: 'pgboss',
      max: 2,
      clockMonitorIntervalMinutes: 10,
    });

    await boss.start();
    console.log('✅ PgBoss started');

    // Register a queue for worker-registration
    // This will create the partition table
    await boss.createQueue('worker-registration');
    console.log('✅ Queue created for worker-registration');

    // Check partitions again
    const newPartitions = await authPrisma.$queryRawUnsafe<any[]>(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'pgboss'
      AND tablename LIKE 'j%'
    `);

    await boss.stop();

    return NextResponse.json({
      success: true,
      message: 'Partition created successfully',
      before: existingPartitions.map(p => p.tablename),
      after: newPartitions.map(p => p.tablename),
    });

  } catch (error: any) {
    console.error('❌ Error creating partition:', error);

    return NextResponse.json({
      error: 'Failed to create partition',
      message: error.message,
    }, { status: 500 });
  }
}
