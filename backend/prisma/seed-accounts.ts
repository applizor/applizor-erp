import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Ledger Accounts seed...');

    // Get First Company
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('❌ No company found! Run main seed first or create a company.');
        return;
    }
    console.log(`Using Company: ${company.name} (${company.id})`);

    // Create Default Ledger Accounts
    const accountTypes = [
        { name: 'Cash', type: 'asset', code: '1001' },
        { name: 'Accounts Receivable', type: 'asset', code: '1200' },
        { name: 'Accounts Payable', type: 'liability', code: '2000' },
        { name: 'Sales Revenue', type: 'fincome', code: '4000' },
        { name: 'Office Expenses', type: 'expense', code: '5000' },
        { name: 'Bank Account', type: 'asset', code: '1002' }
    ];

    for (const acc of accountTypes) {
        const existing = await prisma.ledgerAccount.findFirst({
            where: {
                companyId: company.id,
                code: acc.code
            }
        });

        if (!existing) {
            await prisma.ledgerAccount.create({
                data: {
                    companyId: company.id,
                    name: acc.name,
                    code: acc.code,
                    type: acc.type,
                    balance: 0
                }
            });
            console.log(`✅ Created ${acc.name} (${acc.code})`);
        } else {
            console.log(`ℹ️ ${acc.name} (${acc.code}) already exists`);
        }
    }
    console.log('✅ Default Ledger Accounts seeding completed');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
