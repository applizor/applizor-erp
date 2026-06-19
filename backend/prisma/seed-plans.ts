import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Services and Subscription Plans...');

    // Get the first company
    const company = await prisma.company.findFirst();

    if (!company) {
        console.error('❌ No company found! cannot seed.');
        process.exit(1);
    }

    console.log(`Organization: ${company.name}`);

    // 1. Create or update the Service
    const service = await prisma.service.upsert({
        where: {
            companyId_code: {
                companyId: company.id,
                code: 'retail_erp'
            }
        },
        update: {
            name: 'Retail ERP Billing',
            category: 'SaaS',
            description: 'Core retail billing and accounting ERP platform'
        },
        create: {
            companyId: company.id,
            name: 'Retail ERP Billing',
            code: 'retail_erp',
            category: 'SaaS',
            description: 'Core retail billing and accounting ERP platform'
        }
    });

    console.log(`✅ Service created/updated: ${service.name} (Code: ${service.code})`);

    // 2. Define regional plans (INR vs USD) and type (SaaS vs One-time)
    const plans = [
        {
            name: 'Retail ERP Basic (INR)',
            code: 'retail_erp_basic_inr',
            price: 299.00,
            currency: 'INR',
            interval: 'monthly',
            planType: 'SaaS',
            features: [
                'Basic Billing & Inventory',
                'GST Reporting',
                'Standard Mobile App access',
                'Single Store support'
            ]
        },
        {
            name: 'Retail ERP Basic (USD)',
            code: 'retail_erp_basic_usd',
            price: 5.00,
            currency: 'USD',
            interval: 'monthly',
            planType: 'SaaS',
            features: [
                'Basic Billing & Inventory',
                'Tax Calculation',
                'Standard Mobile App access',
                'Single Store support'
            ]
        },
        {
            name: 'ERP Installation (INR)',
            code: 'setup_inr',
            price: 1000.00,
            currency: 'INR',
            interval: 'monthly', // Defaults on prisma but treated as one-time
            planType: 'One-time',
            features: [
                'Database Setup & Config',
                '1-hour Training session',
                'Printer integration'
            ]
        },
        {
            name: 'ERP Installation (USD)',
            code: 'setup_usd',
            price: 25.00,
            currency: 'USD',
            interval: 'monthly',
            planType: 'One-time',
            features: [
                'Database Setup & Config',
                '1-hour Training session',
                'Printer integration'
            ]
        }
    ];

    for (const plan of plans) {
        await prisma.subscriptionPlan.upsert({
            where: {
                companyId_code: {
                    companyId: company.id,
                    code: plan.code
                }
            },
            update: {
                name: plan.name,
                price: plan.price,
                currency: plan.currency,
                interval: plan.interval,
                planType: plan.planType,
                features: plan.features,
                serviceId: service.id
            },
            create: {
                companyId: company.id,
                serviceId: service.id,
                name: plan.name,
                code: plan.code,
                price: plan.price,
                currency: plan.currency,
                interval: plan.interval,
                planType: plan.planType,
                features: plan.features
            }
        });
    }

    console.log(`✅ ${plans.length} regional plans seeded/updated successfully under ${service.name}.`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
