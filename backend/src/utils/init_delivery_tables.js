import prisma from '../config/db.js';

export async function initDeliveryHistoryTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS delivery_status_history (
        id TEXT PRIMARY KEY,
        delivery_id TEXT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        location TEXT,
        note TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_deliv_hist_delivery_id ON delivery_status_history(delivery_id)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_deliv_hist_order_id ON delivery_status_history(order_id)
    `);
    console.log('✅ delivery_status_history table and indexes verified.');
  } catch (err) {
    console.error('Error initializing delivery_status_history table:', err.message);
  }
}

// Run directly if called as a script
if (process.argv[1] && process.argv[1].includes('init_delivery_tables.js')) {
  initDeliveryHistoryTable().then(() => prisma.$disconnect());
}
