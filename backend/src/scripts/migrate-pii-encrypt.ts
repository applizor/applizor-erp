import { PrismaClient } from '@prisma/client';
import { encryptPII } from '../utils/crypto.util';

const prisma = new PrismaClient();

async function runMigration() {
    console.log('--- STARTING PII ENCRYPTION MIGRATION ---');

    if (!process.env.ENCRYPTION_KEY) {
        console.error('FATAL: ENCRYPTION_KEY environment variable is not defined!');
        process.exit(1);
    }

    const employees = await prisma.employee.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            accountNumber: true,
            ifscCode: true,
            panNumber: true,
            aadhaarNumber: true
        }
    });

    console.log(`Found ${employees.length} employees in database. Scanning for plaintext fields...`);

    let encryptedCount = 0;

    for (const emp of employees) {
        let needsUpdate = false;
        const updateData: any = {};

        // Check and encrypt accountNumber
        if (emp.accountNumber && !emp.accountNumber.startsWith('enc:')) {
            updateData.accountNumber = encryptPII(emp.accountNumber);
            needsUpdate = true;
        }

        // Check and encrypt ifscCode
        if (emp.ifscCode && !emp.ifscCode.startsWith('enc:')) {
            updateData.ifscCode = encryptPII(emp.ifscCode);
            needsUpdate = true;
        }

        // Check and encrypt panNumber
        if (emp.panNumber && !emp.panNumber.startsWith('enc:')) {
            updateData.panNumber = encryptPII(emp.panNumber);
            needsUpdate = true;
        }

        // Check and encrypt aadhaarNumber
        if (emp.aadhaarNumber && !emp.aadhaarNumber.startsWith('enc:')) {
            updateData.aadhaarNumber = encryptPII(emp.aadhaarNumber);
            needsUpdate = true;
        }

        if (needsUpdate) {
            await prisma.employee.update({
                where: { id: emp.id },
                data: updateData
            });
            console.log(`Encrypted PII fields for employee: ${emp.firstName} ${emp.lastName || ''} (ID: ${emp.id})`);
            encryptedCount++;
        }
    }

    console.log(`\nMigration completed successfully. Encrypted ${encryptedCount} employees' PII records.`);
}

runMigration()
    .catch((err) => {
        console.error('Migration failed with error:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
