'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Wallet, PieChart } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ProjectFinancials({ params }: { params: { id: string } }) {
    const toast = useToast();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFinancials();
    }, [params.id]);

    const fetchFinancials = async () => {
        try {
            const res = await api.get(`/projects/${params.id}`);
            const projectCurrency = res.data.currency || 'USD';
            if (res.data.stats && res.data.stats.financials) {
                setStats({ ...res.data.stats.financials, currency: projectCurrency });
            } else {
                // Fallback if stats not populated
                setStats({
                    budget: res.data.budget || 0,
                    revenue: res.data.actualRevenue || 0,
                    expenses: res.data.actualExpenses || 0,
                    margin: 0,
                    currency: projectCurrency
                });
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load financials');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;

    if (!stats) return <div>No financial data available.</div>;

    const remainingBudget = stats.budget - stats.expenses;
    const isProfitable = stats.margin >= 0;

    // Helper formatter
    const format = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: stats.currency || 'USD' }).format(amount);
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Financial Ledger</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budgeting & Expense Tracking</p>
                </div>
                <div className="ent-card px-4 py-2 flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NET MARGIN</span>
                    <span className={`text-lg font-black ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stats.margin}%
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="ent-card p-6 border-t-4 border-t-primary-600">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <DollarSign size={12} /> Budget
                    </h3>
                    <p className="text-2xl font-black text-gray-900">{format(Number(stats.budget))}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Allocated Total</p>
                </div>
                <div className="ent-card p-6 border-t-4 border-t-emerald-500">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp size={12} className="text-emerald-500" /> Revenue
                    </h3>
                    <p className="text-2xl font-black text-gray-900">{format(Number(stats.revenue))}</p>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Base: {format(Number(stats.baseAmount || 0))}</p>
                        <p className="text-[9px] text-amber-600 font-black uppercase">GST: {format(Number(stats.taxAmount || 0))}</p>
                    </div>
                </div>
                <div className="ent-card p-6 border-t-4 border-t-rose-500">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingDown size={12} className="text-rose-500" /> Expenses
                    </h3>
                    <p className="text-2xl font-black text-gray-900">{format(Number(stats.expenses))}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Operational Costs</p>
                </div>
                <div className="ent-card p-6 border-t-4 border-t-blue-500">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Wallet size={12} className="text-blue-500" /> Remaining
                    </h3>
                    <p className="text-2xl font-black text-gray-900">{format(Number(stats.remainingBudget !== undefined ? stats.remainingBudget : (stats.budget - stats.revenue)))}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Budget vs Invoiced Base</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="ent-card p-6 min-h-[300px]">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <PieChart size={14} className="text-primary-600" />
                        Cost Breakdown
                    </h3>
                    <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                        <p className="text-xs font-bold uppercase">Chart Visualization Pending</p>
                        <p className="text-[9px]">Detailed expense categorization will appear here.</p>
                    </div>
                </div>

                <div className="ent-card p-6 min-h-[300px]">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp size={14} className="text-emerald-600" />
                        Recent Transactions
                    </h3>
                    <div className="space-y-3">
                        {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
                            stats.recentTransactions.map((tx: any) => (
                                <div key={tx.id} className="p-3 bg-gray-50 rounded border border-gray-100 flex justify-between items-center hover:bg-white transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-full ${tx.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                            <TrendingUp size={10} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Payment {tx.status === 'paid' ? 'Received' : 'Pending'}</p>
                                            <p className="text-[10px] text-gray-400">Invoice #{tx.number} • {new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-black ${tx.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        +{format(tx.amount)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                                <p className="text-xs font-bold uppercase">No Transactions Found</p>
                                <p className="text-[9px]">Invoices and payments will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
