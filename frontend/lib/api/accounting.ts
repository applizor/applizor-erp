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
    reconciledAt?: string | null;
    account?: LedgerAccount;
}

const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

/** Client-side CSV helper (Excel-friendly UTF-8 BOM). */
export const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escape = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
};

export const accountingApi = {
    getAccounts: async () => {
        const response = await api.get<LedgerAccount[]>('/accounting/accounts');
        return response.data;
    },

    createAccount: async (data: { code: string; name: string; type: string }) => {
        const response = await api.post<LedgerAccount>('/accounting/accounts', data);
        return response.data;
    },

    updateAccount: async (
        id: string,
        data: { code?: string; name?: string; type?: string; isActive?: boolean }
    ) => {
        const response = await api.put<LedgerAccount>(`/accounting/accounts/${id}`, data);
        return response.data;
    },

    deleteAccount: async (id: string) => {
        const response = await api.delete(`/accounting/accounts/${id}`);
        return response.data;
    },

    createJournalEntry: async (data: any) => {
        const response = await api.post('/accounting/entries', data);
        return response.data;
    },

    updateJournalEntry: async (id: string, data: any) => {
        const response = await api.put(`/accounting/journal/${id}`, data);
        return response.data;
    },

    getTrialBalance: async () => {
        const response = await api.get<LedgerAccount[]>('/accounting/accounts');
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

    getAgingReport: (type: 'ar' | 'ap' = 'ar') =>
        api.get('/accounting/reports/aging', { params: { type } }).then(res => res.data),

    getJournalEntries: () => api.get('/accounting/journal').then(res => res.data),

    reconcileLedger: () => api.post('/accounting/reconcile').then(res => res.data),

    deleteJournalEntry: (id: string) => api.delete(`/accounting/journal/${id}`).then(res => res.data),

    exportReport: async (
        type: string,
        startDate?: string,
        endDate?: string,
        opts?: { format?: 'pdf' | 'csv' | 'excel'; agingType?: 'ar' | 'ap' }
    ) => {
        const format = opts?.format || 'pdf';
        const response = await api.get('/accounting/reports/export', {
            params: {
                type,
                startDate,
                endDate,
                format,
                agingType: opts?.agingType
            },
            responseType: 'blob'
        });
        return response.data as Blob;
    },

    downloadExport: async (
        type: string,
        filename: string,
        startDate?: string,
        endDate?: string,
        opts?: { format?: 'pdf' | 'csv' | 'excel'; agingType?: 'ar' | 'ap' }
    ) => {
        const blob = await accountingApi.exportReport(type, startDate, endDate, opts);
        downloadBlob(blob, filename);
    },
};
