import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INDIAN_COA = {
  name: 'Indian GAAP (Schedule III)',
  version: '1.0',
  entries: [
    { code: '1000', name: 'Cash in Hand', type: 'asset' },
    { code: '1001', name: 'Bank Account', type: 'asset' },
    { code: '1100', name: 'Inventory', type: 'asset' },
    { code: '1200', name: 'Sundry Debtors', type: 'asset' },
    { code: '1300', name: 'Fixed Assets', type: 'asset' },
    { code: '1400', name: 'Prepaid Expenses', type: 'asset' },
    { code: '2000', name: 'Sundry Creditors', type: 'liability' },
    { code: '2100', name: 'Capital Account', type: 'equity' },
    { code: '2200', name: 'Output CGST', type: 'liability' },
    { code: '2201', name: 'Output SGST', type: 'liability' },
    { code: '2202', name: 'Output IGST', type: 'liability' },
    { code: '2203', name: 'Input CGST', type: 'asset' },
    { code: '2204', name: 'Input SGST', type: 'asset' },
    { code: '2205', name: 'Input IGST', type: 'asset' },
    { code: '2300', name: 'TDS Payable', type: 'liability' },
    { code: '2400', name: 'PF Payable', type: 'liability' },
    { code: '2410', name: 'ESI Payable', type: 'liability' },
    { code: '2420', name: 'Professional Tax Payable', type: 'liability' },
    { code: '2500', name: 'Provision for Tax', type: 'liability' },
    { code: '4000', name: 'Sales Revenue', type: 'income' },
    { code: '4100', name: 'Other Income', type: 'income' },
    { code: '5000', name: 'Salary Expenses', type: 'expense' },
    { code: '5100', name: 'Rent Expenses', type: 'expense' },
    { code: '5200', name: 'Office Expenses', type: 'expense' },
    { code: '5300', name: 'Depreciation', type: 'expense' },
    { code: '5400', name: 'PF Employer Contribution', type: 'expense' },
    { code: '5500', name: 'ESI Employer Contribution', type: 'expense' },
    { code: '5600', name: 'Professional Tax Employer', type: 'expense' },
    { code: '5700', name: 'TDS Expense', type: 'expense' },
    { code: '5800', name: 'Miscellaneous Expenses', type: 'expense' },
  ],
};

const US_COA = {
  name: 'US GAAP',
  version: '1.0',
  entries: [
    { code: '1000', name: 'Cash and Cash Equivalents', type: 'asset' },
    { code: '1010', name: 'Accounts Receivable', type: 'asset' },
    { code: '1100', name: 'Inventory', type: 'asset' },
    { code: '1200', name: 'Prepaid Expenses', type: 'asset' },
    { code: '1300', name: 'Property, Plant & Equipment', type: 'asset' },
    { code: '2000', name: 'Accounts Payable', type: 'liability' },
    { code: '2100', name: 'Accrued Liabilities', type: 'liability' },
    { code: '2200', name: 'Sales Tax Payable', type: 'liability' },
    { code: '2300', name: 'Federal Income Tax Payable', type: 'liability' },
    { code: '2310', name: 'FICA Payable', type: 'liability' },
    { code: '2320', name: 'State Income Tax Payable', type: 'liability' },
    { code: '3000', name: 'Common Stock', type: 'equity' },
    { code: '3100', name: 'Retained Earnings', type: 'equity' },
    { code: '4000', name: 'Revenue', type: 'income' },
    { code: '4100', name: 'Service Revenue', type: 'income' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
    { code: '5100', name: 'Salary Expense', type: 'expense' },
    { code: '5200', name: 'Rent Expense', type: 'expense' },
    { code: '5300', name: 'Utilities Expense', type: 'expense' },
    { code: '5400', name: 'Payroll Tax Expense', type: 'expense' },
    { code: '5500', name: 'Depreciation Expense', type: 'expense' },
    { code: '5600', name: 'Other Operating Expenses', type: 'expense' },
  ],
};

const UK_COA = {
  name: 'UK GAAP (FRS 102)',
  version: '1.0',
  entries: [
    { code: '1000', name: 'Cash at Bank', type: 'asset' },
    { code: '1010', name: 'Trade Debtors', type: 'asset' },
    { code: '1100', name: 'Stock', type: 'asset' },
    { code: '1200', name: 'Prepayments', type: 'asset' },
    { code: '1300', name: 'Tangible Fixed Assets', type: 'asset' },
    { code: '2000', name: 'Trade Creditors', type: 'liability' },
    { code: '2100', name: 'VAT Payable', type: 'liability' },
    { code: '2200', name: 'PAYE Payable', type: 'liability' },
    { code: '2210', name: 'NIC Payable', type: 'liability' },
    { code: '2300', name: 'Corporation Tax Payable', type: 'liability' },
    { code: '3000', name: 'Share Capital', type: 'equity' },
    { code: '3100', name: 'Profit and Loss Account', type: 'equity' },
    { code: '4000', name: 'Sales', type: 'income' },
    { code: '4100', name: 'Other Income', type: 'income' },
    { code: '5000', name: 'Purchases', type: 'expense' },
    { code: '5100', name: 'Wages and Salaries', type: 'expense' },
    { code: '5200', name: 'Rent and Rates', type: 'expense' },
    { code: '5300', name: 'Utility Costs', type: 'expense' },
    { code: '5400', name: 'Employer NIC', type: 'expense' },
    { code: '5500', name: 'Depreciation', type: 'expense' },
    { code: '5600', name: 'General Expenses', type: 'expense' },
  ],
};

const UAE_COA = {
  name: 'UAE IFRS',
  version: '1.0',
  entries: [
    { code: '1000', name: 'Cash and Bank', type: 'asset' },
    { code: '1010', name: 'Accounts Receivable', type: 'asset' },
    { code: '1100', name: 'Inventory', type: 'asset' },
    { code: '1200', name: 'Prepaid Expenses', type: 'asset' },
    { code: '1300', name: 'Fixed Assets', type: 'asset' },
    { code: '2000', name: 'Accounts Payable', type: 'liability' },
    { code: '2100', name: 'VAT Payable', type: 'liability' },
    { code: '2200', name: 'Social Security Payable', type: 'liability' },
    { code: '2300', name: 'Accrued Expenses', type: 'liability' },
    { code: '3000', name: 'Share Capital', type: 'equity' },
    { code: '3100', name: 'Retained Earnings', type: 'equity' },
    { code: '4000', name: 'Revenue', type: 'income' },
    { code: '5000', name: 'Cost of Sales', type: 'expense' },
    { code: '5100', name: 'Employee Costs', type: 'expense' },
    { code: '5200', name: 'Rent', type: 'expense' },
    { code: '5300', name: 'Utilities', type: 'expense' },
    { code: '5400', name: 'Depreciation', type: 'expense' },
    { code: '5500', name: 'General & Administrative', type: 'expense' },
  ],
};

const SG_COA = {
  name: 'Singapore SFRS',
  version: '1.0',
  entries: [
    { code: '1000', name: 'Cash and Bank', type: 'asset' },
    { code: '1010', name: 'Trade Receivables', type: 'asset' },
    { code: '1100', name: 'Inventory', type: 'asset' },
    { code: '1200', name: 'Prepaid Expenses', type: 'asset' },
    { code: '1300', name: 'Fixed Assets', type: 'asset' },
    { code: '2000', name: 'Trade Payables', type: 'liability' },
    { code: '2100', name: 'GST Payable', type: 'liability' },
    { code: '2200', name: 'CPF Payable', type: 'liability' },
    { code: '2300', name: 'Provision for Tax', type: 'liability' },
    { code: '3000', name: 'Share Capital', type: 'equity' },
    { code: '3100', name: 'Retained Earnings', type: 'equity' },
    { code: '4000', name: 'Revenue', type: 'income' },
    { code: '4100', name: 'Other Income', type: 'income' },
    { code: '5000', name: 'Cost of Sales', type: 'expense' },
    { code: '5100', name: 'Employee Benefits', type: 'expense' },
    { code: '5200', name: 'Rent', type: 'expense' },
    { code: '5300', name: 'Utilities', type: 'expense' },
    { code: '5400', name: 'Depreciation', type: 'expense' },
    { code: '5500', name: 'Other Operating Expenses', type: 'expense' },
  ],
};

async function seed() {
  console.log('\n📋 Seeding Chart of Accounts Templates...\n');

  const templates = [
    { code: 'IN', template: INDIAN_COA },
    { code: 'US', template: US_COA },
    { code: 'GB', template: UK_COA },
    { code: 'AE', template: UAE_COA },
    { code: 'SG', template: SG_COA },
  ];

  for (const { code, template } of templates) {
    const country = await prisma.country.findUnique({ where: { code } });
    if (!country) {
      console.log(`⚠ Country ${code} not found, skipping`);
      continue;
    }

    const existing = await prisma.coaTemplate.findUnique({
      where: { countryId_version: { countryId: country.id, version: template.version } },
    });

    if (existing) {
      console.log(`→ COA template for ${code} already exists, skipping`);
      continue;
    }

    await prisma.coaTemplate.create({
      data: {
        countryId: country.id,
        name: template.name,
        version: template.version,
        entries: { create: template.entries },
      },
    });

    console.log(`✓ Seeded COA template for ${code} (${template.entries.length} accounts)`);
  }

  console.log('\n✅ COA template seeding complete!\n');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
