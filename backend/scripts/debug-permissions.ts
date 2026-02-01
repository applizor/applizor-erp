
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Permissions ---');

    // 1. List all Roles
    const roles = await prisma.role.findMany({
        include: {
            permissions: true
        }
    });

    console.log(`Found ${roles.length} roles.`);

    for (const role of roles) {
        console.log(`\nRole: ${role.name} (ID: ${role.id})`);
        console.log(`Permissions (${role.permissions.length}):`);

        // Filter for Invoice related just to be concise
        const invoicePerms = role.permissions.filter(p => p.module.toLowerCase().includes('invoice'));

        if (invoicePerms.length === 0) {
            console.log('  No "Invoice" related permissions found.');
        }

        for (const p of invoicePerms) {
            console.log(`  - Module: "${p.module}" | Delete: ${p.deleteLevel}`);
        }

        // Also check for "Invoices" plural just in case
        const pluralPerms = role.permissions.filter(p => p.module === 'Invoices');
        if (pluralPerms.length > 0) {
            console.log('  WARNING: Found "Invoices" (plural) module string!');
            pluralPerms.forEach(p => console.log(`    - ${p.module}: ${p.deleteLevel}`));
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
