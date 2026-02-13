'use client';

import { useState, useEffect } from 'react';
import { accountingApi, LedgerAccount, JournalEntry } from '@/lib/api/accounting';
import { FileText, Plus, Trash2, BookOpen, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';

interface JournalLineForm {
    accountId: string;
    debit: number;
    credit: number;
}

export default function JournalEntryPage() {
    const toast = useToast();
    const [entries, setEntries] = useState<JournalEntry[]>([]); // TODO: Fetch recent entries
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        lines: [
            { accountId: '', debit: 0, credit: 0 },
            { accountId: '', debit: 0, credit: 0 }
        ] as JournalLineForm[]
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
            await accountingApi.createJournalEntry(formData);
            toast.success('Journal Entry posted successfully');
            setIsModalOpen(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                description: '',
                reference: '',
                lines: [
                    { accountId: '', debit: 0, credit: 0 },
                    { accountId: '', debit: 0, credit: 0 }
                ]
            });
            fetchRecentEntries();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to post entry');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this journal entry? Account balances will be reverted.')) return;

        try {
            await accountingApi.deleteJournalEntry(id);
            toast.success('Journal entry deleted');
            fetchRecentEntries();
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

    const { totalDebit, totalCredit, difference } = calculateTotals();

    return (
        <div className="p-6">
            {/* Header ... */}
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSync}
                        className="ent-button-secondary flex items-center gap-2"
                        title="Fix balance discrepancies"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        Sync Ledgers
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={14} />
                        New Entry
                    </button>
                </div>
            </div>

            <div className="ent-card overflow-hidden">
                <table className="ent-table">
                    <thead>
                        <tr>
                            <th className="text-left">Date</th>
                            <th className="text-left">Reference</th>
                            <th className="text-left w-1/3">Description</th>
                            <th className="text-right">Total Debit</th>
                            <th className="text-right">Lines</th>
                            <th className="text-center w-10">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-400 italic">No manual entries found.</td></tr>
                        ) : entries.map((entry) => {
                            const total = entry.lines.reduce((sum, l) => sum + Number(l.debit), 0);
                            return (
                                <tr key={entry.id} className="hover:bg-gray-50/50">
                                    <td className="text-gray-500 font-medium">{format(new Date(entry.date), 'dd MMM yyyy')}</td>
                                    <td className="font-bold text-gray-900">{entry.reference}</td>
                                    <td className="text-gray-600 italic text-xs">{entry.description}</td>
                                    <td className="text-right font-mono font-bold text-primary-700">
                                        {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="text-right text-[10px] text-gray-400 font-bold uppercase">
                                        {entry.lines.length} Lines
                                    </td>
                                    <td className="text-center">
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors rounded-sm hover:bg-rose-50"
                                            title="Delete Entry"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* New Entry Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-black uppercase text-gray-900">Post Journal Entry</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
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
                                                        onChange={e => updateLine(index, 'debit', parseFloat(e.target.value))}
                                                        onFocus={e => e.target.select()}
                                                        disabled={line.credit > 0}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="ent-input w-full text-right"
                                                        value={line.credit}
                                                        onChange={e => updateLine(index, 'credit', parseFloat(e.target.value))}
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

                            {/* Balance Indicator */}
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
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || Math.abs(difference) > 0.01}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Posting...' : 'Post Journal Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
