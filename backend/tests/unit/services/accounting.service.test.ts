import { createJournalEntry } from '@/services/accounting.service';
import prisma from '@/prisma/client';

interface JournalLineInput {
    accountId: string;
    debit?: number;
    credit?: number;
}

describe('AccountingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
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

            // Spy on the transaction method
            const txSpy = jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
                return callback(prisma);
            });

            // Spy on the delegates
            const createSpy = jest.spyOn(prisma.journalEntry, 'create').mockResolvedValue(mockEntry as any);
            const updateSpy = jest.spyOn(prisma.ledgerAccount, 'update').mockResolvedValue({} as any);

            await createJournalEntry(companyId, date, description, reference, lines, true);

            expect(txSpy).toHaveBeenCalled();
            expect(createSpy).toHaveBeenCalled();
            expect(updateSpy).toHaveBeenCalledTimes(2);

            // Asset: Debit - Credit = 100 - 0 = +100
            expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'acc-asset' },
                data: { balance: { increment: 100 } }
            }));

            // Liability: Credit - Debit = 100 - 0 = +100
            expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'acc-liability' },
                data: { balance: { increment: 100 } }
            }));
        });
    });
});
