import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to Prisma...');
    const company = await prisma.company.findFirst();
    if (company) {
        console.log('Company found:', company.id);
        console.log('Current Lock Date:', company.accountingLockDate);

        // Try to update it to verify write access
        const newDate = new Date();
        const updated = await prisma.company.update({
            where: { id: company.id },
            data: { accountingLockDate: newDate }
        });
        console.log('Successfully updated Lock Date:', updated.accountingLockDate);
    } else {
        console.log('No company found to test.');
    }
}

main()
    .catch(e => {
        console.error('Error testing accountingLockDate:', e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
