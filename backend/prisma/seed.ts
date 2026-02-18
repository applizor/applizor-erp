
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Create Company
    const company = await prisma.company.create({
        data: {
            name: 'Applizor Tech',
            email: 'admin@applizor.com',
            country: 'India',
            currency: 'USD',
            isActive: true
        }
    });
    console.log('✅ Company created:', company.name);

    // 2. Create Roles
    const adminRole = await prisma.role.create({
        data: {
            name: 'Admin',
            description: 'Full Access',
            isSystem: true
        }
    });
    console.log('✅ Admin Role created');

    // 3. Create Admin User
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@applizor.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            companyId: company.id,
            isActive: true,
            roles: {
                create: {
                    roleId: adminRole.id
                }
            }
        }
    });
    console.log('✅ Admin User created: admin@applizor.com / password123');

    // 4. Create Subscription Plans
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
        await prisma.subscriptionPlan.create({
            data: {
                companyId: company.id,
                name: plan.name,
                code: plan.code,
                price: plan.price,
                interval: plan.interval,
                features: plan.features
            }
        });
    }
    console.log(`✅ ${plans.length} Subscription Plans created`);

    // 5. Create Default Ledger Accounts
    const accountTypes = [
        { name: 'Cash', type: 'asset', code: '1001' },
        { name: 'Accounts Receivable', type: 'asset', code: '1200' },
        { name: 'Accounts Payable', type: 'liability', code: '2000' },
        { name: 'Sales Revenue', type: 'fincome', code: '4000' },
        { name: 'Office Expenses', type: 'expense', code: '5000' },
        { name: 'Bank Account', type: 'asset', code: '1002' }
    ];

    for (const acc of accountTypes) {
        await prisma.ledgerAccount.upsert({
            where: {
                companyId_code: {
                    companyId: company.id,
                    code: acc.code
                }
            },
            update: {},
            create: {
                companyId: company.id,
                name: acc.name,
                code: acc.code,
                type: acc.type,
                balance: 0
            }
        });
    }
    console.log('✅ Default Ledger Accounts created');

    console.log('🚀 Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
