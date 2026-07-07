import { createJournalEntry } from '@/services/accounting.service';
import prisma from '@/prisma/client';

interface JournalLineInput {
    accountId: string;
    debit?: number;
    credit?: number;
}

const mockTx = {
    journalEntry: { create: jest.fn() },
    ledgerAccount: { update: jest.fn() },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
};

jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: {
        company: {
            findUnique: jest.fn().mockResolvedValue({ accountingLockDate: null }),
        },
        journalEntry: { create: jest.fn() },
        ledgerAccount: { update: jest.fn() },
        auditLog: { create: jest.fn().mockResolvedValue({}) },
        $transaction: jest.fn((cb: any) => cb(mockTx)),
    },
}));

describe('AccountingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createJournalEntry', () => {
        const companyId = 'company-1';
        const date = new Date();
        const description = 'Test Entry';
        const reference = 'REF-001';

        it('should throw error if debits do not equal credits', async () => {
            const lines: JournalLineInput[] = [
                { accountId: 'acc-1', debit: 100, credit: 0 },
                { accountId: 'acc-2', debit: 0, credit: 50 },
            ];

            await expect(createJournalEntry(companyId, date, description, reference, lines))
                .rejects
                .toThrow('Unbalanced Journal Entry');
        });

        it('should create journal entry successfully when balanced', async () => {
            const lines: JournalLineInput[] = [
                { accountId: 'acc-asset', debit: 100, credit: 0 },
                { accountId: 'acc-liability', debit: 0, credit: 100 },
            ];

            const mockEntry = {
                id: 'entry-1',
                lines: [
                    { accountId: 'acc-asset', debit: 100, credit: 0, account: { id: 'acc-asset', type: 'asset' } },
                    { accountId: 'acc-liability', debit: 0, credit: 100, account: { id: 'acc-liability', type: 'liability' } }
                ]
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTx));
            mockTx.journalEntry.create.mockResolvedValue(mockEntry);

            await createJournalEntry(companyId, date, description, reference, lines, true);

            expect(prisma.$transaction).toHaveBeenCalled();
            expect(mockTx.journalEntry.create).toHaveBeenCalled();
            expect(mockTx.ledgerAccount.update).toHaveBeenCalledTimes(2);

            expect(mockTx.ledgerAccount.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'acc-asset' },
                data: { balance: { increment: 100 } }
            }));

            expect(mockTx.ledgerAccount.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'acc-liability' },
                data: { balance: { increment: 100 } }
            }));

            expect(mockTx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    companyId,
                    module: 'ACCOUNTING',
                })
            }));
        });
    });
});
