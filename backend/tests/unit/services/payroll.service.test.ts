import { PayrollService } from '@/services/payroll.service';
import prisma from '@/prisma/client';

// Mock Prisma
jest.mock('@/prisma/client', () => ({
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
    });

    describe('calculateStatutoryDeductions', () => {
        const mockConfig = {
            pfEmployeeRate: 12,
            pfEmployerRate: 12,
            pfBasicLimit: 15000,
            esiEmployeeRate: 0.75,
            esiEmployerRate: 3.25,
            esiGrossLimit: 21000,
            professionalTaxEnabled: true,
            ptSlabs: [
                { min: 0, max: 15000, amount: 0 },
                { min: 15001, max: 9999999, amount: 200 }
            ]
        };

        it('should calculate PF correctly when basic is below limit', async () => {
            (prisma.statutoryConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

            const basic = 10000;
            const gross = 50000;

            const result = await PayrollService.calculateStatutoryDeductions('company-1', basic, gross);

            // PF Employee: 10000 * 12% = 1200
            expect(result.pf.employee).toBe(1200);
            // PF Employer: 10000 * 12% = 1200
            expect(result.pf.employer).toBe(1200);
        });

        it('should calculate PF correctly when basic is above limit', async () => {
            (prisma.statutoryConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

            const basic = 20000; // Above 15000 limit
            const gross = 50000;

            const result = await PayrollService.calculateStatutoryDeductions('company-1', basic, gross);

            // PF Employee: 15000 * 12% = 1800
            expect(result.pf.employee).toBe(1800);
            // PF Employer: 15000 * 12% = 1800
            expect(result.pf.employer).toBe(1800);
        });

        it('should calculate ESI correctly when gross is below limit', async () => {
            (prisma.statutoryConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

            const basic = 10000;
            const gross = 20000; // Below 21000 limit

            const result = await PayrollService.calculateStatutoryDeductions('company-1', basic, gross);

            // ESI Employee: 20000 * 0.75% = 150
            expect(result.esi.employee).toBe(150);
            // ESI Employer: 20000 * 3.25% = 650
            expect(result.esi.employer).toBe(650);
        });

        it('should not calculate ESI when gross is above limit', async () => {
            (prisma.statutoryConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

            const basic = 15000;
            const gross = 25000; // Above 21000 limit

            const result = await PayrollService.calculateStatutoryDeductions('company-1', basic, gross);

            expect(result.esi.employee).toBe(0);
            expect(result.esi.employer).toBe(0);
        });

        it('should calculate Professional Tax correctly based on slabs', async () => {
            (prisma.statutoryConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);

            const basic = 10000;
            const gross = 30000; // Fits in 200 slab

            const result = await PayrollService.calculateStatutoryDeductions('company-1', basic, gross);

            expect(result.pt).toBe(200);
        });
    });
});
