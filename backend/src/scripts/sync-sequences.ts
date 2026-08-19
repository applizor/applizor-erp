import prisma from '../prisma/client';

async function main() {
    console.log('🔄 Starting Database Sequence Synchronization...');

    const companies = await prisma.company.findMany({ select: { id: true, name: true } });
    console.log(`Found ${companies.length} companies.`);

    for (const company of companies) {
        console.log(`\n🏢 Processing Company: ${company.name} (${company.id})`);

        // Synchronize Invoice (INV) & Quotation (QTN) in Invoice table
        const invoices = await prisma.invoice.findMany({
            where: { companyId: company.id },
            select: { invoiceNumber: true }
        });

        const maxSeqs: Record<string, number> = { INV: 0, QTN: 0, QUO: 0 };

        for (const inv of invoices) {
            if (!inv.invoiceNumber) continue;
            const parts = inv.invoiceNumber.split('-');
            if (parts.length >= 3) {
                const prefix = parts[0];
                const year = parseInt(parts[1], 10);
                const seq = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(seq)) {
                    const currentMax = maxSeqs[`${prefix}_${year}`] || 0;
                    if (seq > currentMax) {
                        maxSeqs[`${prefix}_${year}`] = seq;
                    }
                }
            }
        }

        // Synchronize Quotations (QUO) in Quotation table
        const quotations = await prisma.quotation.findMany({
            where: { companyId: company.id },
            select: { quotationNumber: true }
        });

        for (const quo of quotations) {
            if (!quo.quotationNumber) continue;
            const parts = quo.quotationNumber.split('-');
            if (parts.length >= 3) {
                const prefix = parts[0];
                const year = parseInt(parts[1], 10);
                const seq = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(seq)) {
                    const currentMax = maxSeqs[`${prefix}_${year}`] || 0;
                    if (seq > currentMax) {
                        maxSeqs[`${prefix}_${year}`] = seq;
                    }
                }
            }
        }

        // Upsert sequence counters in InvoiceSequence table
        for (const [key, maxSeq] of Object.entries(maxSeqs)) {
            if (maxSeq === 0) continue;
            const [prefix, yearStr] = key.split('_');
            const year = parseInt(yearStr, 10);
            if (!prefix || isNaN(year)) continue;

            const updated = await prisma.invoiceSequence.upsert({
                where: {
                    companyId_prefix_year: {
                        companyId: company.id,
                        prefix,
                        year
                    }
                },
                update: {
                    lastSeq: maxSeq
                },
                create: {
                    companyId: company.id,
                    prefix,
                    year,
                    lastSeq: maxSeq
                }
            });

            console.log(`  ✅ Synced [${prefix}-${year}]: lastSeq set to ${updated.lastSeq} (Next generated will be ${maxSeq + 1})`);
        }
    }

    console.log('\n🎉 Sequence Synchronization Completed Successfully!');
}

main()
    .catch((err) => {
        console.error('❌ Error during sequence sync:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
