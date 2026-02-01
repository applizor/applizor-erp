
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Final Test: Quotation to Invoice Math ---');

    const quotationId = 'a8ed8d0b-ca82-42d6-8eeb-9a68516f5643';
    const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId },
        include: { items: { include: { appliedTaxes: true } } }
    });

    if (!quotation) {
        console.log('Quotation NOT FOUND.');
        return;
    }

    let subtotal = 0;
    let totalTax = 0;
    let totalItemDiscount = 0;

    const items = quotation.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.unitPrice),
        discount: Number(item.discount),
        explicitAppliedTaxes: item.appliedTaxes
    }));

    items.forEach(item => {
        const grossAmount = item.quantity * item.rate;
        const discountPercentage = item.discount;
        const itemDiscount = grossAmount * (discountPercentage / 100);
        const taxableAmount = grossAmount - itemDiscount;

        let itemTotalTax = 0;
        item.explicitAppliedTaxes.map(t => {
            const amount = taxableAmount * (Number(t.percentage) / 100);
            itemTotalTax += amount;
            return { ...t, amount: new Decimal(amount) };
        });

        subtotal += grossAmount;
        totalTax += itemTotalTax;
        totalItemDiscount += itemDiscount;
    });

    const overallDiscount = Number(quotation.discount || 0);
    const total = subtotal + totalTax - totalItemDiscount - overallDiscount;

    console.log(`Subtotal (Gross): ${subtotal}`);
    console.log(`Item Discounts: ${totalItemDiscount}`);
    console.log(`Taxable Amount: ${subtotal - totalItemDiscount}`);
    console.log(`Total Tax: ${totalTax}`);
    console.log(`Global Discount: ${overallDiscount}`);
    console.log(`FINAL TOTAL: ${total}`);

    const expectedTotal = 107100;
    if (Math.round(total) === expectedTotal) {
        console.log('\n✅ MATH MATCHES EXPECTATION (1,07,100)');
    } else {
        console.log(`\n❌ MATH MISMATCH! Expected ${expectedTotal}, got ${total}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
