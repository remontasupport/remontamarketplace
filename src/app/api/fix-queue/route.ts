/**
 * Fix Queue - Reset pg-boss schema
 * This will drop and recreate the pg-boss schema to fix the null return issue
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';

export async function POST() {
  try {
    console.log('🔧 Starting pg-boss schema reset...');

    // Drop the pgboss schema (this will remove all queued jobs!)
    console.log('⚠️ Dropping pgboss schema...');
    await authPrisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS pgboss CASCADE');
    console.log('✅ Schema dropped');

    // Create fresh schema
    console.log('🔧 Creating fresh pgboss schema...');
    await authPrisma.$executeRawUnsafe('CREATE SCHEMA pgboss');
    console.log('✅ Schema created');

    return NextResponse.json({
      success: true,
      message: 'pg-boss schema reset successfully. Please restart your application.',
    });

  } catch (error: any) {
    console.error('❌ Error resetting schema:', error);

    return NextResponse.json({
      error: 'Failed to reset schema',
      message: error.message,
    }, { status: 500 });
  }
}
