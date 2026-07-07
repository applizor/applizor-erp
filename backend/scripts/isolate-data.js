const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLIZOR_COMPANY_ID = 'b81a0e3f-9301-43f7-a633-6db7e5fa54b0';

async function main() {
  console.log(`Starting data isolation to Applizor Softech LLP (${APPLIZOR_COMPANY_ID})...`);

  // Fetch all tables with companyId column
  const tablesResult = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'companyId' 
      AND table_schema = 'public' 
      AND table_name NOT IN ('Company');
  `;

  for (const row of tablesResult) {
    const tableName = row.table_name;
    console.log(`Checking/Updating table: ${tableName}`);

    // Update all records to have the companyId of Applizor Softech LLP
    try {
      const updateCount = await prisma.$executeRawUnsafe(`
        UPDATE "${tableName}" 
        SET "companyId" = $1 
        WHERE "companyId" IS NULL OR "companyId" != $1;
      `, APPLIZOR_COMPANY_ID);

      if (updateCount > 0) {
        console.log(`  Updated ${updateCount} records in "${tableName}"`);
      }
    } catch (err) {
      console.error(`  Failed to update table "${tableName}":`, err.message);
    }
  }

  console.log('Data isolation script completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
