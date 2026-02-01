
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const invoices = await prisma.invoice.findMany({
        where: { total: 141600 },
        include: {
            items: {
                include: {
                    appliedTaxes: true
                }
            }
        }
    });

    console.log('Found Invoices:', invoices.length);

    for (const inv of invoices) {
        console.log(`\nInvoice: ${inv.invoiceNumber} (ID: ${inv.id})`);
        for (const item of inv.items) {
            console.log(`  Item: ${item.description}`);
            console.log(`  Legacy TaxRate: ${item.taxRate}`);
            console.log(`  Applied Taxes (${item.appliedTaxes.length}):`);
            item.appliedTaxes.forEach(at => {
                console.log(`    - Name: "${at.name}", Rate: ${at.percentage}, Amount: ${at.amount}, TaxRateID: ${at.taxRateId}`);
            });
        }
    }

    const taxRates = await prisma.taxRate.findMany();
    console.log('\nAll Tax Rates:');
    taxRates.forEach(tr => {
        console.log(`  - ${tr.name} (${tr.percentage}%) ID: ${tr.id}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
