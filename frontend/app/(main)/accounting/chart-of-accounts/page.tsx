'use client';

import { useState, useEffect } from 'react';
import { accountingApi, LedgerAccount } from '@/lib/api/accounting';
import { BookOpen, Plus, Search, Layers, Activity, TrendingUp, TrendingDown, Landmark, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function ChartOfAccountsPage() {
    const toast = useToast();
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Account Form State
    const [newAccount, setNewAccount] = useState({
        code: '',
        name: '',
        type: 'asset'
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setIsLoading(true);
            const data = await accountingApi.getAccounts();
            setAccounts(data);
        } catch (error) {
            toast.error('Failed to fetch accounts');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await accountingApi.createAccount(newAccount);
            toast.success('Account created successfully');
            setIsModalOpen(false);
            setNewAccount({ code: '', name: '', type: 'asset' });
            fetchAccounts();
        } catch (error) {
            toast.error('Failed to create account');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredAccounts = accounts.filter(acc =>
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.code.includes(searchQuery)
    );

    return (
        <div className="p-6">
            {/* Standard Page Header */}
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">
                            Chart of Accounts
                        </h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">
                            General Ledger Configuration
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ent-input pl-9 w-full md:w-64"
                        />
                    </div>
                    <button
                        onClick={async () => {
                            try {
                                toast.info('Reconciling ledger balances...');
                                await accountingApi.reconcileLedger();
                                toast.success('Ledger reconciled successfully');
                                fetchAccounts();
                            } catch (error) {
                                toast.error('Reconciliation failed');
                            }
                        }}
                        className="ent-button-secondary flex items-center gap-2"
                        title="Fix balance discrepancies"
                    >
                        <BookOpen size={14} />
                        Sync Ledgers
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={14} />
                        Add Account
                    </button>
                </div>
            </div>

            {/* Dashboard Style Summary */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                {[
                    { title: 'Total Ledger', value: accounts.length, icon: Layers, color: 'primary' },
                    { title: 'Active Units', value: accounts.filter(a => a.isActive).length, icon: Activity, color: 'emerald' },
                    { title: 'Asset Base', value: accounts.filter(a => a.type === 'asset').length, icon: Landmark, color: 'sky' },
                    { title: 'Liabilities', value: accounts.filter(a => a.type === 'liability').length, icon: ShieldCheck, color: 'rose' },
                    { title: 'Revenue/Exp', value: accounts.filter(a => ['income', 'expense'].includes(a.type)).length, icon: TrendingUp, color: 'amber' },
                ].map((stat, i) => (
                    <div key={i} className="ent-card p-4 flex items-center gap-3 group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-8 h-8 bg-${stat.color === 'primary' ? 'primary' : stat.color}-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
                        <div className={`p-2 rounded bg-${stat.color === 'primary' ? 'primary' : stat.color}-50 text-${stat.color === 'primary' ? 'primary-600' : stat.color}-600`}>
                            <stat.icon size={14} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{stat.title}</p>
                            <h3 className="text-sm font-black text-gray-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Accounts Table Container */}
            <div className="ent-card overflow-hidden border-none shadow-xl">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operational Accounts</h3>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-gray-100 italic">Enterprise Ledger</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="ent-table w-full">
                        <thead>
                            <tr className="bg-white/50">
                                <th className="text-left py-4 px-6 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Code</th>
                                <th className="text-left py-4 px-6 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Account Name</th>
                                <th className="text-left py-4 px-6 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Categorization</th>
                                <th className="text-right py-4 px-6 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Current Balance</th>
                                <th className="text-center py-4 px-6 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">System Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500 text-xs">
                                        Loading accounts...
                                    </td>
                                </tr>
                            ) : filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500 text-xs">
                                        No accounts found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-primary-50/30 transition-all group border-l-2 border-transparent hover:border-primary-600">
                                        <td className="py-4 px-6 font-mono text-slate-500 font-black text-[11px] tracking-tight">
                                            #{account.code}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 font-bold text-xs group-hover:text-primary-700 transition-colors uppercase tracking-tight">
                                                    {account.name}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Reference Ledger Item</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1 h-3 rounded-full 
                                                        ${account.type === 'asset' ? 'bg-emerald-400' : ''}
                                                        ${account.type === 'liability' ? 'bg-amber-400' : ''}
                                                        ${account.type === 'equity' ? 'bg-blue-400' : ''}
                                                        ${account.type === 'income' ? 'bg-indigo-400' : ''}
                                                        ${account.type === 'expense' ? 'bg-rose-400' : ''}
                                                    `} />
                                                <span className={`
                                                        uppercase text-[8px] font-black tracking-[0.2em] px-2 py-0.5 rounded-sm border
                                                        ${account.type === 'asset' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                                                        ${account.type === 'liability' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                                                        ${account.type === 'equity' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                                                        ${account.type === 'income' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : ''}
                                                        ${account.type === 'expense' ? 'bg-rose-50 text-rose-700 border-rose-100' : ''}
                                                    `}>
                                                    {account.type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono font-black text-slate-900 text-xs tracking-tighter">
                                            {Number(account.balance).toLocaleString('en-IN', {
                                                style: 'currency',
                                                currency: 'INR',
                                                minimumFractionDigits: 2
                                            })}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${account.isActive ? 'bg-emerald-500 shadow-pulse-emerald' : 'bg-slate-300'}`} />
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${account.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {account.isActive ? 'Verified' : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Account Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-black uppercase text-gray-900">Add New Account</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[9px] font-black uppercase text-gray-500 mb-1.5">
                                    Account Type
                                </label>
                                <select
                                    className="ent-input w-full"
                                    value={newAccount.type}
                                    onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                                >
                                    <option value="asset">Asset</option>
                                    <option value="liability">Liability</option>
                                    <option value="equity">Equity</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-gray-500 mb-1.5">
                                        Account Code
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="ent-input w-full"
                                        placeholder="e.g. 1005"
                                        value={newAccount.code}
                                        onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-gray-500 mb-1.5">
                                        Account Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="ent-input w-full"
                                        placeholder="e.g. Petty Cash"
                                        value={newAccount.name}
                                        onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
