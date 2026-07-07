import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedCurrencies() {
  const currencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
    { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
    { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
    { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2 },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2 },
  ];

  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }
  console.log(`✓ Seeded ${currencies.length} currencies`);
}

async function seedCountries() {
  const usd = await prisma.currency.findUnique({ where: { code: 'USD' } });
  const inr = await prisma.currency.findUnique({ where: { code: 'INR' } });
  const gbp = await prisma.currency.findUnique({ where: { code: 'GBP' } });
  const eur = await prisma.currency.findUnique({ where: { code: 'EUR' } });
  const aed = await prisma.currency.findUnique({ where: { code: 'AED' } });
  const sgd = await prisma.currency.findUnique({ where: { code: 'SGD' } });

  const countries = [
    { name: 'India', code: 'IN', code3: 'IND', numeric: '356', phoneCode: '+91', currencyId: inr?.id },
    { name: 'United States', code: 'US', code3: 'USA', numeric: '840', phoneCode: '+1', currencyId: usd?.id },
    { name: 'United Kingdom', code: 'GB', code3: 'GBR', numeric: '826', phoneCode: '+44', currencyId: gbp?.id },
    { name: 'United Arab Emirates', code: 'AE', code3: 'ARE', numeric: '784', phoneCode: '+971', currencyId: aed?.id },
    { name: 'Singapore', code: 'SG', code3: 'SGP', numeric: '702', phoneCode: '+65', currencyId: sgd?.id },
  ];

  for (const c of countries) {
    await prisma.country.upsert({
      where: { code: c.code },
      update: { currencyId: c.currencyId },
      create: c,
    });
  }
  console.log(`✓ Seeded ${countries.length} countries`);
}

async function seedStates() {
  const india = await prisma.country.findUnique({ where: { code: 'IN' } });
  if (india) {
    const indianStates = [
      { name: 'Maharashtra', code: 'IN-MH' },
      { name: 'Karnataka', code: 'IN-KA' },
      { name: 'Tamil Nadu', code: 'IN-TN' },
      { name: 'Delhi', code: 'IN-DL' },
      { name: 'Madhya Pradesh', code: 'IN-MP' },
    ];
    for (const s of indianStates) {
      await prisma.state.upsert({
        where: { countryId_code: { countryId: india.id, code: s.code } },
        update: {},
        create: { countryId: india.id, ...s },
      });
    }
    console.log(`✓ Seeded ${indianStates.length} Indian states`);
  }
}

async function seedTenantPlans() {
  const plans = [
    {
      name: 'Starter',
      code: 'starter_monthly',
      description: 'For small teams just getting started',
      price: 29,
      currency: 'USD',
      billingInterval: 'monthly',
      maxUsers: 5,
      maxStorageGb: 1,
      maxCompanies: 1,
      enabledModules: { hrms: true, payroll: true, clients: true, invoices: true },
      features: { apiAccess: false, customBranding: false, prioritySupport: false, aiFeatures: false },
      sortOrder: 1,
    },
    {
      name: 'Growth',
      code: 'growth_monthly',
      description: 'For growing teams with advanced needs',
      price: 99,
      currency: 'USD',
      billingInterval: 'monthly',
      maxUsers: 20,
      maxStorageGb: 10,
      maxCompanies: 1,
      enabledModules: { hrms: true, payroll: true, clients: true, invoices: true, projects: true, crm: true, accounting: true },
      features: { apiAccess: true, customBranding: false, prioritySupport: true, aiFeatures: false },
      sortOrder: 2,
    },
    {
      name: 'Enterprise',
      code: 'enterprise_monthly',
      description: 'For large organizations with full customization',
      price: 299,
      currency: 'USD',
      billingInterval: 'monthly',
      maxUsers: 100,
      maxStorageGb: 100,
      maxCompanies: 5,
      enabledModules: { hrms: true, payroll: true, clients: true, invoices: true, projects: true, crm: true, accounting: true, recruitment: true, lms: true },
      features: { apiAccess: true, customBranding: true, prioritySupport: true, aiFeatures: true, whiteLabel: true },
      sortOrder: 3,
    },
  ];

  for (const p of plans) {
    await prisma.tenantPlan.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }
  console.log(`✓ Seeded ${plans.length} tenant plans`);
}

const INDIAN_COA = {
  name: 'Indian GAAP (Schedule III)',
  version: '1.0',
  entries: [
    { code: '1000', name: 'Cash in Hand', type: 'asset' },
    { code: '1001', name: 'Bank Account', type: 'asset' },
    { code: '1200', name: 'Sundry Debtors', type: 'asset' },
    { code: '2000', name: 'Sundry Creditors', type: 'liability' },
    { code: '2100', name: 'Capital Account', type: 'equity' },
    { code: '2300', name: 'TDS Payable', type: 'liability' },
    { code: '2400', name: 'PF Payable', type: 'liability' },
    { code: '2410', name: 'ESI Payable', type: 'liability' },
    { code: '2420', name: 'Professional Tax Payable', type: 'liability' },
    { code: '2430', name: 'Net Salary Payable', type: 'liability' },
    { code: '4000', name: 'Sales Revenue', type: 'income' },
    { code: '5000', name: 'Salary Expenses', type: 'expense' },
    { code: '5100', name: 'Rent Expenses', type: 'expense' },
    { code: '5200', name: 'Office Expenses', type: 'expense' },
    { code: '5400', name: 'PF Employer Contribution', type: 'expense' },
    { code: '5500', name: 'ESI Employer Contribution', type: 'expense' },
  ],
};

async function seedCOATemplates() {
  const templates = [
    { code: 'IN', template: INDIAN_COA },
  ];

  for (const { code, template } of templates) {
    const country = await prisma.country.findUnique({ where: { code } });
    if (!country) continue;

    const existing = await prisma.coaTemplate.findUnique({
      where: { countryId_version: { countryId: country.id, version: template.version } },
    });

    if (existing) continue;

    await prisma.coaTemplate.create({
      data: {
        countryId: country.id,
        name: template.name,
        version: template.version,
        entries: { create: template.entries },
      },
    });
  }
  console.log('✓ Seeded COA Templates');
}

async function seedStatutoryRules() {
  const india = await prisma.country.findUnique({ where: { code: 'IN' } });
  if (!india) return;

  const rules = [
    {
      code: 'pf',
      name: 'Provident Fund',
      category: 'retirement',
      ruleType: 'percentage',
      employeeRate: 12,
      employerRate: 12,
      wageCeiling: 15000,
      effectiveFrom: new Date('2024-04-01'),
    },
    {
      code: 'esi',
      name: 'Employee State Insurance',
      category: 'health',
      ruleType: 'percentage',
      employeeRate: 0.75,
      employerRate: 3.25,
      wageCeiling: 21000,
      effectiveFrom: new Date('2024-04-01'),
    },
    {
      code: 'pt',
      name: 'Professional Tax',
      category: 'tax',
      ruleType: 'slab',
      slabData: {
        'Maharashtra': [
          { min: 0, max: 10000, amount: 0 },
          { min: 10001, max: 25000, amount: 200, exceptionMonth: 2, exceptionAmount: 300 },
          { min: 25001, max: 75000, amount: 300, exceptionMonth: 2, exceptionAmount: 400 },
          { min: 75001, max: Infinity, amount: 300, exceptionMonth: 2, exceptionAmount: 400 },
        ],
        'Karnataka': [
          { min: 0, max: 15000, amount: 0 },
          { min: 15001, max: 50000, amount: 150 },
          { min: 50001, max: 75000, amount: 300 },
          { min: 75001, max: 100000, amount: 500 },
          { min: 100001, max: Infinity, amount: 700 },
        ],
        'Tamil Nadu': [
          { min: 0, max: 3500, amount: 0 },
          { min: 3501, max: 5000, amount: 10 },
          { min: 5001, max: 6000, amount: 25 },
          { min: 6001, max: 10000, amount: 55 },
          { min: 10001, max: 15000, amount: 100 },
          { min: 15001, max: 20000, amount: 160 },
          { min: 20001, max: Infinity, amount: 200 },
        ],
        'Delhi': [
          { min: 0, max: 25000, amount: 0 },
          { min: 25001, max: Infinity, amount: 200 },
        ],
      },
      effectiveFrom: new Date('2024-04-01'),
    },
  ];

  for (const rule of rules) {
    const existing = await prisma.statutoryRule.findFirst({
      where: { countryId: india.id, code: rule.code, effectiveFrom: rule.effectiveFrom }
    });
    if (!existing) {
      await prisma.statutoryRule.create({
        data: { ...rule, countryId: india.id },
      });
    }
  }
  console.log(`✓ Seeded Statutory Rules for India`);
}

async function main() {
  console.log('🌱 Running master database seed...');

  // 1. Core Platform Lookup Data
  await seedCurrencies();
  await seedCountries();
  await seedStates();
  await seedTenantPlans();
  await seedCOATemplates();
  await seedStatutoryRules();

  const india = await prisma.country.findUnique({ where: { code: 'IN' } });
  const madhyaPradesh = india ? await prisma.state.findFirst({ where: { countryId: india.id, code: 'IN-MP' } }) : null;

  // 2. Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'Full Access', isSystem: true },
  });

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: { name: 'Super Admin', description: 'Platform Administrator', isSystem: true },
  });

  console.log('✓ Roles seeded');

  // Clean up any extra companies
  await prisma.company.deleteMany({ where: { name: 'Applizor Tech' } });

  // 3. Find or Create Companies
  const targetCompanies = [
    { name: 'Applizor Softech LLP', email: 'admin@applizor.com' }
  ];

  const companies: any[] = [];

  for (const tc of targetCompanies) {
    let company = await prisma.company.findFirst({ where: { name: tc.name } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: tc.name,
          email: tc.email,
          country: 'India',
          countryId: india?.id,
          stateId: madhyaPradesh?.id,
          timezone: 'Asia/Kolkata',
          locale: 'en-IN',
          currency: 'INR',
          isActive: true,
        }
      });
      console.log(`✓ Created Company: ${company.name}`);
    } else {
      // Update missing country/state references
      company = await prisma.company.update({
        where: { id: company.id },
        data: {
          countryId: india?.id,
          stateId: madhyaPradesh?.id,
          currency: 'INR'
        }
      });
      console.log(`✓ Updated Company: ${company.name}`);
    }
    companies.push(company);
  }

  // 4. Assign Starter Subscription to companies
  const starterPlan = await prisma.tenantPlan.findUnique({ where: { code: 'starter_monthly' } });
  if (starterPlan) {
    for (const c of companies) {
      const sub = await prisma.tenantSubscription.findUnique({ where: { companyId: c.id } });
      if (!sub) {
        await prisma.tenantSubscription.create({
          data: {
            companyId: c.id,
            planId: starterPlan.id,
            status: 'active',
            autoRenew: true,
          }
        });
      }
    }
  }

  // 5. Admin User
  const adminEmail = 'admin@applizor.com';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        companyId: companies[0].id, // Linked to main company
        isActive: true,
        roles: {
          create: [
            { roleId: adminRole.id },
            { roleId: superAdminRole.id }
          ]
        }
      }
    });
    console.log(`✓ Created user ${adminEmail} (password123)`);
  }

  // 6. Bootstrap accounts and statutory configurations for each company
  const coaTemplate = await prisma.coaTemplate.findFirst({
    where: { countryId: india?.id },
    include: { entries: true }
  });

  for (const company of companies) {
    console.log(`\nInitializing Chart of Accounts for ${company.name}...`);

    // Bootstrap COA accounts
    if (coaTemplate) {
      for (const entry of coaTemplate.entries) {
        const existingAcc = await prisma.ledgerAccount.findFirst({
          where: { companyId: company.id, code: entry.code }
        });
        if (!existingAcc) {
          await prisma.ledgerAccount.create({
            data: {
              companyId: company.id,
              code: entry.code,
              name: entry.name,
              type: entry.type,
              balance: 0,
            }
          });
        }
      }
      console.log(`✓ Bootstrapped Ledger Accounts for ${company.name}`);
    }

    // Fetch accounts to construct the Statutory Config
    const accounts = await prisma.ledgerAccount.findMany({ where: { companyId: company.id } });
    const cashAcc = accounts.find(a => a.code === '1001');
    const pfAcc = accounts.find(a => a.code === '2400');
    const ptAcc = accounts.find(a => a.code === '2420');
    const tdsAcc = accounts.find(a => a.code === '2300');
    const netSalaryAcc = accounts.find(a => a.code === '2430') || cashAcc;

    // Create or update Statutory Config
    await prisma.statutoryConfig.upsert({
      where: { companyId: company.id },
      update: {
        salaryPayableAccountId: netSalaryAcc?.id,
        pfPayableAccountId: pfAcc?.id,
        ptPayableAccountId: ptAcc?.id,
        tdsPayableAccountId: tdsAcc?.id,
      },
      create: {
        companyId: company.id,
        pfEmployeeRate: 12,
        pfEmployerRate: 12,
        pfBasicLimit: 15000,
        esiEmployeeRate: 0.75,
        esiEmployerRate: 3.25,
        esiGrossLimit: 21000,
        professionalTaxEnabled: true,
        ptSlabs: {
          'Maharashtra': [
            { min: 0, max: 10000, amount: 0 },
            { min: 10001, max: 25000, amount: 200 },
            { min: 25001, max: Infinity, amount: 300 }
          ]
        },
        tdsEnabled: true,
        salaryPayableAccountId: netSalaryAcc?.id,
        pfPayableAccountId: pfAcc?.id,
        ptPayableAccountId: ptAcc?.id,
        tdsPayableAccountId: tdsAcc?.id,
      }
    });
    console.log(`✓ Configured Statutory Config for ${company.name}`);

    // Seed default Salary Components
    const defaultComponents = [
      { name: 'Basic Salary', type: 'earning', calculationType: 'percentage', defaultValue: 50 },
      { name: 'House Rent Allowance', type: 'earning', calculationType: 'percentage', defaultValue: 20 },
      { name: 'Special Allowance', type: 'earning', calculationType: 'percentage', defaultValue: 30 },
      { name: 'Provident Fund Deduction', type: 'deduction', calculationType: 'percentage', defaultValue: 12 },
      { name: 'Employee State Insurance', type: 'deduction', calculationType: 'percentage', defaultValue: 0.75 },
      { name: 'Professional Tax', type: 'deduction', calculationType: 'flat', defaultValue: 200 },
    ];

    for (const comp of defaultComponents) {
      const existingComp = await prisma.salaryComponent.findFirst({
        where: { companyId: company.id, name: comp.name }
      });
      if (!existingComp) {
        await prisma.salaryComponent.create({
          data: {
            companyId: company.id,
            name: comp.name,
            type: comp.type,
            calculationType: comp.calculationType,
            defaultValue: comp.defaultValue,
            isActive: true,
            isTaxable: comp.type === 'earning',
          }
        });
      }
    }
    console.log(`✓ Seeded default Salary Components for ${company.name}`);
  }

  console.log('\n🚀 Master database seed complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
