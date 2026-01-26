import prisma from './src/prisma/client';

async function testSchema() {
    console.log('--- RUNTIME SCHEMA TEST ---');
    try {
        console.log('Keys of prisma.contract:', Object.keys(prisma.contract));
        console.log('Attempting validation with contractValue...');

        // This will likely fail with validation error for missing fields but let's see if contractValue is rejected
        await (prisma.contract as any).create({
            data: {
                title: 'TEST',
                contractValue: 0,
            }
        });
    } catch (e: any) {
        console.log('Error caught during creation:');
        console.log(e.message);
    }
    process.exit(0);
}

testSchema();
