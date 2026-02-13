'use client';

import { useState, useEffect } from 'react';
import { accountingApi, LedgerAccount } from '@/lib/api/accounting';
import { BookOpen, Plus, Search } from 'lucide-react';
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
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={14} />
                        Add Account
                    </button>
                </div>
            </div>

            {/* Accounts Table */}
            <div className="ent-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="ent-table w-full">
                        <thead>
                            <tr>
                                <th className="text-left">Code</th>
                                <th className="text-left">Account Name</th>
                                <th className="text-left">Type</th>
                                <th className="text-right">Balance</th>
                                <th className="text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
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
                                    <tr key={account.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="font-mono text-gray-600 font-bold">
                                            {account.code}
                                        </td>
                                        <td className="text-gray-900 font-bold">
                                            {account.name}
                                        </td>
                                        <td>
                                            <span className={`
                                                uppercase text-[9px] font-black tracking-wider px-2 py-1 rounded-sm
                                                ${account.type === 'asset' ? 'bg-emerald-100 text-emerald-700' : ''}
                                                ${account.type === 'liability' ? 'bg-amber-100 text-amber-700' : ''}
                                                ${account.type === 'equity' ? 'bg-blue-100 text-blue-700' : ''}
                                                ${account.type === 'income' ? 'bg-indigo-100 text-indigo-700' : ''}
                                                ${account.type === 'expense' ? 'bg-rose-100 text-rose-700' : ''}
                                            `}>
                                                {account.type}
                                            </span>
                                        </td>
                                        <td className="text-right font-mono text-gray-700">
                                            {Number(account.balance).toLocaleString('en-IN', {
                                                style: 'currency',
                                                currency: 'INR'
                                            })}
                                        </td>
                                        <td className="text-center">
                                            <div className={`w-2 h-2 rounded-full mx-auto ${account.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
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
