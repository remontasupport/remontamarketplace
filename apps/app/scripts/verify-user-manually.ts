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
     
      process.exit(1);
    }

    if (user.status === 'ACTIVE') {
      
      process.exit(0);
    }

    // Manually verify the user by setting status to ACTIVE
    await authPrisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
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

   

    process.exit(0);
  } catch (error) {
 
    process.exit(1);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {

  process.exit(1);
}

verifyUserManually(email);
