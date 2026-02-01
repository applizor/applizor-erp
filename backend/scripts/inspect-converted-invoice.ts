
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const invoiceId = 'bbbdc16e-130a-424e-8f54-47534899bd03';
    console.log(`Inspecting Invoice: ${invoiceId}`);

    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            items: {
                include: {
                    appliedTaxes: true
                }
            }
        }
    });

    if (!invoice) {
        console.log('Invoice NOT FOUND.');
        return;
    }

    console.log('Invoice Details:');
    console.log(`- Subtotal: ${invoice.subtotal}`);
    console.log(`- Total: ${invoice.total}`);
    console.log(`- Saved Discount Field: ${invoice.discount}`);
    console.log(`- Items Count: ${invoice.items.length}`);

    invoice.items.forEach((item, i) => {
        console.log(`\nItem ${i + 1}: ${item.description}`);
        console.log(`  - Rate: ${item.rate}`);
        console.log(`  - Quantity: ${item.quantity}`);
        console.log(`  - Unit: '${item.unit}'`);
        console.log(`  - HSN Code: '${item.hsnSacCode}'`);
        console.log(`  - Discount Percentage: ${item.discount}`);
        console.log(`  - Amount (Taxable Amount): ${item.amount}`);
        console.log(`  - Applied Taxes: ${item.appliedTaxes.length}`);
        item.appliedTaxes.forEach(t => {
            console.log(`    * ${t.name} (${t.percentage}%): ${t.amount}`);
        });
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
