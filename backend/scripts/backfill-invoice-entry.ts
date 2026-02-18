import { PrismaClient } from '@prisma/client';
import * as accountingService from '../src/services/accounting.service';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting backfill for INV-2026-00004...');

    try {
        const invoice = await prisma.invoice.findFirst({
            where: { invoiceNumber: 'INV-2026-00004' }
        });

        if (!invoice) {
            console.error('❌ Invoice INV-2026-00004 not found!');
            return;
        }

        console.log(`Found Invoice: ${invoice.id} (${invoice.invoiceNumber})`);

        // Check if entry already exists
        const existingEntry = await prisma.journalEntry.findFirst({
            where: { reference: invoice.invoiceNumber }
        });

        if (existingEntry) {
            console.log(`⚠️ Journal Entry already exists: ${existingEntry.id}. Skipping.`);
            return;
        }

        // Create Entry
        console.log('Creating Journal Entry...');
        await accountingService.postInvoiceToLedger(invoice.id);
        console.log('✅ Journal Entry created successfully!');

    } catch (error) {
        console.error('❌ Error backfilling invoice:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
