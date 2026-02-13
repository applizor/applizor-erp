'use client';

import { useState, useEffect } from 'react';
import { accountingApi, LedgerAccount } from '@/lib/api/accounting';
import { Scale, Download } from 'lucide-react';
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

    return (
        <div className="p-6">
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
                            As of {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <button className="btn-secondary flex items-center gap-2">
                    <Download size={14} />
                    Export PDF
                </button>
            </div>

            <div className="ent-card overflow-hidden">
                <table className="ent-table w-full">
                    <thead>
                        <tr>
                            <th className="text-left w-24">Code</th>
                            <th className="text-left">Account Name</th>
                            <th className="text-right w-32">Debit</th>
                            <th className="text-right w-32">Credit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-500 text-xs">Loading...</td>
                            </tr>
                        ) : accounts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-500 text-xs">No accounts found.</td>
                            </tr>
                        ) : (
                            accounts.map(acc => {
                                const { debit, credit } = calculateDebitCredit(acc);
                                return (
                                    <tr key={acc.id} className="hover:bg-gray-50/50 group">
                                        <td className="font-mono text-gray-500">{acc.code}</td>
                                        <td>
                                            <a
                                                href={`/accounting/reports/ledger/${acc.id}`}
                                                className="font-bold text-gray-900 hover:text-primary-600 hover:underline transition-colors"
                                            >
                                                {acc.name}
                                            </a>
                                        </td>
                                        <td className="text-right font-mono text-gray-700">
                                            {debit > 0 ? debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="text-right font-mono text-gray-700">
                                            {credit > 0 ? credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                        <tr>
                            <td colSpan={2} className="px-4 py-3 text-right text-xs uppercase tracking-wider">Totals</td>
                            <td className="px-4 py-3 text-right font-mono text-primary-900">
                                {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-primary-900">
                                {totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                        {Math.abs(difference) > 0.01 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-2 text-center text-rose-600 bg-rose-50 text-xs font-bold">
                                    ⚠️ UNBALANCED: Difference of {difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        )}
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
