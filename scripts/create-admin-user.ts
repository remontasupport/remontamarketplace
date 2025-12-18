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



    process.exit(0);
  } catch (error) {
  
    process.exit(1);
  }
}

// Get credentials from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
 
  process.exit(1);
}

if (password.length < 8) {

  process.exit(1);
}

createAdminUser(email, password);
