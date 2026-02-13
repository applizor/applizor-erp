'use client';

import { useState, useEffect } from 'react';
import { accountingApi } from '@/lib/api/accounting';
import { FileText, Download, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export default function GstSummaryPage() {
    const toast = useToast();
    const [data, setData] = useState<Record<string, { input: number, output: number }>>({});
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
            setData(results);
        } catch (error) {
            toast.error('Failed to fetch GST Summary');
        } finally {
            setIsLoading(false);
        }
    };

    const totalOutput = Object.values(data).reduce((sum, v) => sum + v.output, 0);
    const totalInput = Object.values(data).reduce((sum, v) => sum + v.input, 0);
    const netPayable = totalOutput - totalInput;

    return (
        <div className="p-6">
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
                    <button className="btn-secondary flex items-center gap-2">
                        <Download size={14} />
                        Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="ent-card p-6 border-l-4 border-l-rose-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total Output Tax</p>
                            <h2 className="text-xl font-black font-mono text-gray-900">
                                {totalOutput.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </h2>
                        </div>
                        <div className="p-2 bg-rose-50 rounded-md">
                            <ArrowUpRight className="w-4 h-4 text-rose-600" />
                        </div>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-2 font-medium">Liability on Sales</p>
                </div>

                <div className="ent-card p-6 border-l-4 border-l-emerald-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total Input Tax Credit</p>
                            <h2 className="text-xl font-black font-mono text-gray-900">
                                {totalInput.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </h2>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-md">
                            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-2 font-medium">Credit on Purchases</p>
                </div>

                <div className="ent-card p-6 border-l-4 border-l-primary-500 bg-primary-50/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase text-primary-900 tracking-widest mb-1">Net GST Payable</p>
                            <h2 className="text-xl font-black font-mono text-primary-900">
                                {netPayable.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </h2>
                        </div>
                        <div className="p-2 bg-primary-900 rounded-md">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <p className="text-[9px] text-primary-700 mt-2 font-medium">Estimated Tax Liability</p>
                </div>
            </div>

            <div className="ent-card overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-xs font-black uppercase text-gray-900 tracking-widest">Tax Component Breakdown</h3>
                </div>
                <table className="ent-table">
                    <thead>
                        <tr>
                            <th className="text-left">Tax Component</th>
                            <th className="text-right">Output (Sales)</th>
                            <th className="text-right">Input (Purchases)</th>
                            <th className="text-right">Net Payable/Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(data).map(([type, values]) => (
                            <tr key={type}>
                                <td className="font-bold text-gray-900">{type}</td>
                                <td className="text-right font-mono text-rose-600">
                                    {values.output.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="text-right font-mono text-emerald-600">
                                    {values.input.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="text-right font-mono font-black text-gray-900">
                                    {(values.output - values.input).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-[10px] text-amber-800 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <ArrowUpRight size={12} /> Filing Note
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                    This summary provides a preliminary view of your GST liability based on posted journal entries.
                    Please ensure all Invoices (Outward) and Expenses/Bills (Inward) for the period are fully posted to the ledger before final reconciliation for GSTR-1 and GSTR-3B filings.
                </p>
            </div>
        </div>
    );
}
