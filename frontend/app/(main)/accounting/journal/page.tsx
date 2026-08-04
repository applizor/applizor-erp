'use client';

import { useState, useEffect } from 'react';
import { accountingApi, LedgerAccount, JournalEntry, downloadCsv } from '@/lib/api/accounting';
import { FileText, Plus, Trash2, RefreshCw, Pencil, Download } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';

interface JournalLineForm {
    accountId: string;
    debit: number;
    credit: number;
}

const emptyLines = (): JournalLineForm[] => [
    { accountId: '', debit: 0, credit: 0 },
    { accountId: '', debit: 0, credit: 0 }
];

const SYSTEM_REF_PREFIXES = ['INV-', 'QTN-', 'PAY-', 'PAYROLL-', 'CN-', 'DN-', 'CRN-', 'DBN-'];

const isSystemLinked = (reference?: string | null) => {
    if (!reference) return false;
    const ref = reference.trim().toUpperCase();
    return SYSTEM_REF_PREFIXES.some(prefix => ref.startsWith(prefix));
};

export default function JournalEntryPage() {
    const toast = useToast();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        lines: emptyLines()
    });

    const fetchRecentEntries = async () => {
        try {
            const data = await accountingApi.getJournalEntries();
            setEntries(data);
        } catch (error) {
            toast.error('Failed to fetch recent entries');
        }
    };

    useEffect(() => {
        fetchAccounts();
        fetchRecentEntries();
    }, []);

    const fetchAccounts = async () => {
        try {
            const data = await accountingApi.getAccounts();
            setAccounts(data);
        } catch (error) {
            toast.error('Failed to fetch accounts');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            reference: '',
            lines: emptyLines()
        });
        setEditingId(null);
    };

    const openCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEdit = (entry: JournalEntry) => {
        if (isSystemLinked(entry.reference)) {
            toast.error(`Cannot edit system-linked entry (${entry.reference}). Update the source document instead.`);
            return;
        }
        const reconciled = (entry.lines || []).some(l => !!l.reconciledAt);
        if (reconciled) {
            toast.error('Cannot edit: one or more lines are reconciled. Unreconcile first.');
            return;
        }

        setEditingId(entry.id);
        const lines = (entry.lines || []).map(l => ({
            accountId: l.accountId,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0
        }));
        while (lines.length < 2) {
            lines.push({ accountId: '', debit: 0, credit: 0 });
        }
        setFormData({
            date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            description: entry.description || '',
            reference: entry.reference || '',
            lines
        });
        setIsModalOpen(true);
    };

    const handleAddLine = () => {
        setFormData({
            ...formData,
            lines: [...formData.lines, { accountId: '', debit: 0, credit: 0 }]
        });
    };

    const handleRemoveLine = (index: number) => {
        if (formData.lines.length <= 2) return;
        const newLines = formData.lines.filter((_, i) => i !== index);
        setFormData({ ...formData, lines: newLines });
    };

    const updateLine = (index: number, field: keyof JournalLineForm, value: any) => {
        const newLines = [...formData.lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setFormData({ ...formData, lines: newLines });
    };

    const calculateTotals = () => {
        const totalDebit = formData.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
        const totalCredit = formData.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
        return { totalDebit, totalCredit, difference: totalDebit - totalCredit };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { totalDebit, totalCredit, difference } = calculateTotals();

        if (Math.abs(difference) > 0.01) {
            toast.error(`Entry is unbalanced. Difference: ${difference.toFixed(2)}`);
            return;
        }

        if (totalDebit === 0) {
            toast.error('Entry must have a value > 0');
            return;
        }

        try {
            setIsSubmitting(true);
            if (editingId) {
                await accountingApi.updateJournalEntry(editingId, formData);
                toast.success('Journal Entry updated successfully');
            } else {
                await accountingApi.createJournalEntry(formData);
                toast.success('Journal Entry posted successfully');
            }
            setIsModalOpen(false);
            resetForm();
            fetchRecentEntries();
            try {
                await accountingApi.reconcileLedger();
            } catch {
                // non-blocking; Sync Ledgers remains available
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || `Failed to ${editingId ? 'update' : 'post'} entry`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (entry: JournalEntry) => {
        if (isSystemLinked(entry.reference)) {
            toast.error(`Cannot delete system-linked entry (${entry.reference}). Reverse/void the source document instead.`);
            return;
        }

        const reconciled = (entry.lines || []).some(l => !!l.reconciledAt);
        const confirmMsg = reconciled
            ? 'This entry has reconciled lines and cannot be deleted until unreconciled. Continue to check?'
            : `Delete journal entry ${entry.reference || entry.id}?\n\nAccount balances will be reverted and ledgers stay in sync.`;

        if (!confirm(confirmMsg)) return;

        try {
            await accountingApi.deleteJournalEntry(entry.id);
            toast.success('Journal entry deleted');
            fetchRecentEntries();
            try {
                await accountingApi.reconcileLedger();
            } catch {
                // non-blocking
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete entry');
        }
    };

    const handleSync = async () => {
        try {
            toast.info('Reconciling ledger balances...');
            await accountingApi.reconcileLedger();
            toast.success('Ledger reconciled successfully');
            fetchRecentEntries();
        } catch (error) {
            toast.error('Reconciliation failed');
        }
    };

    const handleExport = async () => {
        try {
            toast.info('Exporting journal entries...');
            await accountingApi.downloadExport(
                'JOURNAL',
                `Journal_Entries_${new Date().toISOString().split('T')[0]}.csv`,
                undefined,
                undefined,
                { format: 'csv' }
            );
            toast.success('Journal exported');
        } catch {
            // Fallback: client-side from loaded rows
            try {
                const rows: (string | number)[][] = [];
                for (const entry of entries) {
                    for (const line of entry.lines || []) {
                        rows.push([
                            entry.date ? format(new Date(entry.date), 'yyyy-MM-dd') : '',
                            entry.reference || '',
                            entry.description || '',
                            line.account?.code || '',
                            line.account?.name || '',
                            Number(line.debit),
                            Number(line.credit),
                            entry.status
                        ]);
                    }
                }
                downloadCsv(
                    `Journal_Entries_${new Date().toISOString().split('T')[0]}.csv`,
                    ['Date', 'Reference', 'Description', 'Account Code', 'Account Name', 'Debit', 'Credit', 'Status'],
                    rows
                );
                toast.success('Journal exported');
            } catch {
                toast.error('Export failed');
            }
        }
    };

    const { totalDebit, totalCredit, difference } = calculateTotals();

    return (
        <div className="p-6">
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">
                            Journal Entries
                        </h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">
                            Manual General Ledger Adjustments
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={handleSync}
                        className="ent-button-secondary flex items-center gap-2"
                        title="Fix balance discrepancies"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        Sync Ledgers
                    </button>
                    <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                        <Download size={14} />
                        Export CSV
                    </button>
                    <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                        <Plus size={14} />
                        New Entry
                    </button>
                </div>
            </div>

            <div className="ent-table-container">
                <table className="ent-table">
                    <thead>
                        <tr>
                            <th className="text-left">Date</th>
                            <th className="text-left">Reference</th>
                            <th className="text-left w-1/3">Description</th>
                            <th className="text-right">Total Debit</th>
                            <th className="text-right">Lines</th>
                            <th className="text-center w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400 italic">No journal entries found.</td></tr>
                        ) : entries.map((entry) => {
                            const total = entry.lines.reduce((sum, l) => sum + Number(l.debit), 0);
                            const locked = isSystemLinked(entry.reference);
                            return (
                                <tr key={entry.id} className="hover:bg-gray-50/50">
                                    <td className="text-gray-500 font-medium">{format(new Date(entry.date), 'dd MMM yyyy')}</td>
                                    <td className="font-bold text-gray-900">
                                        {entry.reference}
                                        {locked && (
                                            <span className="ml-2 text-[8px] uppercase tracking-widest text-amber-600 font-black">System</span>
                                        )}
                                    </td>
                                    <td className="text-gray-600 italic text-xs">{entry.description}</td>
                                    <td className="text-right font-mono font-bold text-primary-700">
                                        {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="text-right text-[10px] text-gray-400 font-bold uppercase">
                                        {entry.lines.length} Lines
                                    </td>
                                    <td className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => openEdit(entry)}
                                                disabled={locked}
                                                className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors rounded-sm hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title={locked ? 'System-linked entry' : 'Edit Entry'}
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry)}
                                                disabled={locked}
                                                className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors rounded-sm hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title={locked ? 'System-linked entry' : 'Delete Entry'}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-black uppercase text-gray-900">
                                {editingId ? 'Edit Journal Entry' : 'Post Journal Entry'}
                            </h3>
                            <button
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-gray-500 mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        className="ent-input w-full"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-gray-500 mb-1.5">Reference #</label>
                                    <input
                                        type="text"
                                        className="ent-input w-full"
                                        placeholder="e.g. JV-001"
                                        value={formData.reference}
                                        onChange={e => setFormData({ ...formData, reference: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-gray-500 mb-1.5">Description</label>
                                    <input
                                        type="text"
                                        className="ent-input w-full"
                                        placeholder="e.g. Salary Adjustment"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="border rounded-md overflow-hidden mb-4">
                                <table className="w-full text-left text-xs bg-gray-50">
                                    <thead className="border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-2 font-black text-gray-500 uppercase w-1/2">Account</th>
                                            <th className="px-4 py-2 font-black text-gray-500 uppercase text-right w-1/5">Debit</th>
                                            <th className="px-4 py-2 font-black text-gray-500 uppercase text-right w-1/5">Credit</th>
                                            <th className="px-4 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {formData.lines.map((line, index) => (
                                            <tr key={index}>
                                                <td className="p-2">
                                                    <select
                                                        className="ent-input w-full"
                                                        value={line.accountId}
                                                        onChange={e => updateLine(index, 'accountId', e.target.value)}
                                                    >
                                                        <option value="">Select Account</option>
                                                        {accounts.map(acc => (
                                                            <option key={acc.id} value={acc.id}>
                                                                {acc.code} - {acc.name} ({acc.type})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="ent-input w-full text-right"
                                                        value={line.debit}
                                                        onChange={e => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                                                        onFocus={e => e.target.select()}
                                                        disabled={line.credit > 0}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="ent-input w-full text-right"
                                                        value={line.credit}
                                                        onChange={e => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                                                        onFocus={e => e.target.select()}
                                                        disabled={line.debit > 0}
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => handleRemoveLine(index)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                        disabled={formData.lines.length <= 2}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                                        <tr>
                                            <td className="px-4 py-2">
                                                <button
                                                    onClick={handleAddLine}
                                                    className="text-primary-600 hover:text-primary-700 text-[10px] uppercase font-black tracking-wider flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> Add Line
                                                </button>
                                            </td>
                                            <td className="px-4 py-2 text-right">{totalDebit.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right">{totalCredit.toFixed(2)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className={`p-3 rounded-md text-sm font-bold flex justify-between items-center ${Math.abs(difference) < 0.01
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                <span>Status: {Math.abs(difference) < 0.01 ? 'BALANCED' : 'UNBALANCED'}</span>
                                {Math.abs(difference) >= 0.01 && (
                                    <span>Difference: {difference.toFixed(2)}</span>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || Math.abs(difference) > 0.01}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting
                                    ? (editingId ? 'Saving...' : 'Posting...')
                                    : (editingId ? 'Save Changes' : 'Post Journal Entry')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
