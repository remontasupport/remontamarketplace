/**
 * Promote Existing User to Admin Script
 *
 * Use this to promote an existing WORKER/CLIENT/COORDINATOR to ADMIN
 *
 * Usage:
 * npx tsx scripts/promote-to-admin.ts user@example.com
 */

import { authPrisma } from '../src/lib/auth-prisma';

async function promoteToAdmin(email: string) {
  try {
    const user = await authPrisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    if (user.role === 'ADMIN') {
      console.log(`✅ User ${email} is already an ADMIN`);
      process.exit(0);
    }

    const oldRole = user.role;

    // Promote to ADMIN
    await authPrisma.user.update({
      where: { id: user.id },
      data: {
        role: 'ADMIN',
        updatedAt: new Date(),
      },
    });

    // Log role change
    await authPrisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ROLE_CHANGE',
        metadata: {
          method: 'PROMOTE_TO_ADMIN_SCRIPT',
          oldRole,
          newRole: 'ADMIN',
          promotedBy: 'System',
        },
      },
    });

    console.log('✅ User promoted to ADMIN successfully!');
    console.log(`Email: ${user.email}`);
    console.log(`Old Role: ${oldRole}`);
    console.log(`New Role: ADMIN`);
    console.log('\n🔑 User can now login and access /admin');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to promote user:', error);
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: npx tsx scripts/promote-to-admin.ts <email>');
  console.error('Example: npx tsx scripts/promote-to-admin.ts user@example.com');
  process.exit(1);
}

promoteToAdmin(email);
