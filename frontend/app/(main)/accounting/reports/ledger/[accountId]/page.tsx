'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { accountingApi } from '@/lib/api/accounting';
import { BookOpen, Download, Calendar, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import Link from 'next/link';

export default function GeneralLedgerPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const accountId = params.accountId as string;
    const toast = useToast();

    const [entries, setEntries] = useState<any[]>([]);
    const [account, setAccount] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: searchParams.get('startDate') || format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: searchParams.get('endDate') || format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });

    useEffect(() => {
        if (accountId) fetchData();
    }, [accountId, dateRange]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await accountingApi.getGeneralLedger(accountId, dateRange.startDate, dateRange.endDate);
            setEntries(data.lines || []);
            setAccount(data.account);
        } catch (error) {
            toast.error('Failed to fetch General Ledger');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate running balance logic if needed, or just show transactions
    let runningBalance = Number(account?.openingBalance || 0);

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link href="/accounting/reports/trial-balance" className="text-primary-600 hover:text-primary-700 text-xs font-bold flex items-center gap-1 uppercase tracking-widest transition-colors mb-4">
                    <ArrowLeft size={14} /> Back to Reports
                </Link>

                <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">
                                {account?.name || 'Account Ledger'}
                            </h1>
                            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">
                                {account?.code} • {account?.type}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-md border border-gray-200">
                            <Calendar size={14} className="ml-2 text-gray-400" />
                            <input
                                type="date"
                                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 p-1"
                                value={dateRange.startDate}
                                onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 p-1"
                                value={dateRange.endDate}
                                onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                            />
                        </div>
                        <button className="btn-secondary flex items-center gap-2">
                            <Download size={14} />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            <div className="ent-card overflow-hidden">
                <table className="ent-table">
                    <thead>
                        <tr>
                            <th className="text-left">Date</th>
                            <th className="text-left">Reference</th>
                            <th className="text-left w-1/3">Description</th>
                            <th className="text-right">Debit</th>
                            <th className="text-right">Credit</th>
                            <th className="text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading transactions...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400 italic">No transactions found in this period.</td></tr>
                        ) : entries.map((line) => {
                            const debit = Number(line.debit);
                            const credit = Number(line.credit);

                            // Adjust running balance based on account type
                            if (account?.type === 'asset' || account?.type === 'expense') {
                                runningBalance += (debit - credit);
                            } else {
                                runningBalance += (credit - debit);
                            }

                            return (
                                <tr key={line.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="text-gray-500 font-medium">{format(new Date(line.journalEntry.date), 'dd MMM yyyy')}</td>
                                    <td className="font-bold text-primary-700">{line.journalEntry.reference}</td>
                                    <td className="text-gray-600 italic">{line.journalEntry.description}</td>
                                    <td className="text-right font-mono text-gray-900">
                                        {debit > 0 ? debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    <td className="text-right font-mono text-gray-900">
                                        {credit > 0 ? credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    <td className="text-right font-mono font-black text-gray-900">
                                        {runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
