'use client';

import { useState, useEffect } from 'react';
import { accountingApi, LedgerAccount } from '@/lib/api/accounting';
import { Building2, Download } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function BalanceSheetPage() {
    const toast = useToast();
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await accountingApi.getBalanceSheet();
            setAccounts(data);
        } catch (error) {
            toast.error('Failed to fetch Balance Sheet');
        } finally {
            setIsLoading(false);
        }
    };

    const assets = accounts.filter(a => a.type === 'asset');
    const liabilities = accounts.filter(a => a.type === 'liability');
    const equity = accounts.filter(a => a.type === 'equity');

    const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalEquity = equity.reduce((sum, a) => sum + Number(a.balance), 0);

    // Note: Net Income from P&L should be added to Equity to balance usually.
    // For now, we are just displaying what is in the ledger.
    // If we want a true balance sheet, we need to calculate current period Net Income and add to Equity.
    // Let's hold on that complexity for V1 or display a warning.

    const totalLiabilitiesEquity = totalLiabilities + totalEquity;

    return (
        <div className="p-6">
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">
                            Balance Sheet
                        </h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">
                            Financial Position Statement
                        </p>
                    </div>
                </div>
                <button className="btn-secondary flex items-center gap-2">
                    <Download size={14} />
                    Export PDF
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Assets Column */}
                <div className="ent-card p-6">
                    <h3 className="text-sm font-black uppercase text-gray-700 border-b pb-2 mb-4">Assets</h3>
                    <div className="space-y-3">
                        {assets.map(acc => (
                            <div key={acc.id} className="flex justify-between text-xs group">
                                <a
                                    href={`/accounting/reports/ledger/${acc.id}`}
                                    className="text-gray-600 font-bold hover:text-primary-600 hover:underline transition-colors"
                                >
                                    {acc.name}
                                </a>
                                <span className="font-mono font-bold text-gray-900">
                                    {Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between font-black uppercase text-xs">
                        <span>Total Assets</span>
                        <span className="text-primary-700">
                            {totalAssets.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </span>
                    </div>
                </div>

                {/* Liabilities & Equity Column */}
                <div className="ent-card p-6 space-y-8">

                    {/* Liabilities */}
                    <div>
                        <h3 className="text-sm font-black uppercase text-gray-700 border-b pb-2 mb-4">Liabilities</h3>
                        <div className="space-y-3">
                            {liabilities.map(acc => (
                                <div key={acc.id} className="flex justify-between text-xs group">
                                    <a
                                        href={`/accounting/reports/ledger/${acc.id}`}
                                        className="text-gray-600 font-bold hover:text-primary-600 hover:underline transition-colors"
                                    >
                                        {acc.name}
                                    </a>
                                    <span className="font-mono font-bold text-gray-900">
                                        {Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-2 border-t border-dashed border-gray-200 flex justify-between font-bold text-xs">
                            <span className="text-gray-500">Total Liabilities</span>
                            <span>{totalLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Equity */}
                    <div>
                        <h3 className="text-sm font-black uppercase text-gray-700 border-b pb-2 mb-4">Equity</h3>
                        <div className="space-y-3">
                            {equity.map(acc => (
                                <div key={acc.id} className="flex justify-between text-xs group">
                                    <a
                                        href={`/accounting/reports/ledger/${acc.id}`}
                                        className="text-gray-600 font-bold hover:text-primary-600 hover:underline transition-colors"
                                    >
                                        {acc.name}
                                    </a>
                                    <span className="font-mono font-bold text-gray-900">
                                        {Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                            {/* Placeholder for Net Income */}
                            {/* <div className="flex justify-between text-xs text-gray-400 italic">
                                <span>Net Income (Current Period)</span>
                                <span>0.00</span>
                            </div> */}
                        </div>
                        <div className="mt-4 pt-2 border-t border-dashed border-gray-200 flex justify-between font-bold text-xs">
                            <span className="text-gray-500">Total Equity</span>
                            <span>{totalEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Grand Total */}
                    <div className="pt-4 border-t border-gray-200 flex justify-between font-black uppercase text-xs">
                        <span>Total Liabilities & Equity</span>
                        <span className="text-primary-700">
                            {totalLiabilitiesEquity.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}
