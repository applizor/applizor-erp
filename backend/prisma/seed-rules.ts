import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedIndiaRules() {
  const india = await prisma.country.findUnique({ where: { code: 'IN' } });
  if (!india) { console.log('⚠ India not found, skipping'); return; }

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
        data: { ...rule, countryId: india.id }
      });
    }
  }
  console.log(`✓ Seeded ${rules.length} Indian statutory rules`);
}

async function seedUSRules() {
  const us = await prisma.country.findUnique({ where: { code: 'US' } });
  if (!us) { console.log('⚠ US not found, skipping'); return; }

  const rules = [
    {
      code: 'social_security',
      name: 'Social Security',
      category: 'retirement',
      ruleType: 'percentage',
      employeeRate: 6.2,
      employerRate: 6.2,
      wageCeiling: 168600,
      effectiveFrom: new Date('2025-01-01'),
    },
    {
      code: 'medicare',
      name: 'Medicare',
      category: 'health',
      ruleType: 'percentage',
      employeeRate: 1.45,
      employerRate: 1.45,
      effectiveFrom: new Date('2025-01-01'),
    },
    {
      code: 'federal_tax',
      name: 'Federal Income Tax',
      category: 'tax',
      ruleType: 'slab',
      slabData: [
        { min: 0, max: 11600, rate: 10 },
        { min: 11601, max: 47150, rate: 12 },
        { min: 47151, max: 100525, rate: 22 },
        { min: 100526, max: 191950, rate: 24 },
        { min: 191951, max: 243725, rate: 32 },
        { min: 243726, max: 609350, rate: 35 },
        { min: 609351, max: Infinity, rate: 37 },
      ],
      effectiveFrom: new Date('2025-01-01'),
    },
  ];

  for (const rule of rules) {
    const existing = await prisma.statutoryRule.findFirst({
      where: { countryId: us.id, code: rule.code, effectiveFrom: rule.effectiveFrom }
    });
    if (!existing) {
      await prisma.statutoryRule.create({
        data: { ...rule, countryId: us.id }
      });
    }
  }
  console.log(`✓ Seeded ${rules.length} US statutory rules`);
}

async function seedUKRules() {
  const uk = await prisma.country.findUnique({ where: { code: 'GB' } });
  if (!uk) { console.log('⚠ UK not found, skipping'); return; }

  const rules = [
    {
      code: 'nic',
      name: 'National Insurance Contributions',
      category: 'social',
      ruleType: 'percentage',
      employeeRate: 8,
      employerRate: 13.8,
      wageCeiling: 50000,
      effectiveFrom: new Date('2025-04-06'),
    },
    {
      code: 'paye',
      name: 'Pay As You Earn',
      category: 'tax',
      ruleType: 'slab',
      slabData: [
        { min: 0, max: 12570, rate: 0 },
        { min: 12571, max: 50270, rate: 20 },
        { min: 50271, max: 125140, rate: 40 },
        { min: 125141, max: Infinity, rate: 45 },
      ],
      effectiveFrom: new Date('2025-04-06'),
    },
  ];

  for (const rule of rules) {
    const existing = await prisma.statutoryRule.findFirst({
      where: { countryId: uk.id, code: rule.code, effectiveFrom: rule.effectiveFrom }
    });
    if (!existing) {
      await prisma.statutoryRule.create({
        data: { ...rule, countryId: uk.id }
      });
    }
  }
  console.log(`✓ Seeded ${rules.length} UK statutory rules`);
}

async function seedUAERules() {
  const uae = await prisma.country.findUnique({ where: { code: 'AE' } });
  if (!uae) { console.log('⚠ UAE not found, skipping'); return; }

  const rules = [
    {
      code: 'social_security',
      name: 'Social Security (UAE Nationals)',
      category: 'social',
      ruleType: 'percentage',
      employeeRate: 5,
      employerRate: 12.5,
      effectiveFrom: new Date('2025-01-01'),
    },
  ];

  for (const rule of rules) {
    const existing = await prisma.statutoryRule.findFirst({
      where: { countryId: uae.id, code: rule.code, effectiveFrom: rule.effectiveFrom }
    });
    if (!existing) {
      await prisma.statutoryRule.create({
        data: { ...rule, countryId: uae.id }
      });
    }
  }
  console.log(`✓ Seeded ${rules.length} UAE statutory rules`);
}

async function seedSGRules() {
  const sg = await prisma.country.findUnique({ where: { code: 'SG' } });
  if (!sg) { console.log('⚠ Singapore not found, skipping'); return; }

  const rules = [
    {
      code: 'cpf',
      name: 'Central Provident Fund',
      category: 'retirement',
      ruleType: 'percentage',
      employeeRate: 20,
      employerRate: 17,
      wageCeiling: 6000,
      effectiveFrom: new Date('2025-01-01'),
    },
  ];

  for (const rule of rules) {
    const existing = await prisma.statutoryRule.findFirst({
      where: { countryId: sg.id, code: rule.code, effectiveFrom: rule.effectiveFrom }
    });
    if (!existing) {
      await prisma.statutoryRule.create({
        data: { ...rule, countryId: sg.id }
      });
    }
  }
  console.log(`✓ Seeded ${rules.length} Singapore statutory rules`);
}

async function main() {
  console.log('\n📋 Seeding Statutory Rules...\n');
  await seedIndiaRules();
  await seedUSRules();
  await seedUKRules();
  await seedUAERules();
  await seedSGRules();
  console.log('\n✅ Statutory rules seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
