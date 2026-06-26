import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

async function main() {
    console.log('Cleaning up ShiftRoster entries on company off-days...\n');

    const companies = await prisma.company.findMany({
        select: { id: true, name: true, offDays: true }
    });

    let totalDeleted = 0;

    for (const company of companies) {
        if (!company.offDays) {
            console.log(`[${company.name}] No offDays configured, skipping.`);
            continue;
        }

        const offDays = company.offDays.split(',').map(s => s.trim().toLowerCase());
        console.log(`[${company.name}] Off-days: ${offDays.join(', ')}`);

        // Fetch all ShiftRoster entries for this company's employees
        const rosters = await prisma.shiftRoster.findMany({
            where: {
                employee: { companyId: company.id }
            },
            select: {
                id: true,
                employeeId: true,
                date: true,
                employee: { select: { firstName: true, lastName: true, employeeId: true } }
            }
        });

        const toDelete: string[] = [];

        for (const roster of rosters) {
            const dayIndex = roster.date.getUTCDay();
            const dayName = WEEKDAYS[dayIndex];

            if (offDays.includes(dayName)) {
                toDelete.push(roster.id);
                console.log(`  QUEUED: ${roster.employee.firstName} ${roster.employee.lastName} (${roster.employee.employeeId}) — ${roster.date.toISOString().split('T')[0]} (${dayName})`);
            }
        }

        if (toDelete.length > 0) {
            await prisma.shiftRoster.deleteMany({
                where: { id: { in: toDelete } }
            });
            console.log(`  DELETED ${toDelete.length} entries.`);
            totalDeleted += toDelete.length;
        } else {
            console.log('  No corrupt entries found.');
        }

        console.log('');
    }

    console.log(`\nCleanup complete. Total entries deleted: ${totalDeleted}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
