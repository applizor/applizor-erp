
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Subscription Plans...');

    // Get the first company (assuming single tenant or main company)
    const company = await prisma.company.findFirst();

    if (!company) {
        console.error('❌ No company found! cannot seed plans.');
        process.exit(1);
    }

    console.log(`organization: ${company.name}`);

    const plans = [
        {
            name: 'Basic',
            code: 'basic_monthly',
            price: 99.00,
            interval: 'monthly',
            features: [
                'Up to 5 Users',
                'Basic Reporting',
                'Standard Support'
            ]
        },
        {
            name: 'Pro',
            code: 'pro_monthly',
            price: 199.00,
            interval: 'monthly',
            features: [
                'Up to 20 Users',
                'Advanced Reporting',
                'Priority Support',
                'AI Analytics'
            ]
        },
        {
            name: 'Enterprise',
            code: 'enterprise_monthly',
            price: 499.00,
            interval: 'monthly',
            features: [
                'Unlimited Users',
                'Custom Integrations',
                '24/7 Dedicated Support',
                'White Labeling'
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
                interval: plan.interval,
                features: plan.features
            },
            create: {
                companyId: company.id,
                name: plan.name,
                code: plan.code,
                price: plan.price,
                interval: plan.interval,
                features: plan.features
            }
        });
    }

    console.log(`✅ ${plans.length} Subscription Plans seeded/updated`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
