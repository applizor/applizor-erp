
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Leave Types...');

    const leaveTypes = [
        {
            name: 'Casual Leave',
            days: 12,
            isPaid: true,
            description: 'For personal matters.',
            color: '#3B82F6', // Blue
            monthlyLimit: 2
        },
        {
            name: 'Sick Leave',
            days: 10,
            isPaid: true,
            description: 'Medical leave.',
            color: '#EF4444', // Red
            proofRequired: true
        },
        {
            name: 'Privilege Leave',
            days: 15,
            isPaid: true,
            description: 'Annual vacation.',
            color: '#10B981', // Green
            minServiceDays: 180, // 6 months probation
            encashable: true,
            carryForward: true
        }
    ];

    for (const type of leaveTypes) {
        // Upsert Leave Type
        const existing = await prisma.leaveType.findFirst({ where: { name: type.name } });

        let leaveTypeId = existing?.id;

        if (!existing) {
            const created = await prisma.leaveType.create({
                data: {
                    ...type,
                    departmentIds: [],
                    positionIds: [],
                    employmentStatus: []
                }
            });
            leaveTypeId = created.id;
            console.log(`Created: ${type.name}`);
        } else {
            console.log(`Exists: ${type.name}`);
        }

        if (leaveTypeId) {
            // Seed Balances for ALL employees for current year
            const employees = await prisma.employee.findMany();
            const year = new Date().getFullYear();

            for (const emp of employees) {
                const balanceExists = await prisma.employeeLeaveBalance.findFirst({
                    where: { employeeId: emp.id, leaveTypeId, year }
                });

                if (!balanceExists) {
                    await prisma.employeeLeaveBalance.create({
                        data: {
                            employeeId: emp.id,
                            leaveTypeId,
                            year,
                            allocated: type.days,
                            used: 0,
                            carriedOver: 0
                        }
                    });
                    console.log(`Assigned ${type.name} to ${emp.firstName}`);
                }
            }
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
