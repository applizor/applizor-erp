'use client';

import { useEffect, useState } from 'react';
import { leavesApi } from '@/lib/api/attendance';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';
import { LeaveBalanceCards } from '@/components/hrms/attendance/LeaveBalanceCards';
import { Search, RefreshCw, User, Users, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AllBalancesPage() {
    const { can } = usePermission();
    const [balances, setBalances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        employeeId: '',
        departmentId: '',
        year: new Date().getFullYear()
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await leavesApi.getAllBalances(filters);
            setBalances(data);
        } catch (error) {
            console.error('Failed to load balances:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!can('LeaveBalance', 'read')) {
        return <AccessDenied />;
    }

    const groupedBalances = balances.reduce((acc, curr) => {
        const empId = curr.employee?.id;
        if (!empId) return acc;

        if (!acc[empId]) {
            acc[empId] = {
                employee: curr.employee,
                balances: []
            };
        }
        acc[empId].balances.push(curr);
        return acc;
    }, {} as Record<string, { employee: any, balances: any[] }>);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-600" />
                        Leave Balances Ledger
                    </h2>
                    <p className="text-xs text-gray-500">Global overview of employee leave quotas and consumption</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter by name..."
                            className="pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none w-64"
                        />
                    </div>
                    <button
                        onClick={loadData}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {Object.values(groupedBalances).map((group: any) => (
                    <div key={group.employee.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 p-3 flex items-center justify-between border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {group.employee.firstName[0]}{group.employee.lastName[0]}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">{group.employee.firstName} {group.employee.lastName}</h3>
                                    <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-500 uppercase tracking-tighter">
                                        <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" /> {group.employee.employeeId}</span>
                                        <span>•</span>
                                        <span className="bg-white px-1.5 py-0.5 border border-gray-200 rounded text-gray-600">
                                            {group.employee.department?.name || 'Unassigned'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Cycle: 2024</span>
                            </div>
                        </div>

                        <div className="p-3">
                            <LeaveBalanceCards balances={group.balances} loading={false} />
                        </div>
                    </div>
                ))}

                {Object.keys(groupedBalances).length === 0 && (
                    <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-100 italic text-gray-400 text-sm">
                        No balances found for the current selection.
                    </div>
                )}
            </div>
        </div>
    );
}
