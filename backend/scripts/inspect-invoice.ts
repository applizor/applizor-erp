
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // The ID from the screenshot URL/User Request
    // http://localhost:3000/invoices/769dd3d6-adb9-44db-ac74-5a12281f48c1
    const invoiceId = '769dd3d6-adb9-44db-ac74-5a12281f48c1';

    console.log(`Fetching Invoice ${invoiceId}...`);

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
        console.log('Invoice not found!');
        return;
    }

    console.log('Invoice Details:');
    console.log(`- Subtotal: ${invoice.subtotal}`);
    console.log(`- Total Discount (Global): ${invoice.discount}`);
    console.log(`- Total: ${invoice.total}`);

    console.log('\nItems:');
    invoice.items.forEach((item, index) => {
        console.log(`  Item ${index + 1}: ${item.description}`);
        console.log(`    - Qty: ${item.quantity}`);
        console.log(`    - Rate: ${item.rate}`);
        console.log(`    - Discount (Field): ${item.discount}`);
        console.log(`    - HSN/SAC: ${item.hsnSacCode}`);
        console.log(`    - Tax Breakdown: ${JSON.stringify(item.appliedTaxes)}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
