import prisma from '../config/db.js';

/**
 * Initializes admin_audit_logs table and indexes idempotently.
 * Preserves all existing data and tables.
 */
export async function initAdminAuditLogsTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        admin_email TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        details JSONB,
        ip_address TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_audit_admin_id ON admin_audit_logs(admin_id)
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_logs(action)
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_audit_target_type ON admin_audit_logs(target_type)
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_logs(created_at DESC)
    `);

    console.log('✅ admin_audit_logs table and indexes verified.');
  } catch (err) {
    console.error('Error initializing admin_audit_logs table:', err.message);
  }
}

// Run directly if executed as standalone script
if (process.argv[1] && process.argv[1].includes('init_admin_tables.js')) {
  initAdminAuditLogsTable().then(() => prisma.$disconnect());
}
