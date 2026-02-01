
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Quotation Conversion ---');

    // 1. Get the most recent accepted or sent quotation
    const quotation = await prisma.quotation.findFirst({
        where: {
            items: { some: {} } // ensure it has items
        },
        orderBy: { createdAt: 'desc' },
        include: {
            items: {
                include: {
                    appliedTaxes: true
                }
            }
        }
    });

    if (!quotation) {
        console.log('No quotation found to test.');
        return;
    }

    console.log(`Analyzing Quotation: ${quotation.quotationNumber} (ID: ${quotation.id})`);
    console.log(`Global Discount: ${quotation.discount}`);

    // 2. Simulate the mapping logic from convertQuotationToInvoice
    const mappedItems = quotation.items.map(item => {
        const mapped = {
            description: item.description,
            quantity: Number(item.quantity),
            rate: Number(item.unitPrice),
            taxRateIds: item.appliedTaxes.map(at => at.taxRateId),
            unit: item.unit || undefined,
            discount: Number(item.discount),
            hsnSacCode: item.hsnSacCode || undefined
        };

        console.log(`\nItem: ${item.description}`);
        console.log(`  - Original Discount: ${item.discount}`);
        console.log(`  - Mapped Discount: ${mapped.discount}`);
        console.log(`  - Original HSN: ${item.hsnSacCode}`);
        console.log(`  - Mapped HSN: ${mapped.hsnSacCode}`);
        console.log(`  - Applied Taxes (Count): ${item.appliedTaxes.length}`);
        item.appliedTaxes.forEach(t => {
            console.log(`    * TaxRateID: ${t.taxRateId} | Name: ${t.name} | %: ${t.percentage}`);
        });
        console.log(`  - Mapped TaxRateIDs: ${JSON.stringify(mapped.taxRateIds)}`);

        return mapped;
    });

    // 3. Check CreateInvoice Payload Construction
    const payload = {
        companyId: quotation.companyId,
        clientId: quotation.clientId || '',
        items: mappedItems,
        currency: quotation.currency,
        notes: quotation.notes || undefined,
        terms: quotation.paymentTerms || undefined,
        discount: Number(quotation.discount),
        type: 'invoice'
    };

    console.log('\n--- Final Simulated Payload ---');
    console.log(`Global Discount: ${payload.discount}`);
    console.log(`Item Count: ${payload.items.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
