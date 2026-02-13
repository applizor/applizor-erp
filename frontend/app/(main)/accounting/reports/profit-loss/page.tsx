'use client';

import { useState, useEffect } from 'react';
import { accountingApi, LedgerAccount } from '@/lib/api/accounting';
import { LineChart, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export default function ProfitLossPage() {
    const toast = useToast();
    const [data, setData] = useState<{
        revenue: LedgerAccount[];
        costOfGoodsSold: LedgerAccount[];
        otherIncome: LedgerAccount[];
        operatingExpenses: LedgerAccount[];
    }>({
        revenue: [],
        costOfGoodsSold: [],
        otherIncome: [],
        operatingExpenses: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const results = await accountingApi.getProfitAndLoss(dateRange.startDate, dateRange.endDate);
            setData(results);
        } catch (error) {
            toast.error('Failed to fetch Profit & Loss');
        } finally {
            setIsLoading(false);
        }
    };

    const totalIncome = data.revenue.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalCOGS = data.costOfGoodsSold.reduce((sum, a) => sum + Number(a.balance), 0);
    const grossProfit = totalIncome - totalCOGS;

    const totalOtherIncome = data.otherIncome.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalOperatingExpenses = data.operatingExpenses.reduce((sum, a) => sum + Number(a.balance), 0);
    const netIncome = (grossProfit + totalOtherIncome) - totalOperatingExpenses;

    return (
        <div className="p-6">
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <LineChart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">
                            Profit & Loss
                        </h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">
                            Income Statement
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

            <div className="ent-card p-6 space-y-8 max-w-4xl mx-auto">

                {/* Revenue Section */}
                <div>
                    <h3 className="text-[10px] font-black uppercase text-emerald-700 border-b border-emerald-100 pb-2 mb-4 bg-emerald-50/20 px-3 py-2 rounded-t-md tracking-wider">
                        Revenue / Direct Income
                    </h3>
                    <div className="space-y-2 px-3">
                        {data.revenue.length === 0 && <span className="text-[10px] text-gray-400 italic">No revenue recorded.</span>}
                        {data.revenue.map(acc => (
                            <div key={acc.id} className="flex justify-between text-xs group py-1.5 rounded transition-colors px-1 hover:bg-emerald-50/30">
                                <a
                                    href={`/accounting/reports/ledger/${acc.id}`}
                                    className="font-bold text-gray-600 hover:text-emerald-700 hover:underline transition-colors"
                                >
                                    {acc.name}
                                </a>
                                <span className="font-mono font-black text-gray-900">
                                    {Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COGS Section */}
                <div>
                    <h3 className="text-[10px] font-black uppercase text-amber-700 border-b border-amber-100 pb-2 mb-4 bg-amber-50/20 px-3 py-2 rounded-t-md tracking-wider">
                        Cost of Goods Sold / Direct Expenses
                    </h3>
                    <div className="space-y-2 px-3">
                        {data.costOfGoodsSold.length === 0 && <span className="text-[10px] text-gray-400 italic">No direct expenses recorded.</span>}
                        {data.costOfGoodsSold.map(acc => (
                            <div key={acc.id} className="flex justify-between text-xs group py-1.5 rounded transition-colors px-1 hover:bg-amber-50/30">
                                <a
                                    href={`/accounting/reports/ledger/${acc.id}`}
                                    className="font-bold text-gray-600 hover:text-amber-700 hover:underline transition-colors"
                                >
                                    {acc.name}
                                </a>
                                <span className="font-mono font-black text-gray-900">
                                    {Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gross Profit Bar */}
                <div className="bg-gray-900 text-white p-4 rounded-md flex justify-between items-center mx-3 border shadow-lg">
                    <span className="text-[10px] font-black uppercase tracking-widest">Gross Profit</span>
                    <span className="text-sm font-black font-mono">
                        {grossProfit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                </div>

                {/* Other Income */}
                <div>
                    <h3 className="text-[10px] font-black uppercase text-sky-700 border-b border-sky-100 pb-2 mb-4 bg-sky-50/20 px-3 py-2 rounded-t-md tracking-wider">
                        Indirect / Other Income
                    </h3>
                    <div className="space-y-2 px-3">
                        {data.otherIncome.length === 0 && <span className="text-[10px] text-gray-400 italic">No other income recorded.</span>}
                        {data.otherIncome.map(acc => (
                            <div key={acc.id} className="flex justify-between text-xs group py-1.5 rounded transition-colors px-1 hover:bg-sky-50/30">
                                <a
                                    href={`/accounting/reports/ledger/${acc.id}`}
                                    className="font-bold text-gray-600 hover:text-sky-700 hover:underline transition-colors"
                                >
                                    {acc.name}
                                </a>
                                <span className="font-mono font-black text-gray-900">
                                    {Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Operating Expenses */}
                <div>
                    <h3 className="text-[10px] font-black uppercase text-rose-700 border-b border-rose-100 pb-2 mb-4 bg-rose-50/20 px-3 py-2 rounded-t-md tracking-wider">
                        Indirect / Operating Expenses
                    </h3>
                    <div className="space-y-2 px-3">
                        {data.operatingExpenses.length === 0 && <span className="text-[10px] text-gray-400 italic">No operating expenses recorded.</span>}
                        {data.operatingExpenses.map(acc => (
                            <div key={acc.id} className="flex justify-between text-xs group py-1.5 rounded transition-colors px-1 hover:bg-rose-50/30">
                                <a
                                    href={`/accounting/reports/ledger/${acc.id}`}
                                    className="font-bold text-gray-600 hover:text-rose-700 hover:underline transition-colors"
                                >
                                    {acc.name}
                                </a>
                                <span className="font-mono font-black text-gray-900">
                                    {Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Net Income */}
                <div className={`
                    mt-8 pt-6 border-t-2 flex justify-between items-center px-4 py-4 rounded-md
                    ${netIncome >= 0 ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500'}
                `}>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Net Income</h2>
                        <p className="text-[10px] text-gray-500 font-medium mt-1">
                            {format(new Date(dateRange.startDate), 'MMM dd')} - {format(new Date(dateRange.endDate), 'MMM dd, yyyy')}
                        </p>
                    </div>
                    <span className={`text-xl font-black font-mono ${netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {netIncome.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                </div>

            </div>
        </div>
    );
}
