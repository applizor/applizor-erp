
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('No company found');
        return;
    }

    console.log(`Seeding dynamic templates for company: ${company.name}`);

    // 1. Ensure core components exist
    const components = [
        { name: 'Basic Salary', type: 'earning', calculationType: 'percentage', defaultValue: 45 },
        { name: 'House Rent Allowance (HRA)', type: 'earning', calculationType: 'formula', formula: 'BASIC * 0.40' },
        { name: 'Special Allowance', type: 'earning', calculationType: 'formula', formula: 'GROSS - BASIC - HOUSE_RENT_ALLOWANCE_(HRA)' },
    ];

    const componentMap: Record<string, string> = {};

    for (const c of components) {
        const comp = await prisma.salaryComponent.upsert({
            where: { id: 'fixed-id-' + c.name.toLowerCase().replace(/\s/g, '-') }, // For reproducibility
            update: { calculationType: c.calculationType },
            create: {
                companyId: company.id,
                name: c.name,
                type: c.type,
                calculationType: c.calculationType,
                defaultValue: c.defaultValue || 0
            }
        }).catch(() => {
            // Fallback if upsert fails due to missing ID
            return prisma.salaryComponent.findFirst({ where: { companyId: company.id, name: c.name } });
        });

        if (comp) componentMap[c.name] = comp.id;
    }

    // 2. Create Template
    const template = await prisma.salaryTemplate.upsert({
        where: { companyId_name: { companyId: company.id, name: 'Standard Corporate' } },
        update: {},
        create: {
            companyId: company.id,
            name: 'Standard Corporate',
            description: 'Standard Indian calculation: Basic 45%, HRA 40% of Basic, Special Allowance as Balance.',
            isActive: true
        }
    });

    // 3. Link components to template with rules
    const rules = [
        { name: 'Basic Salary', calc: 'percentage', val: 45, formula: null },
        { name: 'House Rent Allowance (HRA)', calc: 'formula', val: 0, formula: 'BASIC * 0.40' },
        { name: 'Special Allowance', calc: 'formula', val: 0, formula: 'GROSS - BASIC - HOUSE_RENT_ALLOWANCE_(HRA)' },
    ];

    for (const r of rules) {
        const compId = componentMap[r.name];
        if (compId) {
            await prisma.salaryTemplateComponent.upsert({
                where: { templateId_componentId: { templateId: template.id, componentId: compId } },
                update: { calculationType: r.calc, value: r.val, formula: r.formula },
                create: {
                    templateId: template.id,
                    componentId: compId,
                    calculationType: r.calc,
                    value: r.val,
                    formula: r.formula
                }
            });
        }
    }

    console.log('✅ Enterprise Dynamic Template seeded successfully');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
