
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Fetching Leave Types...");
        const leaveTypes = await prisma.leaveType.findMany();
        console.log(JSON.stringify(leaveTypes, null, 2));

        console.log("\nFetching Employee Leave Balances for all employees...");
        const balances = await prisma.employeeLeaveBalance.findMany({
            include: {
                employee: { select: { email: true, dateOfJoining: true } },
                leaveType: { select: { name: true, accrualType: true, days: true } }
            }
        });
        console.log(JSON.stringify(balances, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
