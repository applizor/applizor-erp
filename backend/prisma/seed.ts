import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Database seeding initiated...');
    console.log('NOTE: For a full restoration of the industry-standard "projectstartbackup.sql",');
    console.log('please run the following command from the project root:');
    console.log('   ./restore_db.sh');
    console.log('-------------------------------------------------------------------------');

    // Base verification to ensure database is at least reachable
    const userCount = await prisma.user.count();
    console.log(`Current users in DB: ${userCount}`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

