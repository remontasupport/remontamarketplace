/**
 * Create First Admin User Script
 *
 * Use this ONCE to create the initial admin account
 * After first admin exists, use admin UI to create more admins
 *
 * Usage:
 * npx tsx scripts/create-admin-user.ts admin@remonta.com "SecurePassword123!"
 */

import { authPrisma } from '../src/lib/auth-prisma';
import bcrypt from 'bcryptjs';

async function createAdminUser(email: string, password: string) {
  try {
    // Check if user already exists
    const existing = await authPrisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      console.error(`❌ User with email ${email} already exists`);
      console.log('If you want to make them admin, use promote-to-admin.ts instead');
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await authPrisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    // Log creation
    await authPrisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'ROLE_CHANGE',
        metadata: {
          method: 'CREATE_ADMIN_SCRIPT',
          role: 'ADMIN',
          createdBy: 'System',
        },
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`ID: ${admin.id}`);
    console.log(`Status: ${admin.status}`);
    console.log('\n🔑 You can now login at /login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }
}

// Get credentials from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('❌ Usage: npx tsx scripts/create-admin-user.ts <email> <password>');
  console.error('Example: npx tsx scripts/create-admin-user.ts admin@remonta.com "SecurePass123!"');
  process.exit(1);
}

if (password.length < 8) {
  console.error('❌ Password must be at least 8 characters');
  process.exit(1);
}

createAdminUser(email, password);
