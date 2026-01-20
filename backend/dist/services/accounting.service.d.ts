import { Prisma } from '@prisma/client';
export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
export declare const DEFAULT_ACCOUNTS: {
    code: string;
    name: string;
    type: string;
}[];
export declare const seedAccounts: (companyId: string) => Promise<void>;
interface JournalLineInput {
    accountId: string;
    debit?: number;
    credit?: number;
}
export declare const createJournalEntry: (companyId: string, date: Date, description: string, reference: string, lines: JournalLineInput[], autoPost?: boolean) => Promise<{
    lines: ({
        account: {
            name: string;
            id: string;
            createdAt: Date;
            companyId: string;
            isActive: boolean;
            updatedAt: Date;
            type: string;
            code: string;
            balance: Prisma.Decimal;
        };
    } & {
        id: string;
        description: string | null;
        debit: Prisma.Decimal;
        credit: Prisma.Decimal;
        accountId: string;
        journalEntryId: string;
    })[];
} & {
    date: Date;
    id: string;
    createdAt: Date;
    companyId: string;
    updatedAt: Date;
    description: string | null;
    status: string;
    reference: string | null;
}>;
export declare const getTrialBalance: (companyId: string) => Promise<{
    name: string;
    id: string;
    createdAt: Date;
    companyId: string;
    isActive: boolean;
    updatedAt: Date;
    type: string;
    code: string;
    balance: Prisma.Decimal;
}[]>;
export declare const getAccountByCode: (companyId: string, code: string) => Promise<{
    name: string;
    id: string;
    createdAt: Date;
    companyId: string;
    isActive: boolean;
    updatedAt: Date;
    type: string;
    code: string;
    balance: Prisma.Decimal;
} | null>;
export declare const ensureAccount: (companyId: string, code: string, name: string, type: string) => Promise<{
    name: string;
    id: string;
    createdAt: Date;
    companyId: string;
    isActive: boolean;
    updatedAt: Date;
    type: string;
    code: string;
    balance: Prisma.Decimal;
}>;
declare const accountingService: {
    seedAccounts: (companyId: string) => Promise<void>;
    createJournalEntry: (companyId: string, date: Date, description: string, reference: string, lines: JournalLineInput[], autoPost?: boolean) => Promise<{
        lines: ({
            account: {
                name: string;
                id: string;
                createdAt: Date;
                companyId: string;
                isActive: boolean;
                updatedAt: Date;
                type: string;
                code: string;
                balance: Prisma.Decimal;
            };
        } & {
            id: string;
            description: string | null;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            accountId: string;
            journalEntryId: string;
        })[];
    } & {
        date: Date;
        id: string;
        createdAt: Date;
        companyId: string;
        updatedAt: Date;
        description: string | null;
        status: string;
        reference: string | null;
    }>;
    getTrialBalance: (companyId: string) => Promise<{
        name: string;
        id: string;
        createdAt: Date;
        companyId: string;
        isActive: boolean;
        updatedAt: Date;
        type: string;
        code: string;
        balance: Prisma.Decimal;
    }[]>;
    getAccountByCode: (companyId: string, code: string) => Promise<{
        name: string;
        id: string;
        createdAt: Date;
        companyId: string;
        isActive: boolean;
        updatedAt: Date;
        type: string;
        code: string;
        balance: Prisma.Decimal;
    } | null>;
    ensureAccount: (companyId: string, code: string, name: string, type: string) => Promise<{
        name: string;
        id: string;
        createdAt: Date;
        companyId: string;
        isActive: boolean;
        updatedAt: Date;
        type: string;
        code: string;
        balance: Prisma.Decimal;
    }>;
    DEFAULT_ACCOUNTS: {
        code: string;
        name: string;
        type: string;
    }[];
};
export default accountingService;
//# sourceMappingURL=accounting.service.d.ts.map