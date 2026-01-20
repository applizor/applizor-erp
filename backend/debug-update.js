
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        // 1. Fetch Privilege Leave
        const type = await prisma.leaveType.findUnique({ where: { name: 'Privilege Leave' } });
        console.log('Found:', type.id);

        // 2. Mock payload simluating frontend request
        const payload = {
            name: type.name,
            days: 18,
            isPaid: true,
            // ... (other fields mimicking frontend)
            accrualType: 'monthly',
            accrualRate: 1.5,
            maxAccrual: 0,
            // Ensure relations are handled as arrays per controller logic expectations if possible, 
            // but controller handles undefined defaults.
            // Controller expects strings for some, parsing them.
            // Let's call the controller logic directly? No, easier to run Prisma update directly matching logic.

            // Wait, I should simulate the CONTROLLER logic, which uses `parseInt`/`parseFloat`.
            // The error "Failed to update leave type" comes from the catch block in controller.
            // It means the Prisma update call failed.
        };

        // Simulate what the controller does:
        const data = {
            name: payload.name,
            days: parseInt(payload.days),
            isPaid: payload.isPaid,
            // ...
            accrualType: payload.accrualType,
            accrualRate: parseFloat(payload.accrualRate),
            maxAccrual: parseFloat(payload.maxAccrual),
            // Important: check if any undefined/nulls are breaking it
        };

        console.log('Attempting update with:', data);

        // Attempt update
        const res = await prisma.leaveType.update({
            where: { id: type.id },
            data: data
        });

        console.log('Success:', res);
    } catch (e) {
        console.error('ERROR STACK:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
