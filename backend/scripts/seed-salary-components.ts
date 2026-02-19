
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Salary Components & Templates...');

    // Get the first company (assuming single tenant for now or apply to all)
    const company = await prisma.company.findFirst();

    if (!company) {
        console.error('❌ No company found! Please create a company first.');
        return;
    }

    const companyId = company.id;

    const components = [
        // Earnings
        {
            name: 'Basic Salary',
            type: 'earning',
            calculationType: 'percentage', // 50% of Gross
            defaultValue: 50,
            description: 'Base salary component, typically 50% of Gross'
        },
        {
            name: 'House Rent Allowance (HRA)',
            type: 'earning',
            calculationType: 'percentage', // 50% of Basic => 25% of Gross
            defaultValue: 50, // relative to Basic usually? Wait, formulas are better.
            // For simplicity in this system:
            // Let's make Basic a formula: = GROSS * 0.5
            // HRA a formula: = BASIC * 0.5
            description: 'Allowance for rental accommodation'
        },
        {
            name: 'Conveyance Allowance',
            type: 'earning',
            calculationType: 'flat',
            defaultValue: 1600,
            description: 'Allowance for commute'
        },
        {
            name: 'Special Allowance',
            type: 'earning',
            calculationType: 'formula', // Balancing figure
            defaultValue: 0,
            description: 'Balancing component'
        },
        {
            name: 'Medical Allowance',
            type: 'earning',
            calculationType: 'flat',
            defaultValue: 1250,
            description: 'Reimbursement for medical expenses'
        },

        // Deductions
        {
            name: 'Provident Fund (PF)',
            type: 'deduction',
            calculationType: 'formula', // Auto-calculated
            defaultValue: 0,
            description: 'Employee EPF contribution (12% of Basic)'
        },
        {
            name: 'Professional Tax (PT)',
            type: 'deduction',
            calculationType: 'formula',
            defaultValue: 0,
            description: 'State-wise Professional Tax'
        },
        {
            name: 'ESI',
            type: 'deduction',
            calculationType: 'formula',
            defaultValue: 0,
            description: 'Employee State Insurance (0.75% of Gross)'
        },
        {
            name: 'TDS',
            type: 'deduction',
            calculationType: 'flat',
            defaultValue: 0,
            description: 'Tax Deducted at Source'
        }
    ];

    const createdComponents: any = {};

    for (const comp of components) {
        const exists = await prisma.salaryComponent.findFirst({
            where: {
                companyId,
                name: comp.name
            }
        });

        if (!exists) {
            const created = await prisma.salaryComponent.create({
                data: {
                    companyId,
                    name: comp.name,
                    type: comp.type,
                    calculationType: comp.calculationType,
                    defaultValue: comp.defaultValue,
                    isActive: true
                }
            });
            createdComponents[comp.name] = created;
            console.log(`✅ Created Component: ${comp.name}`);
        } else {
            createdComponents[comp.name] = exists;
            console.log(`ℹ️ Component Exists: ${comp.name}`);
        }
    }

    // --- Seed Template ---
    const templateName = 'Standard Structure (India)';
    const templateExists = await prisma.salaryTemplate.findFirst({
        where: { companyId, name: templateName }
    });

    if (!templateExists) {
        const template = await prisma.salaryTemplate.create({
            data: {
                companyId,
                name: templateName,
                description: 'Standard Indian Salary Structure with Basic (50%), HRA, and Statutory Deductions'
            }
        });

        // Add Components to Template
        const templateComponents = [
            { name: 'Basic Salary', calculationType: 'formula', formula: 'GROSS * 0.5', value: 0 },
            { name: 'House Rent Allowance (HRA)', calculationType: 'formula', formula: 'BASIC * 0.5', value: 0 }, // 50% of Basic
            { name: 'Conveyance Allowance', calculationType: 'flat', value: 1600 },
            { name: 'Medical Allowance', calculationType: 'flat', value: 1250 },
            // Special Allowance = GROSS - BASIC - HRA - CONVEYANCE - MEDICAL
            { name: 'Special Allowance', calculationType: 'formula', formula: 'GROSS - BASIC - HRA - 1600 - 1250', value: 0 },

            // Deductions (Value 0 because config drives them, but adding them makes them visible)
            { name: 'Provident Fund (PF)', calculationType: 'formula', formula: '0', value: 0 }, // Handled by Statutory Logic
            { name: 'ESI', calculationType: 'formula', formula: '0', value: 0 },
            { name: 'Professional Tax (PT)', calculationType: 'formula', formula: '0', value: 0 },
            { name: 'TDS', calculationType: 'flat', value: 0 },
        ];

        for (const tc of templateComponents) {
            const comp = createdComponents[tc.name];
            if (comp) {
                await prisma.salaryTemplateComponent.create({
                    data: {
                        templateId: template.id,
                        componentId: comp.id,
                        calculationType: tc.calculationType,
                        formula: tc.formula,
                        value: tc.value
                    }
                });
            }
        }
        console.log(`✅ Created Template: ${templateName}`);
    } else {
        console.log(`ℹ️ Template Exists: ${templateName}`);
    }

    console.log('✨ Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
