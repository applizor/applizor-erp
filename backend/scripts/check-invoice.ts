
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = 'f0fdc3b7-dd0d-4d22-9ba3-db81214f6a14';
    console.log(`Checking invoice with ID: ${id}`);

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                client: true,
                company: true,
                items: true
            }
        });

        if (invoice) {
            console.log('✅ Invoice found!');
            console.log('Invoice Number:', invoice.invoiceNumber);
            console.log('Client:', invoice.client?.name);
        } else {
            console.log('❌ Invoice NOT found.');
            // List all invoices to see what IDs exist
            const recent = await prisma.invoice.findMany({ select: { id: true, invoiceNumber: true }, take: 5 });
            console.log('Recent Invoices:', recent);
        }
    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
