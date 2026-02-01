
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const quotationId = 'a8ed8d0b-ca82-42d6-8eeb-9a68516f5643';
    console.log(`Inspecting Quotation: ${quotationId}`);

    const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId },
        include: {
            items: {
                include: {
                    appliedTaxes: true
                }
            }
        }
    });

    if (!quotation) {
        console.log('Quotation NOT FOUND.');
        return;
    }

    console.log('Quotation Details:');
    console.log(`- Subtotal: ${quotation.subtotal}`);
    console.log(`- Total: ${quotation.total}`);
    console.log(`- Global Discount: ${quotation.discount}`);
    console.log(`- Items Count: ${quotation.items.length}`);

    quotation.items.forEach((item, i) => {
        console.log(`\nItem ${i + 1}: ${item.description}`);
        console.log(`  - unitPrice: ${item.unitPrice}`);
        console.log(`  - quantity: ${item.quantity}`);
        console.log(`  - hsnSacCode: '${item.hsnSacCode}'`);
        console.log(`  - discount: ${item.discount}`);
        console.log(`  - tax: ${item.tax} (Legacy Field)`);
        console.log(`  - appliedTaxes Count: ${item.appliedTaxes.length}`);
        item.appliedTaxes.forEach(t => {
            console.log(`    * ${t.name} (${t.percentage}%): ${t.amount}`);
        });
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
