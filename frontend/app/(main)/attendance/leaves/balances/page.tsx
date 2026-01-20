'use client';

import { useEffect, useState } from 'react';
import { leavesApi } from '@/lib/api/attendance';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';
import { LeaveBalanceCards } from '@/components/attendance/LeaveBalanceCards';
import { Search } from 'lucide-react';

export default function AllBalancesPage() {
    const { can } = usePermission();
    const [balances, setBalances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        employeeId: '',
        departmentId: '',
        year: new Date().getFullYear()
    });

    // We might need dept/employee lists for filters, but for now let's load all

    useEffect(() => {
        loadData();
    }, []); // Load data on mount

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

    // Group Balances by Employee for better display
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

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Leave Balances</h2>
                    <p className="text-sm text-gray-500">Overview of all employee leave quotas</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={loadData} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="space-y-8">
                    {Object.values(groupedBalances).map((group: any) => (
                        <div key={group.employee.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center mb-4 pb-4 border-b border-gray-100">
                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3">
                                    {group.employee.firstName[0]}{group.employee.lastName[0]}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{group.employee.firstName} {group.employee.lastName}</h3>
                                    <p className="text-sm text-gray-500">{group.employee.department?.name || 'No Department'} • {group.employee.employeeId}</p>
                                </div>
                            </div>

                            <LeaveBalanceCards balances={group.balances} loading={false} />
                        </div>
                    ))}

                    {Object.keys(groupedBalances).length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No balances found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
