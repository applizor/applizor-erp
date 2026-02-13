'use client';

import { useState, useEffect } from 'react';
import { accountingApi, LedgerAccount } from '@/lib/api/accounting';
import { Building2, Download, ShieldCheck, Wallet, Landmark, RefreshCw, PieChart as PieChartIcon } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

const COLORS = ['#001C30', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981'];

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

    const assets = accounts.filter(a => a.type === 'asset');
    const liabilities = accounts.filter(a => a.type === 'liability');
    const equity = accounts.filter(a => a.type === 'equity');

    const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalEquity = equity.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalLiabilitiesEquity = totalLiabilities + totalEquity;

    const chartData = [
        { name: 'Assets', value: Math.abs(totalAssets) },
        { name: 'Liabilities', value: Math.abs(totalLiabilities) },
        { name: 'Equity', value: Math.abs(totalEquity) }
    ];

    return (
        <div className="p-6">
            {/* Standard Page Header */}
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSync}
                        className="ent-button-secondary flex items-center gap-2"
                        title="Fix balance discrepancies"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        Sync Ledgers
                    </button>
                    <button className="btn-secondary flex items-center gap-2">
                        <Download size={14} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Premium Asset Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { title: 'Total Assets', value: totalAssets, icon: Landmark, color: 'emerald' },
                    { title: 'Total Liabilities', value: totalLiabilities, icon: ShieldCheck, color: 'rose' },
                    { title: 'Shareholder Equity', value: totalEquity, icon: Wallet, color: 'sky' },
                ].map((stat, i) => (
                    <div key={i} className="ent-card p-4 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-12 h-12 bg-${stat.color === 'primary' ? 'primary-600' : stat.color + '-500'}/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`} />
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon size={16} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{stat.title}</p>
                                <h3 className="text-sm font-black text-gray-900">
                                    {stat.value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                </h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Reports Columns */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assets Column */}
                    <div className="ent-card p-6 border-t-4 border-t-emerald-500">
                        <h3 className="text-[10px] font-black uppercase text-emerald-700 mb-6 tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Asset Portfolio
                        </h3>
                        <div className="space-y-3">
                            {assets.length === 0 && <span className="text-[10px] text-gray-400 italic">No assets recorded.</span>}
                            {assets.map(acc => (
                                <div key={acc.id} className="flex justify-between text-xs group py-1 border-b border-gray-50 last:border-0">
                                    <a
                                        href={`/accounting/reports/ledger/${acc.id}`}
                                        className="text-gray-600 font-bold hover:text-emerald-700 hover:underline transition-colors capitalize"
                                    >
                                        {acc.name}
                                    </a>
                                    <span className="font-mono font-black text-gray-900">
                                        {Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-4 border-t-2 border-slate-100 flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-slate-400">Net Assets</span>
                            <span className="text-sm font-black text-emerald-700 font-mono">
                                {totalAssets.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </span>
                        </div>
                    </div>

                    {/* Liabilities & Equity Column */}
                    <div className="ent-card p-6 border-t-4 border-t-rose-500 space-y-8">
                        {/* Liabilities */}
                        <div>
                            <h3 className="text-[10px] font-black uppercase text-rose-700 mb-6 tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Obligations / Liabilities
                            </h3>
                            <div className="space-y-3">
                                {liabilities.length === 0 && <span className="text-[10px] text-gray-400 italic">No liabilities recorded.</span>}
                                {liabilities.map(acc => (
                                    <div key={acc.id} className="flex justify-between text-xs group py-1 border-b border-gray-50 last:border-0">
                                        <a
                                            href={`/accounting/reports/ledger/${acc.id}`}
                                            className="text-gray-600 font-bold hover:text-rose-700 hover:underline transition-colors capitalize"
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

                        {/* Equity */}
                        <div>
                            <h3 className="text-[10px] font-black uppercase text-sky-700 mb-6 tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                Capital / Equity
                            </h3>
                            <div className="space-y-3">
                                {equity.length === 0 && <span className="text-[10px] text-gray-400 italic">No equity recorded.</span>}
                                {equity.map(acc => (
                                    <div key={acc.id} className="flex justify-between text-xs group py-1 border-b border-gray-50 last:border-0">
                                        <a
                                            href={`/accounting/reports/ledger/${acc.id}`}
                                            className="text-gray-600 font-bold hover:text-sky-700 hover:underline transition-colors capitalize"
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

                        {/* Grand Total */}
                        <div className="pt-4 border-t-2 border-slate-100 flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-slate-400">Total Capital & Lias</span>
                            <span className="text-sm font-black text-rose-700 font-mono">
                                {totalLiabilitiesEquity.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Charts */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="ent-card p-5">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <PieChartIcon size={12} />
                            Distribution Analysis
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none' }}
                                        formatter={(val: any) => val.toLocaleString('en-IN')}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(val: any) => <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{val}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={`ent-card p-5 border-none shadow-xl text-white ${Math.abs(totalAssets - totalLiabilitiesEquity) < 1 ? 'bg-primary-900' : 'bg-rose-900'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Accounting Equilibrium</h3>
                            <div className={`w-2 h-2 rounded-full ${Math.abs(totalAssets - totalLiabilitiesEquity) < 1 ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                        </div>
                        <div className="space-y-4">
                            <p className="text-[9px] font-medium opacity-50 leading-relaxed italic">
                                {Math.abs(totalAssets - totalLiabilitiesEquity) < 1
                                    ? "Ledger is in perfect equilibrium. Total Assets exactly equal the sum of Liabilities and Equity."
                                    : "Equilibrium Alert: There is a discrepancy between assets and liabilities. Recalculate balances using the 'Sync' feature."}
                            </p>
                            <div className="flex items-center gap-3 pt-2">
                                <div className="flex-1">
                                    <p className="text-[8px] font-bold opacity-40 uppercase">Equilibrium Status</p>
                                    <p className="text-xs font-black uppercase tracking-widest">
                                        {Math.abs(totalAssets - totalLiabilitiesEquity) < 1 ? 'Balanced' : 'Disharmony'}
                                    </p>
                                </div>
                                <div className="h-8 w-px bg-white/10" />
                                <div className="flex-1">
                                    <p className="text-[8px] font-bold opacity-40 uppercase">Variance</p>
                                    <p className="text-xs font-black font-mono">
                                        {(totalAssets - totalLiabilitiesEquity).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
