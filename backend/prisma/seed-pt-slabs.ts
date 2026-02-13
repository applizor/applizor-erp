import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding PT Slabs and Default Components...');

    const companies = await prisma.company.findMany();

    for (const company of companies) {
        console.log(`Configuring for company: ${company.name}`);

        // 1. PT Slabs
        const ptSlabs = [
            { min: 0, max: 7500, amount: 0 },
            { min: 7501, max: 10000, amount: 175 },
            { min: 10001, max: 999999999, amount: 200, exceptionMonth: 2, exceptionAmount: 300 }
        ];

        await prisma.statutoryConfig.upsert({
            where: { companyId: company.id },
            update: { ptSlabs, professionalTaxEnabled: true },
            create: {
                companyId: company.id,
                ptSlabs,
                professionalTaxEnabled: true,
                pfEmployeeRate: 12,
                pfEmployerRate: 12,
                pfBasicLimit: 15000,
                esiEmployeeRate: 0.75,
                esiEmployerRate: 3.25,
                esiGrossLimit: 21000,
            }
        });

        // 2. Standard Components
        const components = [
            { name: 'Basic Salary', type: 'earning', calculationType: 'fixed', defaultValue: 0 },
            { name: 'House Rent Allowance (HRA)', type: 'earning', calculationType: 'fixed', defaultValue: 0 },
            { name: 'Conveyance Allowance', type: 'earning', calculationType: 'fixed', defaultValue: 1600 },
            { name: 'Special Allowance', type: 'earning', calculationType: 'fixed', defaultValue: 0 },
            { name: 'Professional Tax', type: 'deduction', calculationType: 'fixed', defaultValue: 200 }, // Will be overridden by logic
            { name: 'Provident Fund (PF)', type: 'deduction', calculationType: 'percentage', defaultValue: 12 },
            { name: 'ESI', type: 'deduction', calculationType: 'percentage', defaultValue: 0.75 }
        ];

        for (const comp of components) {
            const existing = await prisma.salaryComponent.findFirst({
                where: { companyId: company.id, name: comp.name }
            });

            if (!existing) {
                await prisma.salaryComponent.create({
                    data: {
                        companyId: company.id,
                        name: comp.name,
                        type: comp.type,
                        calculationType: comp.calculationType,
                        defaultValue: comp.defaultValue,
                        isActive: true
                    }
                });
                console.log(`Created component: ${comp.name}`);
            }
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
