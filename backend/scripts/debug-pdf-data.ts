
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugInvoice() {
    try {
        // Get the most recent invoice
        const invoice = await prisma.invoice.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { company: true }
        });

        if (!invoice) {
            console.log("No invoices found.");
            return;
        }

        console.log("=== LATEST INVOICE DEBUG ===");
        console.log(`Invoice Number: ${invoice.invoiceNumber}`);
        console.log(`ID: ${invoice.id}`);
        console.log(`includeBankDetails (DB Value):`, invoice.includeBankDetails);

        console.log("\n=== COMPANY BANK DETAILS ===");
        console.log(`Company Name: ${invoice.company.name}`);
        console.log(`Bank Name:`, invoice.company.bankName);
        console.log(`Account Number:`, invoice.company.bankAccountNumber);
        console.log(`IFSC:`, invoice.company.bankIfscCode);

        if (!invoice.includeBankDetails) {
            console.log("\n⚠️ ISSUE: includeBankDetails is FALSE or NULL/UNDEFINED");
        }

        if (!invoice.company.bankName || !invoice.company.bankAccountNumber) {
            console.log("\n⚠️ ISSUE: Company Bank Name or Account Number is MISSING");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

debugInvoice();
