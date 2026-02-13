'use client';

import { useState, useEffect } from 'react';
import { accountingApi, LedgerAccount } from '@/lib/api/accounting';
import { Scale, Download, ShieldCheck, Activity, Landmark, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function TrialBalancePage() {
    const toast = useToast();
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await accountingApi.getTrialBalance();
            setAccounts(data);
        } catch (error) {
            toast.error('Failed to fetch Trial Balance');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            toast.info('Reconciling ledger balances...');
            setIsLoading(true);
            await accountingApi.reconcileLedger();
            toast.success('Ledger reconciled successfully');
            fetchData();
        } catch (error) {
            toast.error('Reconciliation failed');
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            toast.info('Generating PDF...');
            const blob = await accountingApi.exportReport('TRIAL_BALANCE');
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Trial_Balance_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Report exported successfully');
        } catch (error) {
            toast.error('Failed to export report');
        }
    };

    const calculateDebitCredit = (account: LedgerAccount) => {
        const balance = Number(account.balance);
        let debit = 0;
        let credit = 0;

        // Normal Balance Logic
        if (['asset', 'expense'].includes(account.type)) {
            if (balance >= 0) debit = balance;
            else credit = Math.abs(balance);
        } else {
            if (balance >= 0) credit = balance;
            else debit = Math.abs(balance);
        }

        return { debit, credit };
    };

    const totalDebit = accounts.reduce((sum, acc) => sum + calculateDebitCredit(acc).debit, 0);
    const totalCredit = accounts.reduce((sum, acc) => sum + calculateDebitCredit(acc).credit, 0);
    const difference = totalDebit - totalCredit;
    const isBalanced = Math.abs(difference) < 0.01;

    return (
        <div className="p-6">
            {/* Standard Page Header */}
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <Scale className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">
                            Trial Balance
                        </h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">
                            Summary of Ledger Accounts • {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
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
                        onClick={handleExport}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Download size={14} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Equilibrium Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="ent-card p-6 border-l-4 border-l-slate-900 flex justify-between items-center group">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cumulative Debits</p>
                        <h2 className="text-xl font-black font-mono text-gray-900 group-hover:text-primary-600 transition-colors">
                            {totalDebit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </h2>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-full text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                        <Landmark size={20} />
                    </div>
                </div>

                <div className="ent-card p-6 border-l-4 border-l-slate-900 flex justify-between items-center group">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cumulative Credits</p>
                        <h2 className="text-xl font-black font-mono text-gray-900 group-hover:text-primary-600 transition-colors">
                            {totalCredit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </h2>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-full text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                        <ShieldCheck size={20} />
                    </div>
                </div>

                <div className={`ent-card p-6 border-none shadow-xl text-white relative overflow-hidden ${isBalanced ? 'bg-primary-900' : 'bg-rose-900'}`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Ledger Equilibrium</p>
                            <h2 className="text-xl font-black font-mono">
                                {isBalanced ? 'Balanced' : formatCurrency(difference)}
                            </h2>
                        </div>
                        <div className={`p-2 rounded-md ${isBalanced ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/20 text-white animate-pulse'}`}>
                            <Activity size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Trial Balance Table Container */}
            <div className="ent-card overflow-hidden border-none shadow-xl">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operational Equilibrium</h3>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isBalanced ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                            {isBalanced ? 'System Harmonized' : 'Discrepancy Detected'}
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="ent-table w-full">
                        <thead>
                            <tr className="bg-white/50">
                                <th className="text-left py-4 px-6 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 w-32">Ledger Code</th>
                                <th className="text-left py-4 px-6 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Account Designation</th>
                                <th className="text-right py-4 px-6 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 w-48">Debit (DR)</th>
                                <th className="text-right py-4 px-6 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 w-48">Credit (CR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Ledger...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : accounts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-20 text-slate-400 text-xs font-bold uppercase tracking-widest italic opacity-50">
                                        Initial ledger state detected. No balances recorded.
                                    </td>
                                </tr>
                            ) : (
                                accounts.map(acc => {
                                    const { debit, credit } = calculateDebitCredit(acc);
                                    return (
                                        <tr key={acc.id} className="hover:bg-primary-50/30 transition-all group">
                                            <td className="py-4 px-6 font-mono text-slate-400 font-black text-[11px]">
                                                {acc.code}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-1 h-3 rounded-full 
                                                        ${acc.type === 'asset' ? 'bg-emerald-400' : ''}
                                                        ${acc.type === 'liability' ? 'bg-amber-400' : ''}
                                                        ${acc.type === 'equity' ? 'bg-blue-400' : ''}
                                                        ${acc.type === 'income' ? 'bg-indigo-400' : ''}
                                                        ${acc.type === 'expense' ? 'bg-rose-400' : ''}
                                                    `} />
                                                    <a
                                                        href={`/accounting/reports/ledger/${acc.id}`}
                                                        className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors uppercase tracking-tight text-xs"
                                                    >
                                                        {acc.name}
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono font-black text-slate-900 text-xs">
                                                {debit > 0 ? debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : <span className="text-slate-200">0.00</span>}
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono font-black text-slate-900 text-xs">
                                                {credit > 0 ? credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : <span className="text-slate-200">0.00</span>}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        <tfoot className="bg-slate-900 text-white font-black">
                            <tr>
                                <td colSpan={2} className="px-6 py-5 text-right text-[10px] uppercase tracking-[0.25em] opacity-60">Consolidated Totals</td>
                                <td className="px-6 py-5 text-right font-mono text-sm tracking-tighter decoration-double underline decoration-primary-400 underline-offset-4">
                                    {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-5 text-right font-mono text-sm tracking-tighter decoration-double underline decoration-primary-400 underline-offset-4">
                                    {totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Statutory Footnote */}
            <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10 flex gap-4 items-start">
                    <div className="p-2 bg-white rounded-md shadow-sm">
                        <ArrowRightLeft className="text-amber-600 w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-amber-800 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                            Balance Assurance Note
                        </p>
                        <p className="text-xs text-amber-700 leading-relaxed font-medium">
                            This trial balance reflects the summarized debit and credit balances of all ledger accounts.
                            If the system state is "Balanced", total debits equal total credits, satisfying the fundamental
                            accounting equation. For discrepancies, please utilize the <span className="text-amber-900 font-black">Sync Ledger</span> feature
                            in the Configuration portal.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const formatCurrency = (val: number) => {
    return val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
};
