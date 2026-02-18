import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Use the same date range as the likely report
    const startDate = new Date('2026-02-01');
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date('2026-02-28');
    endDate.setHours(23, 59, 59, 999);

    console.log(`\n--- Inspecting References for ${startDate.toISOString()} to ${endDate.toISOString()} ---`);

    // Fetch all posted journal entries in this period that restrict to GST accounts
    const gstAccounts = await prisma.ledgerAccount.findMany({
        where: {
            code: { in: ['1300', '1301', '1302', '2200', '2201', '2202'] }
        }
    });
    const accountIds = gstAccounts.map(a => a.id);

    const lines = await prisma.journalEntryLine.findMany({
        where: {
            accountId: { in: accountIds },
            journalEntry: {
                date: { gte: startDate, lte: endDate },
                status: 'posted'
            }
        },
        include: { journalEntry: true, account: true }
    });

    console.log(`Total GST Lines: ${lines.length}`);

    const references = lines.map(l => l.journalEntry.reference).filter(r => r);
    const uniqueRefs = [...new Set(references)];

    console.log('\n--- Unique References Found ---');
    uniqueRefs.forEach(ref => {
        console.log(`'${ref}'`);
    });

    console.log('\n--- Checking Logic ---');
    uniqueRefs.forEach(ref => {
        if (ref && ref.startsWith('INV-')) {
            console.log(`✅ '${ref}' starts with INV- (Would be included)`);
        } else {
            console.log(`❌ '${ref}' DOES NOT start with INV- (Would be EXCLUDED)`);
        }
    });

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
