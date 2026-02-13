import api from '../api';

export interface LedgerAccount {
    id: string;
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
    balance: number;
    isActive: boolean;
}

export interface JournalEntry {
    id: string;
    date: string;
    description: string;
    reference: string;
    status: string;
    lines: JournalLine[];
}

export interface JournalLine {
    id: string;
    accountId: string;
    debit: number;
    credit: number;
    account?: LedgerAccount;
}

export const accountingApi = {
    getAccounts: async () => {
        const response = await api.get<LedgerAccount[]>('/accounting/accounts');
        return response.data;
    },

    createAccount: async (data: { code: string; name: string; type: string }) => {
        const response = await api.post<LedgerAccount>('/accounting/accounts', data);
        return response.data;
    },

    createJournalEntry: async (data: any) => {
        const response = await api.post('/accounting/entries', data);
        return response.data;
    },

    getTrialBalance: async () => {
        const response = await api.get<LedgerAccount[]>('/accounting/accounts'); // Uses same endpoint as getAccounts for now
        return response.data;
    },

    getGeneralLedger: async (accountId: string, startDate: string, endDate: string) => {
        const response = await api.get(`/accounting/reports/general-ledger/${accountId}`, {
            params: { startDate, endDate }
        });
        return response.data;
    },

    getBalanceSheet: async () => {
        const response = await api.get<LedgerAccount[]>('/accounting/reports/balance-sheet');
        return response.data;
    },

    getProfitAndLoss: async (startDate: string, endDate: string) => {
        const response = await api.get<any>('/accounting/reports/profit-loss', {
            params: { startDate, endDate }
        });
        return response.data;
    },
    getGstSummary: (startDate: string, endDate: string) =>
        api.get(`/accounting/reports/gst-summary?startDate=${startDate}&endDate=${endDate}`).then(res => res.data),
    getJournalEntries: () => api.get('/accounting/journal').then(res => res.data),
    reconcileLedger: () => api.post('/accounting/reconcile').then(res => res.data),
    deleteJournalEntry: (id: string) => api.delete(`/accounting/journal/${id}`).then(res => res.data),
};
