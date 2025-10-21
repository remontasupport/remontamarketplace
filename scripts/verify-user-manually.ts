/**
 * Manual Email Verification Script
 *
 * Use this to manually verify a user's email for testing
 *
 * Usage:
 * npx tsx scripts/verify-user-manually.ts clentbacatan123@gmail.com
 */

import { authPrisma } from '../src/lib/auth-prisma';

async function verifyUserManually(email: string) {
  try {
    console.log(`🔍 Looking for user: ${email}`);

    const user = await authPrisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        workerProfile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    if (user.emailVerified) {
      console.log(`✅ Email already verified for: ${email}`);
      console.log(`   Verified at: ${user.emailVerified}`);
      process.exit(0);
    }

    // Manually verify the user
    await authPrisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        status: 'ACTIVE',
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    // Log verification
    await authPrisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        metadata: {
          method: 'MANUAL_VERIFICATION_SCRIPT',
          verifiedBy: 'Admin',
        },
      },
    });

    console.log(`✅ Email manually verified for: ${email}`);
    console.log(`   User: ${user.workerProfile?.firstName} ${user.workerProfile?.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ACTIVE`);
    console.log(`\n🎉 User can now log in!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npx tsx scripts/verify-user-manually.ts your@email.com');
  process.exit(1);
}

verifyUserManually(email);
