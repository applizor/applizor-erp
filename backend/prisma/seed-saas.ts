import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCurrencies() {
  const currencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
    { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
    { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
    { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2 },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2 },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2 },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimalPlaces: 2 },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', decimalPlaces: 2 },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2 },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', decimalPlaces: 2 },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', decimalPlaces: 2 },
    { code: 'NPR', name: 'Nepalese Rupee', symbol: 'रू', decimalPlaces: 2 },
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
  const aud = await prisma.currency.findUnique({ where: { code: 'AUD' } });
  const cad = await prisma.currency.findUnique({ where: { code: 'CAD' } });
  const sar = await prisma.currency.findUnique({ where: { code: 'SAR' } });
  const qar = await prisma.currency.findUnique({ where: { code: 'QAR' } });
  const myr = await prisma.currency.findUnique({ where: { code: 'MYR' } });

  const countries = [
    { name: 'India', code: 'IN', code3: 'IND', numeric: '356', phoneCode: '+91', currencyId: inr?.id },
    { name: 'United States', code: 'US', code3: 'USA', numeric: '840', phoneCode: '+1', currencyId: usd?.id },
    { name: 'United Kingdom', code: 'GB', code3: 'GBR', numeric: '826', phoneCode: '+44', currencyId: gbp?.id },
    { name: 'United Arab Emirates', code: 'AE', code3: 'ARE', numeric: '784', phoneCode: '+971', currencyId: aed?.id },
    { name: 'Singapore', code: 'SG', code3: 'SGP', numeric: '702', phoneCode: '+65', currencyId: sgd?.id },
    { name: 'Australia', code: 'AU', code3: 'AUS', numeric: '036', phoneCode: '+61', currencyId: aud?.id },
    { name: 'Canada', code: 'CA', code3: 'CAN', numeric: '124', phoneCode: '+1', currencyId: cad?.id },
    { name: 'Saudi Arabia', code: 'SA', code3: 'SAU', numeric: '682', phoneCode: '+966', currencyId: sar?.id },
    { name: 'Qatar', code: 'QA', code3: 'QAT', numeric: '634', phoneCode: '+974', currencyId: qar?.id },
    { name: 'Malaysia', code: 'MY', code3: 'MYS', numeric: '458', phoneCode: '+60', currencyId: myr?.id },
    { name: 'Germany', code: 'DE', code3: 'DEU', numeric: '276', phoneCode: '+49', currencyId: eur?.id },
    { name: 'France', code: 'FR', code3: 'FRA', numeric: '250', phoneCode: '+33', currencyId: eur?.id },
    { name: 'Netherlands', code: 'NL', code3: 'NLD', numeric: '528', phoneCode: '+31', currencyId: eur?.id },
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
  const us = await prisma.country.findUnique({ where: { code: 'US' } });
  const uk = await prisma.country.findUnique({ where: { code: 'GB' } });
  const uae = await prisma.country.findUnique({ where: { code: 'AE' } });

  if (india) {
    const indianStates = [
      { name: 'Andhra Pradesh', code: 'IN-AP' },
      { name: 'Arunachal Pradesh', code: 'IN-AR' },
      { name: 'Assam', code: 'IN-AS' },
      { name: 'Bihar', code: 'IN-BR' },
      { name: 'Chhattisgarh', code: 'IN-CT' },
      { name: 'Goa', code: 'IN-GA' },
      { name: 'Gujarat', code: 'IN-GJ' },
      { name: 'Haryana', code: 'IN-HR' },
      { name: 'Himachal Pradesh', code: 'IN-HP' },
      { name: 'Jharkhand', code: 'IN-JH' },
      { name: 'Karnataka', code: 'IN-KA' },
      { name: 'Kerala', code: 'IN-KL' },
      { name: 'Madhya Pradesh', code: 'IN-MP' },
      { name: 'Maharashtra', code: 'IN-MH' },
      { name: 'Manipur', code: 'IN-MN' },
      { name: 'Meghalaya', code: 'IN-ML' },
      { name: 'Mizoram', code: 'IN-MZ' },
      { name: 'Nagaland', code: 'IN-NL' },
      { name: 'Odisha', code: 'IN-OD' },
      { name: 'Punjab', code: 'IN-PB' },
      { name: 'Rajasthan', code: 'IN-RJ' },
      { name: 'Sikkim', code: 'IN-SK' },
      { name: 'Tamil Nadu', code: 'IN-TN' },
      { name: 'Telangana', code: 'IN-TS' },
      { name: 'Tripura', code: 'IN-TR' },
      { name: 'Uttar Pradesh', code: 'IN-UP' },
      { name: 'Uttarakhand', code: 'IN-UK' },
      { name: 'West Bengal', code: 'IN-WB' },
      { name: 'Andaman and Nicobar Islands', code: 'IN-AN' },
      { name: 'Chandigarh', code: 'IN-CH' },
      { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'IN-DH' },
      { name: 'Delhi', code: 'IN-DL' },
      { name: 'Jammu and Kashmir', code: 'IN-JK' },
      { name: 'Ladakh', code: 'IN-LA' },
      { name: 'Lakshadweep', code: 'IN-LD' },
      { name: 'Puducherry', code: 'IN-PY' },
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

  if (us) {
    const usStates = [
      { name: 'California', code: 'US-CA' },
      { name: 'New York', code: 'US-NY' },
      { name: 'Texas', code: 'US-TX' },
      { name: 'Florida', code: 'US-FL' },
      { name: 'Illinois', code: 'US-IL' },
      { name: 'Washington', code: 'US-WA' },
      { name: 'Massachusetts', code: 'US-MA' },
      { name: 'New Jersey', code: 'US-NJ' },
      { name: 'Virginia', code: 'US-VA' },
      { name: 'Georgia', code: 'US-GA' },
    ];
    for (const s of usStates) {
      await prisma.state.upsert({
        where: { countryId_code: { countryId: us.id, code: s.code } },
        update: {},
        create: { countryId: us.id, ...s },
      });
    }
    console.log(`✓ Seeded ${usStates.length} US states`);
  }

  if (uk) {
    const ukStates = [
      { name: 'England', code: 'GB-ENG' },
      { name: 'Scotland', code: 'GB-SCT' },
      { name: 'Wales', code: 'GB-WLS' },
      { name: 'Northern Ireland', code: 'GB-NIR' },
    ];
    for (const s of ukStates) {
      await prisma.state.upsert({
        where: { countryId_code: { countryId: uk.id, code: s.code } },
        update: {},
        create: { countryId: uk.id, ...s },
      });
    }
    console.log(`✓ Seeded ${ukStates.length} UK regions`);
  }

  if (uae) {
    const uaeEmirates = [
      { name: 'Abu Dhabi', code: 'AE-AZ' },
      { name: 'Dubai', code: 'AE-DU' },
      { name: 'Sharjah', code: 'AE-SH' },
      { name: 'Ajman', code: 'AE-AJ' },
      { name: 'Umm Al Quwain', code: 'AE-UQ' },
      { name: 'Ras Al Khaimah', code: 'AE-RK' },
      { name: 'Fujairah', code: 'AE-FU' },
    ];
    for (const s of uaeEmirates) {
      await prisma.state.upsert({
        where: { countryId_code: { countryId: uae.id, code: s.code } },
        update: {},
        create: { countryId: uae.id, ...s },
      });
    }
    console.log(`✓ Seeded ${uaeEmirates.length} UAE emirates`);
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
      enabledModules: { employees: true, attendance: true, leaves: true, payroll: true, clients: true, invoices: true },
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
      enabledModules: { employees: true, attendance: true, leaves: true, payroll: true, clients: true, invoices: true, projects: true, crm: true, accounting: true },
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
      enabledModules: { employees: true, attendance: true, leaves: true, payroll: true, clients: true, invoices: true, projects: true, crm: true, accounting: true, hrms: true, recruitment: true, lms: true },
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

async function main() {
  console.log('\n🌍 Seeding SaaS Platform Data...\n');
  await seedCurrencies();
  await seedCountries();
  await seedStates();
  await seedTenantPlans();

  // Link existing company to India
  const company = await prisma.company.findFirst({ where: { name: 'Applizor Softech LLP' } });
  if (company) {
    const india = await prisma.country.findUnique({ where: { code: 'IN' } });
    const maharashtra = india ? await prisma.state.findFirst({ where: { countryId: india.id, code: 'IN-MH' } }) : null;
    if (india && !company.countryId) {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          countryId: india.id,
          stateId: maharashtra?.id,
          timezone: 'Asia/Kolkata',
          locale: 'en-IN',
        },
      });
      console.log(`✓ Linked company to India → Maharashtra`);
    }

    // Assign free Starter plan
    const starterPlan = await prisma.tenantPlan.findUnique({ where: { code: 'starter_monthly' } });
    if (starterPlan) {
      const existingSub = await prisma.tenantSubscription.findUnique({ where: { companyId: company.id } });
      if (!existingSub) {
        await prisma.tenantSubscription.create({
          data: {
            companyId: company.id,
            planId: starterPlan.id,
            status: 'active',
            autoRenew: true,
          },
        });
        console.log(`✓ Assigned Starter plan to company`);
      }
    }
  }

  console.log('\n✅ SaaS Platform seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
