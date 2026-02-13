
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const invoices = await prisma.invoice.findMany({
        select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
        }
    });

    console.log('--- Invoices ---');
    console.log(JSON.stringify(invoices, null, 2));

    const pending = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
    const paid = invoices.filter(i => i.status === 'paid');

    console.log(`Pending Count: ${pending.length}`);
    console.log(`Paid Count: ${paid.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
