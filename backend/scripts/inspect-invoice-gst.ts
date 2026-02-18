import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const invoiceNumber = 'INV-2026-00004';
    console.log(`Inspecting ${invoiceNumber}...`);

    const invoice = await prisma.invoice.findFirst({
        where: { invoiceNumber },
        include: { client: true, items: true }
    });

    if (!invoice) {
        console.log('❌ Invoice not found');
        return;
    }

    console.log('--- Invoice Details ---');
    console.log('ID:', invoice.id);
    console.log('Invoice #:', invoice.invoiceNumber); // ADDED THIS
    console.log('Date:', invoice.invoiceDate);
    console.log('Status:', invoice.status);
    console.log('Client Name:', invoice.client?.name);
    console.log('Client GSTIN:', invoice.client?.gstin);
    console.log('Total:', invoice.total);
    console.log('Tax:', invoice.tax);

    const entry = await prisma.journalEntry.findFirst({
        where: { reference: invoiceNumber },
        include: { lines: { include: { account: true } } }
    });

    if (!entry) {
        console.log('❌ Journal Entry not found');
        return;
    }

    // REPLICATE getGstSummary LOGIC
    const companyId = invoice.companyId;
    const startDate = new Date('2026-02-01'); // Start of month
    const endDate = new Date('2026-02-28');   // End of month

    console.log(`\n--- Simulating Report for ${startDate.toISOString()} to ${endDate.toISOString()} ---`);

    const gstAccounts = await prisma.ledgerAccount.findMany({
        where: {
            companyId,
            code: { in: ['1300', '1301', '1302', '2200', '2201', '2202'] }
        }
    });
    const accountIds = gstAccounts.map(a => a.id);
    console.log('GST Account IDs found:', accountIds.length);

    const lines = await prisma.journalEntryLine.findMany({
        where: {
            accountId: { in: accountIds },
            journalEntry: {
                companyId,
                date: { gte: startDate, lte: endDate },
                status: 'posted'
            }
        },
        include: { account: true, journalEntry: true }
    });

    console.log('Total GST Lines found:', lines.length);

    // 3. Prepare Detailed Transaction List
    const invoiceRefs = [...new Set(
        lines
            .filter(l => l.journalEntry.reference && l.journalEntry.reference.startsWith('INV-'))
            .map(l => l.journalEntry.reference!)
    )];

    console.log(`\nInvoice Refs found: ${invoiceRefs.length}`);
    invoiceRefs.forEach(ref => console.log(`  - ${ref}`));

    const invoices = await prisma.invoice.findMany({
        where: {
            companyId,
            invoiceNumber: { in: invoiceRefs }
        },
        include: { client: true }
    });

    console.log(`Invoices found in DB: ${invoices.length}`);
    invoices.forEach(inv => console.log(`  - Found Invoice: ${inv.invoiceNumber}, Client: ${inv.client?.name}, GSTIN: ${inv.client?.gstin}`));

    const b2bTransactions: any[] = [];
    const b2cTransactions: any[] = [];

    invoices.forEach(inv => {
        // Find all GST lines associated with this invoice's journal entry
        const invLines = lines.filter(l => l.journalEntry.reference === inv.invoiceNumber);

        console.log(`Processing ${inv.invoiceNumber}: ${invLines.length} GST lines found`);

        let cgst = 0, sgst = 0, igst = 0;

        // Sum up tax components from the ledger lines
        invLines.forEach(l => {
            const isOutput = ['2200', '2201', '2202'].includes(l.account.code); // Liability codes
            console.log(`  Line ${l.account.code} (${l.account.name}): Credit ${l.credit}, Debit ${l.debit}, IsOutput: ${isOutput}`);
            if (isOutput) {
                const val = Number(l.credit) - Number(l.debit);
                if (l.account.code === '2200') cgst += val;      // Output CGST
                else if (l.account.code === '2201') sgst += val; // Output SGST
                else if (l.account.code === '2202') igst += val; // Output IGST
            }
        });

        const totalTax = cgst + sgst + igst;
        console.log(`  Total Tax Calculated: ${totalTax}`);

        // Skip if no tax output (might be exempt or input only)
        if (totalTax <= 0) {
            console.log('  SKIPPING: Total tax <= 0');
            return;
        }

        const taxableValue = Number(inv.subtotal);
        if (inv.client.gstin && inv.client.gstin.length > 5) {
            b2bTransactions.push({ invoiceNumber: inv.invoiceNumber, totalTax });
            console.log('  -> Added to B2B');
        } else {
            b2cTransactions.push({ invoiceNumber: inv.invoiceNumber, totalTax });
            console.log('  -> Added to B2C');
        }
    });

    console.log(`\nFinal Results: B2B: ${b2bTransactions.length}, B2C: ${b2cTransactions.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
