import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface LeaveBalance {
    id: string;
    leaveType: {
        id: string;
        name: string;
        days: number;
        color: string;
    };
    used: number;
    pending: number;
    remaining: number; // dynamically calculated or from DB
}

interface LeaveBalanceCardsProps {
    balances: LeaveBalance[];
    loading: boolean;
}

export const LeaveBalanceCards: React.FC<LeaveBalanceCardsProps> = ({ balances, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                        <div className="flex justify-between items-end">
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                            <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (balances.length === 0) {
        return (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex items-center text-blue-800">
                <AlertCircle size={20} className="mr-2" />
                <span>No leave balances found. Please contact HR to initialize your leave quota.</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {balances.map((balance: any) => {
                const total = balance.total ?? balance.leaveType.days;
                // Note: Actual 'Total' might be stored in balance record if it includes carry forward.
                // Assuming 'remaining' is valid.

                // Let's use color from type or default
                const color = balance.leaveType?.color || '#3B82F6';

                // Calculate percentage carefully
                const usedPercentage = total > 0 ? ((total - balance.remaining) / total) * 100 : 0;

                return (
                    <div key={balance.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white via-white to-transparent opacity-50 transform rotate-45 translate-x-8 -translate-y-8 z-0"></div>
                        <div className="relative z-10">
                            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-2">{balance.leaveType?.name || 'Unknown Type'}</h3>
                            <div className="flex items-baseline justify-between mb-1">
                                <div className="flex items-baseline space-x-1">
                                    <span className="text-3xl font-bold text-gray-900">{balance.remaining}</span>
                                    <span className="text-gray-400 text-sm">/ {total}</span>
                                </div>
                                {balance.leaveType?.accrualType !== 'yearly' && balance.leaveType?.accrualRate > 0 && (
                                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold">
                                        +{balance.leaveType.accrualRate}/{balance.leaveType.accrualType === 'monthly' ? 'mo' : 'day'}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(usedPercentage, 100)}%`,
                                        backgroundColor: color
                                    }}
                                ></div>
                            </div>
                            <div className="mt-3 flex justify-between text-xs text-gray-500">
                                <span>Used: <b>{balance.used}</b></span>
                                <span>Pending: <b>{balance.pending}</b></span>
                            </div>
                        </div>
                        <div
                            className="absolute top-0 left-0 w-1 h-full"
                            style={{ backgroundColor: color }}
                        ></div>
                    </div>
                );
            })}
        </div>
    );
};
