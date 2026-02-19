
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Salary Components & Templates...');

    // Get all companies
    const companies = await prisma.company.findMany();

    if (companies.length === 0) {
        console.error('❌ No companies found! Please create a company first.');
        return;
    }

    console.log(`🏢 Seeding for ${companies.length} companies...`);

    for (const company of companies) {
        const companyId = company.id;
        console.log(`\nProcessing Company: ${company.name} (${companyId})`);

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
                defaultValue: 50,
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
            },
            // Consolidated Pay Component
            {
                name: 'Consolidated Pay',
                type: 'earning',
                calculationType: 'formula',
                defaultValue: 0,
                description: 'Single component structure for employees with flat salary'
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
                // FORCE UPDATE to ensure it is active
                const updated = await prisma.salaryComponent.update({
                    where: { id: exists.id },
                    data: { isActive: true }
                });
                createdComponents[comp.name] = updated;
                console.log(`ℹ️ Component Exists & Activated: ${comp.name}`);
            }
        }

        // --- Seed Standard Template ---
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
                { name: 'House Rent Allowance (HRA)', calculationType: 'formula', formula: 'BASIC * 0.5', value: 0 },
                { name: 'Conveyance Allowance', calculationType: 'flat', value: 1600 },
                { name: 'Medical Allowance', calculationType: 'flat', value: 1250 },
                { name: 'Special Allowance', calculationType: 'formula', formula: 'GROSS - BASIC - HRA - 1600 - 1250', value: 0 },

                { name: 'Provident Fund (PF)', calculationType: 'formula', formula: '0', value: 0 },
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

        // --- Seed Consolidated Pay Template ---
        const consolidatedTemplateName = 'Consolidated Pay (Flat)';
        const consolidatedExists = await prisma.salaryTemplate.findFirst({
            where: { companyId, name: consolidatedTemplateName }
        });

        if (!consolidatedExists) {
            const template = await prisma.salaryTemplate.create({
                data: {
                    companyId,
                    name: consolidatedTemplateName,
                    description: 'Single component structure for employees with flat salary (Zero Deductions)'
                }
            });

            const consolidatedComp = createdComponents['Consolidated Pay'];

            if (consolidatedComp) {
                // Add to Template: Formula = GROSS (100% of CTC)
                await prisma.salaryTemplateComponent.create({
                    data: {
                        templateId: template.id,
                        componentId: consolidatedComp.id,
                        calculationType: 'formula',
                        formula: 'GROSS',
                        value: 0
                    }
                });
                console.log(`✅ Created Template: ${consolidatedTemplateName}`);
            } else {
                console.warn(`⚠️ Could not create Template ${consolidatedTemplateName} because component is missing`);
            }
        } else {
            console.log(`ℹ️ Template Exists: ${consolidatedTemplateName}`);
        }

        // --- Seed Applizor Standard Template (60-20-10-10) ---
        const applizorTemplateName = 'Applizor Standard Structure';
        const applizorExists = await prisma.salaryTemplate.findFirst({
            where: { companyId, name: applizorTemplateName }
        });

        if (!applizorExists) {
            const template = await prisma.salaryTemplate.create({
                data: {
                    companyId,
                    name: applizorTemplateName,
                    description: 'Custom Structure: Basic(60%), HRA(20%), Conveyance(10%), Special(10%)'
                }
            });

            // Add Components to Template
            // Based on 14,000 breakdown:
            // Basic 8400 (60%), HRA 2800 (20%), Conv 1400 (10%), Special 1400 (10%)
            const templateComponents = [
                { name: 'Basic Salary', calculationType: 'formula', formula: 'GROSS * 0.60', value: 0 },
                { name: 'House Rent Allowance (HRA)', calculationType: 'formula', formula: 'GROSS * 0.20', value: 0 },
                { name: 'Conveyance Allowance', calculationType: 'formula', formula: 'GROSS * 0.10', value: 0 },
                { name: 'Special Allowance', calculationType: 'formula', formula: 'GROSS * 0.10', value: 0 },

                // Statutory placeholders (0 unless enforced by config)
                { name: 'Provident Fund (PF)', calculationType: 'formula', formula: '0', value: 0 },
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
            console.log(`✅ Created Template: ${applizorTemplateName}`);
        } else {
            console.log(`ℹ️ Template Exists: ${applizorTemplateName}`);
        }

    } // End of company loop

    console.log('\n✨ Seeding completed for all companies.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
