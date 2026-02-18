'use client';

import { useState, useEffect } from 'react';
import { accountingApi } from '@/lib/api/accounting';
import { FileText, Download, Calendar, ArrowUpRight, ArrowDownLeft, RefreshCw, ShieldCheck, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from 'recharts';

interface GstData {
    summary: Record<string, { input: number, output: number }>;
    transactions: Array<{
        date: string;
        invoiceNumber: string;
        clientName: string;
        clientGstin: string;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalTax: number;
        totalAmount: number;
    }>;
}

export default function GstSummaryPage() {
    const toast = useToast();
    const [data, setData] = useState<GstData>({ summary: {}, transactions: [] });
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
            const results = await accountingApi.getGstSummary(dateRange.startDate, dateRange.endDate);

            // Fix: Backend returns split B2B/B2C, frontend expects single list
            const allTransactions = [
                ...(results.b2bTransactions || []),
                ...(results.b2cTransactions || [])
            ];

            // Handle backward compatibility if API returns old format
            if (results.summary) {
                setData({ ...results, transactions: allTransactions });
            } else {
                setData({ summary: results, transactions: [] });
            }
        } catch (error) {
            toast.error('Failed to fetch GST Summary');
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
            const blob = await accountingApi.exportReport('GST_SUMMARY', dateRange.startDate, dateRange.endDate);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `GST_Summary_${dateRange.startDate}_${dateRange.endDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Report exported successfully');
        } catch (error) {
            toast.error('Failed to export report');
        }
    };

    const totalOutput = Object.values(data.summary).reduce((sum, v) => sum + v.output, 0);
    const totalInput = Object.values(data.summary).reduce((sum, v) => sum + v.input, 0);
    const netPayable = totalOutput - totalInput;

    const chartData = Object.entries(data.summary).map(([type, vals]) => ({
        name: type,
        Output: vals.output,
        Input: vals.input
    }));

    return (
        <div className="p-6">
            {/* Standard Page Header */}
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">
                            GST Summary
                        </h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">
                            Tax Compliance Report (GSTR-1/3B Prep)
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
                        Export
                    </button>
                </div>
            </div>

            {/* Premium GST Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="ent-card p-6 border-l-4 border-l-rose-500 group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">Total Output Tax</p>
                            <h2 className="text-xl font-black font-mono text-gray-900">
                                {totalOutput.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </h2>
                        </div>
                        <div className="p-2 bg-rose-50 rounded-md group-hover:scale-110 transition-transform">
                            <ArrowUpRight className="w-4 h-4 text-rose-600" />
                        </div>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-2 font-medium italic opacity-70">Tax liability generated from sales transactions</p>
                </div>

                <div className="ent-card p-6 border-l-4 border-l-emerald-500 group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">Total Input Tax Credit</p>
                            <h2 className="text-xl font-black font-mono text-gray-900">
                                {totalInput.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </h2>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-md group-hover:scale-110 transition-transform">
                            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-2 font-medium italic opacity-70">Credit claimed from purchase transactions</p>
                </div>

                <div className="ent-card p-6 bg-primary-900 border-none shadow-xl text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Net GST Payable</p>
                            <h2 className="text-2xl font-black font-mono">
                                {netPayable.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </h2>
                        </div>
                        <div className={`p-2 rounded-md ${netPayable > 0 ? 'bg-amber-400/20' : 'bg-emerald-400/20'}`}>
                            <FileText className={`w-4 h-4 ${netPayable > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${netPayable > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-8">
                {/* Chart Section */}
                <div className="ent-card p-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <BarChartIcon size={12} />
                        Input vs Output Comparison
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none' }}
                                    formatter={(v: any) => v.toLocaleString('en-IN')}
                                />
                                <Legend />
                                <Bar dataKey="Output" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="Input" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tax Summary Table */}
                <div className="ent-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase text-gray-900 tracking-widest">Tax Component Summary</h3>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">INR</span>
                    </div>
                    <table className="ent-table w-full">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="text-left px-6 py-3">Tax Component</th>
                                <th className="text-right px-6 py-3">Output</th>
                                <th className="text-right px-6 py-3">Input</th>
                                <th className="text-right px-6 py-3">Net Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {Object.entries(data.summary).map(([type, values]) => (
                                <tr key={type} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-black text-[11px] text-gray-900 uppercase">{type}</div>
                                        <div className="text-[9px] text-gray-400 font-medium">Standard GST rate</div>
                                    </td>
                                    <td className="text-right px-6 py-4 font-mono font-bold text-rose-600">
                                        {values.output.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="text-right px-6 py-4 font-mono font-bold text-emerald-600">
                                        {values.input.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`text-right px-6 py-4 font-mono font-black ${values.output - values.input > 0 ? 'text-gray-900' : 'text-emerald-700'}`}>
                                        {(values.output - values.input).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* NEW: Transaction Breakdown Table (GSRT-1 Style) */}
            <div className="ent-card overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xs font-black uppercase text-gray-900 tracking-widest">Transaction Breakdown (GSTR-1)</h3>
                        <p className="text-[10px] text-gray-500 font-bold mt-1">Detailed list of invoices and their tax components</p>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {data.transactions ? data.transactions.length : 0} Transactions
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="ent-table w-full">
                        <thead>
                            <tr>
                                <th className="text-left px-6 py-3 w-28">Date</th>
                                <th className="text-left px-6 py-3 w-32">Invoice #</th>
                                <th className="text-left px-6 py-3">Client / GSTIN</th>
                                <th className="text-right px-6 py-3">Taxable Value</th>
                                <th className="text-right px-6 py-3 text-gray-500">CGST</th>
                                <th className="text-right px-6 py-3 text-gray-500">SGST</th>
                                <th className="text-right px-6 py-3 text-gray-500">IGST</th>
                                <th className="text-right px-6 py-3 text-rose-600">Total Tax</th>
                                <th className="text-right px-6 py-3 font-black">Total Amt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(!data.transactions || data.transactions.length === 0) ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-xs text-gray-400 italic">
                                        No sales transactions found for this period
                                    </td>
                                </tr>
                            ) : (
                                data.transactions.map((tx, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-3 text-gray-500 font-medium">
                                            {format(new Date(tx.date), 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-primary-700 font-bold">{tx.invoiceNumber}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-bold text-gray-900">{tx.clientName}</div>
                                            <div className="text-[9px] text-gray-400 font-mono mt-0.5">GSTIN: {tx.clientGstin}</div>
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono font-medium text-gray-600">
                                            {tx.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono text-gray-400">
                                            {tx.cgst > 0 ? tx.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono text-gray-400">
                                            {tx.sgst > 0 ? tx.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono text-gray-400">
                                            {tx.igst > 0 ? tx.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono font-bold text-rose-600">
                                            {tx.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono font-black text-gray-900 group-hover:text-primary-700">
                                            {tx.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                            {data.transactions && data.transactions.length > 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-right uppercase text-[10px] tracking-widest text-gray-500">Totals</td>
                                    <td className="px-6 py-4 text-right font-mono">
                                        {data.transactions.reduce((sum, t) => sum + t.taxableValue, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-500">
                                        {data.transactions.reduce((sum, t) => sum + t.cgst, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-500">
                                        {data.transactions.reduce((sum, t) => sum + t.sgst, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-500">
                                        {data.transactions.reduce((sum, t) => sum + t.igst, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-rose-600">
                                        {data.transactions.reduce((sum, t) => sum + t.totalTax, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-black text-gray-900">
                                        {data.transactions.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            )}
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="mt-8 p-6 bg-slate-900 rounded-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10">
                    <p className="text-[10px] text-primary-400 font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-primary-500" /> Statutory Compliance Advisory
                    </p>
                    <p className="text-xs text-gray-300 leading-relaxed font-medium">
                        This summary provides a preliminary view of your GST liability based on posted journal entries.
                        It is optimized for GSTR-1 and GSTR-3B preparation. Ensure all bank statements and purchase bills
                        are reconciled using the <span className="text-white font-black">Sync Ledgers</span> tool
                        in the Chart of Accounts before final submission.
                    </p>
                </div>
            </div>
        </div>
    );
}
