
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Searching for recent Invoices...');
    const invoices = await prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
            items: {
                include: {
                    appliedTaxes: true
                }
            }
        }
    });

    if (invoices.length === 0) {
        console.log('No invoices found.');
        return;
    }

    invoices.forEach(inv => {
        console.log(`\n--- Invoice: ${inv.invoiceNumber} (ID: ${inv.id}) ---`);
        console.log(`Created: ${inv.createdAt}`);
        console.log(`Total: ${inv.total}`);
        inv.items.forEach((item, i) => {
            console.log(`  Item ${i + 1}: ${item.description}`);
            console.log(`    - Unit: '${item.unit}'`);
            console.log(`    - HSN: '${item.hsnSacCode}'`);
            console.log(`    - Disc%: ${item.discount}`);
            console.log(`    - Net Value (DB amount): ${item.amount}`);
        });
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
