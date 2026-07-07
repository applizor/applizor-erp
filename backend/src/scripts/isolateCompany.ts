import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const KEEP_COMPANY_ID = 'b81a0e3f-9301-43f7-a633-6db7e5fa54b0'; // Applizor Softech LLP

async function main() {
  console.log('⏳ Starting database isolation process...');

  // 1. Verify target company exists
  const targetCompany = await prisma.company.findUnique({
    where: { id: KEEP_COMPANY_ID }
  });

  if (!targetCompany) {
    console.error(`❌ Error: Company with ID ${KEEP_COMPANY_ID} (Applizor Softech LLP) not found in the database!`);
    process.exit(1);
  }

  console.log(`✅ Verified target company: ${targetCompany.name} (${targetCompany.id})`);

  // 2. Delete all other companies (onDelete: Cascade will handle child tables)
  console.log('⏳ Deleting all other companies...');
  const deleteResult = await prisma.company.deleteMany({
    where: {
      id: {
        not: KEEP_COMPANY_ID
      }
    }
  });

  console.log(`✅ Deleted ${deleteResult.count} other companies and cascaded child records.`);

  // 3. Keep global elements (TenantPlan, Country, State, Currency) - these don't belong to any company so they won't be deleted.
  // Verify what companies are left
  const remainingCompanies = await prisma.company.findMany();
  console.log(`📋 Remaining companies in DB: ${remainingCompanies.map(c => c.name).join(', ')}`);

  console.log('✅ Database isolation completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during isolation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
