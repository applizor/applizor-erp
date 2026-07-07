import { PayrollService } from '@/services/payroll.service';
import prisma from '@/prisma/client';

// Mock Prisma
jest.mock('@/prisma/client', () => ({
    company: {
        findUnique: jest.fn(),
    },
    country: {
        findFirst: jest.fn(),
    },
    statutoryRule: {
        findMany: jest.fn(),
    },
    statutoryConfig: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
    },
    salaryTemplate: {
        findUnique: jest.fn(),
    }
}));

describe('PayrollService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: company has countryId set to dynamic rule context
        (prisma.company.findUnique as jest.Mock).mockResolvedValue({ countryId: 'mock-india-country-id' });
        (prisma.country.findFirst as jest.Mock).mockResolvedValue({ id: 'mock-india-country-id', code: 'IN' });
        (prisma.statutoryRule.findMany as jest.Mock).mockResolvedValue([
            {
                id: 'rule-pf',
                countryId: 'mock-india-country-id',
                companyId: null,
                code: 'pf',
                name: 'Provident Fund',
                category: 'retirement',
                ruleType: 'percentage',
                employeeRate: 12,
                employerRate: 12,
                wageCeiling: 15000,
                effectiveFrom: new Date('2024-04-01'),
                effectiveTo: null,
                isActive: true
            },
            {
                id: 'rule-esi',
                countryId: 'mock-india-country-id',
                companyId: null,
                code: 'esi',
                name: 'Employee State Insurance',
                category: 'health',
                ruleType: 'percentage',
                employeeRate: 0.75,
                employerRate: 3.25,
                wageCeiling: 21000,
                effectiveFrom: new Date('2024-04-01'),
                effectiveTo: null,
                isActive: true
            },
            {
                id: 'rule-pt',
                countryId: 'mock-india-country-id',
                companyId: null,
                code: 'pt',
                name: 'Professional Tax',
                category: 'tax',
                ruleType: 'slab',
                slabData: [
                    { min: 0, max: 15000, amount: 0 },
                    { min: 15001, max: 9999999, amount: 200 }
                ],
                effectiveFrom: new Date('2024-04-01'),
                effectiveTo: null,
                isActive: true
            }
        ]);
    });

    describe('calculateStatutoryDeductions', () => {
        it('should calculate PF correctly when basic is below limit', async () => {
            const basic = 10000;
            const gross = 50000;

            const result = await PayrollService.calculateStatutoryDeductions('company-1', basic, gross);

            // PF Employee: 10000 * 12% = 1200
            expect(result.pf.employee).toBe(1200);
            // PF Employer: 10000 * 12% = 1200
            expect(result.pf.employer).toBe(1200);
        });

        it('should calculate PF correctly when basic is above limit', async () => {
            const basic = 20000; // Above 15000 limit
            const gross = 50000;

            const result = await PayrollService.calculateStatutoryDeductions('company-1', basic, gross);

            // PF Employee: 15000 * 12% = 1800
            expect(result.pf.employee).toBe(1800);
            // PF Employer: 15000 * 12% = 1800
            expect(result.pf.employer).toBe(1800);
        });

        it('should calculate ESI correctly when gross is below limit', async () => {
            const basic = 10000;
            const gross = 20000; // Below 21000 limit

            const result = await PayrollService.calculateStatutoryDeductions('company-1', basic, gross);

            // ESI Employee: 20000 * 0.75% = 150
            expect(result.esi.employee).toBe(150);
            // ESI Employer: 20000 * 3.25% = 650
            expect(result.esi.employer).toBe(650);
        });

        it('should not calculate ESI when gross is above limit', async () => {
            const basic = 15000;
            const gross = 25000; // Above 21000 limit

            const result = await PayrollService.calculateStatutoryDeductions('company-1', basic, gross);

            expect(result.esi.employee).toBe(0);
            expect(result.esi.employer).toBe(0);
        });

        it('should calculate Professional Tax correctly based on slabs', async () => {
            const basic = 10000;
            const gross = 30000; // Fits in 200 slab

            const result = await PayrollService.calculateStatutoryDeductions('company-1', basic, gross);

            expect(result.pt).toBe(200);
        });
    });
});
