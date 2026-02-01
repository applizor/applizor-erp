
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const invoiceId = 'c4da5980-649f-4393-a518-2d696c1a4d61';
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
    console.log(`- Total Discount: ${invoice.discount}`);
    console.log(`- Items Count: ${invoice.items.length}`);

    invoice.items.forEach((item, i) => {
        console.log(`\nItem ${i + 1}: ${item.description}`);
        console.log(`  - Rate: ${item.rate}`);
        console.log(`  - Quantity: ${item.quantity}`);
        console.log(`  - HSN Code: '${item.hsnSacCode}'`); // Check for empty vs null
        console.log(`  - Discount: ${item.discount}`);
        console.log(`  - Amount: ${item.amount}`);
        console.log(`  - Applied Taxes: ${item.appliedTaxes.length}`);
        item.appliedTaxes.forEach(t => {
            console.log(`    * ${t.name} (${t.percentage}%): ${t.amount}`);
        });
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
