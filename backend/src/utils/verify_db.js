import prisma from '../config/db.js';

async function verifyDatabaseStructure() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name != '_prisma_migrations'
      ORDER BY table_name;
    `;

    const enums = await prisma.$queryRaw`
      SELECT t.typname 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      GROUP BY t.typname 
      ORDER BY t.typname;
    `;

    const indexes = await prisma.$queryRaw`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
      ORDER BY tablename, indexname;
    `;

    const foreignKeys = await prisma.$queryRaw`
      SELECT conname, relname 
      FROM pg_constraint c
      JOIN pg_class cl ON c.conrelid = cl.oid
      WHERE c.contype = 'f'
      ORDER BY relname;
    `;

    console.log('=== FARMDEX DATABASE STRUCTURE VERIFICATION ===');
    console.log(`✅ Base Tables Created (${tables.length}):`);
    tables.forEach((t, i) => console.log(`  ${i + 1}. ${t.table_name}`));

    console.log(`\n✅ Enum Types Created (${enums.length}):`);
    enums.forEach((e, i) => console.log(`  ${i + 1}. ${e.typname}`));

    console.log(`\n✅ Indexes Configured (${indexes.length})`);
    console.log(`✅ Foreign Key Constraints (${foreignKeys.length})`);
    console.log('================================================');

    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  }
}

verifyDatabaseStructure();
