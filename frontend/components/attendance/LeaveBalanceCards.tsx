import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface LeaveBalance {
    id: string;
    leaveType: {
        id: string;
        name: string;
        days: number;
        color: string;
        accrualType?: string;
        accrualRate?: number;
    };
    used: number;
    pending: number;
    remaining: number;
}

interface LeaveBalanceCardsProps {
    balances: LeaveBalance[];
    loading: boolean;
}

export const LeaveBalanceCards: React.FC<LeaveBalanceCardsProps> = ({ balances, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white p-3 rounded border border-gray-100 animate-pulse">
                        <div className="h-3 bg-gray-100 rounded w-16 mb-2"></div>
                        <div className="flex justify-between items-end">
                            <div className="h-6 bg-gray-100 rounded w-10"></div>
                            <div className="h-3 bg-gray-100 rounded w-8"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (balances.length === 0) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center text-slate-600 text-xs font-medium">
                <AlertCircle size={14} className="mr-2" />
                <span>No active leave allocations found.</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {balances.map((balance: any) => {
                const total = balance.total ?? balance.leaveType.days;
                const color = balance.leaveType?.color || '#3B82F6';
                const usedPercentage = total > 0 ? ((total - balance.remaining) / total) * 100 : 0;

                return (
                    <div key={balance.id} className="relative bg-white border border-gray-100 rounded p-3 hover:border-primary-200 transition-colors group overflow-hidden">
                        <div
                            className="absolute top-0 left-0 bottom-0 w-1"
                            style={{ backgroundColor: color }}
                        ></div>

                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[120px]">
                                    {balance.leaveType?.name || 'Unknown'}
                                </h3>
                                {balance.leaveType?.accrualRate > 0 && (
                                    <span className="ent-badge bg-blue-50 text-blue-700 border-blue-100 text-[9px] px-1 py-0 shadow-sm">
                                        +{balance.leaveType.accrualRate}/{balance.leaveType.accrualType === 'monthly' ? 'MO' : 'DAY'}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-baseline justify-between">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-gray-900 leading-none">
                                        {balance.remaining}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400">/ {total}</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500">DAYS REMAINING</span>
                            </div>

                            <div className="w-full bg-gray-100 rounded-full h-1 mt-1 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${Math.min(usedPercentage, 100)}%`,
                                        backgroundColor: color
                                    }}
                                ></div>
                            </div>

                            <div className="flex justify-between text-[9px] font-bold tracking-tight text-gray-500 mt-1 uppercase">
                                <div className="flex gap-2">
                                    <span>Used: <span className="text-gray-900">{balance.used}</span></span>
                                    {balance.pending > 0 && (
                                        <span className="text-amber-600">Pending: {balance.pending}</span>
                                    )}
                                </div>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary-600">Details</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
