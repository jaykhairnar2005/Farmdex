import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { normalizePhone } from './phone.util.js';
import { initAdminAuditLogsTable } from './init_admin_tables.js';

/**
 * Secure Admin Provisioning Script for FarmDex
 * 
 * Usage:
 *   node src/utils/seed_admin.js
 *   ADMIN_EMAIL=superadmin@farmdex.com ADMIN_PASSWORD=SuperSecretPass123! node src/utils/seed_admin.js
 *   node src/utils/seed_admin.js --email=admin@farmdex.com --password=AdminSecure123!
 */
export async function provisionAdmin(options = {}) {
  try {
    // Ensure audit tables exist
    await initAdminAuditLogsTable();

    // Parse CLI arguments if provided
    const args = process.argv.slice(2);
    const cliOptions = {};
    for (const arg of args) {
      if (arg.startsWith('--email=')) cliOptions.email = arg.split('=')[1];
      if (arg.startsWith('--password=')) cliOptions.password = arg.split('=')[1];
      if (arg.startsWith('--name=')) cliOptions.name = arg.split('=')[1];
      if (arg.startsWith('--phone=')) cliOptions.phone = arg.split('=')[1];
    }

    const email = (options.email || cliOptions.email || process.env.ADMIN_EMAIL || 'admin@farmdex.com').toLowerCase().trim();
    const rawPassword = options.password || cliOptions.password || process.env.ADMIN_PASSWORD || 'AdminFarmDex2026!';
    const name = options.name || cliOptions.name || process.env.ADMIN_NAME || 'FarmDex Platform Administrator';
    const rawPhone = options.phone || cliOptions.phone || process.env.ADMIN_PHONE || '+919800000001';
    const phone = normalizePhone(rawPhone);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid admin email format: ${email}`);
    }

    // Validate strong password requirement
    if (rawPassword.length < 8) {
      throw new Error('Admin password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(rawPassword) || !/[a-z]/.test(rawPassword) || !/\d/.test(rawPassword)) {
      throw new Error('Admin password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    // Cryptographically hash password
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    let adminUser;

    if (existingUser) {
      adminUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          email,
          passwordHash,
          phone,
          role: 'ADMIN',
          isVerified: true,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          updatedAt: true,
        },
      });
      console.log(`✅ Existing user successfully elevated to ADMIN: ${adminUser.email} (ID: ${adminUser.id})`);
    } else {
      adminUser = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          phone,
          role: 'ADMIN',
          isVerified: true,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
      });
      console.log(`✅ New ADMIN account successfully provisioned: ${adminUser.email} (ID: ${adminUser.id})`);
    }

    // Log the provisioning action to audit log
    await prisma.$executeRawUnsafe(`
      INSERT INTO admin_audit_logs (id, admin_id, admin_email, action, target_type, target_id, details, ip_address, created_at)
      VALUES (
        '${crypto.randomUUID()}',
        '${adminUser.id}',
        '${adminUser.email}',
        'ADMIN_PROVISIONED',
        'USER',
        '${adminUser.id}',
        '{"event": "Admin provisioning script executed", "email": "${adminUser.email}"}'::jsonb,
        '127.0.0.1',
        NOW()
      )
    `).catch(() => {});

    return adminUser;
  } catch (err) {
    console.error('❌ Failed to provision admin user:', err.message);
    throw err;
  }
}

// Run immediately if called directly
if (process.argv[1] && process.argv[1].includes('seed_admin.js')) {
  provisionAdmin()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      prisma.$disconnect();
      process.exit(1);
    });
}
