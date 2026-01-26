
'use client';

import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

export default function ProjectFinancials() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Financial Ledger</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budgeting & Expense Tracking</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="ent-card p-6 border-t-4 border-t-emerald-500">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Invoiced</h3>
                    <p className="text-3xl font-black text-gray-900">$0.00</p>
                </div>
                <div className="ent-card p-6 border-t-4 border-t-rose-500">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Expenses</h3>
                    <p className="text-3xl font-black text-gray-900">$0.00</p>
                </div>
                <div className="ent-card p-6 border-t-4 border-t-blue-500">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Remaining Budget</h3>
                    <p className="text-3xl font-black text-gray-900">$0.00</p>
                </div>
            </div>

            <div className="ent-card p-12 text-center border-dashed">
                <Wallet className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-sm font-black text-gray-900 uppercase">No Financial Transactions</h3>
                <p className="text-xs text-gray-500 mt-2">
                    Invoices and expenses linked to this project will appear here automatically.
                </p>
            </div>
        </div>
    )
}
