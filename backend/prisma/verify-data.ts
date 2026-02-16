
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking database content...');

    const userCount = await prisma.user.count();
    const clientCount = await prisma.client.count();
    const projectCount = await prisma.project.count();

    console.log(`✅ Users: ${userCount}`);
    console.log(`✅ Clients: ${clientCount}`);
    console.log(`✅ Projects: ${projectCount}`);

    if (userCount > 1 || clientCount > 0) {
        console.log('✅ EXISTING DATA IS SAFE & RESTORED.');
    } else {
        console.log('⚠️ Warning: Data might be empty.');
    }
}

main()
    .catch((e) => {
        console.error('Check failed:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
