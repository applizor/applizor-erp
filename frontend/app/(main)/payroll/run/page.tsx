'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';

import { payrollApi } from '@/lib/api/payroll';
import { PermissionGuard } from '@/components/PermissionGuard';

export default function RunPayrollPage() {
    const toast = useToast();
    const router = useRouter();
    const { can, user } = usePermission();

    const [month, setMonth] = useState(new Date().getMonth() + 1); // Current month
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Page Level Security
    // If we are still loading user, maybe show loading? useAuth handles that but usePermission just exposes user.
    // If user is loaded and no permission, show AccessDenied.
    if (user && !can('Payroll', 'create')) {
        return <AccessDenied />;
    }

    const handleProcess = async () => {
        try {
            setLoading(true);
            const data = await payrollApi.process({ month, year });
            setResult(data);
            toast.success(`Payroll processed successfully for ${data.payrolls.length} employees!`);
            // router.push('/payroll/payslips');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to process payroll');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Run Payroll</h1>

                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <p className="text-gray-600 mb-6">
                        Select the month and year to process payroll for all active employees.
                        This calculation will consider:
                        <ul className="list-disc ml-5 mt-2">
                            <li>Active Salary Structures</li>
                            <li>Attendance Records (LOP calculation)</li>
                            <li>Defined Earnings & Deductions</li>
                        </ul>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Month</label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Year</label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border"
                            />
                        </div>

                        <div className="flex items-end">
                            <PermissionGuard module="Payroll" action="create">
                                <button
                                    onClick={handleProcess}
                                    disabled={loading}
                                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Run Payroll'}
                                </button>
                            </PermissionGuard>
                        </div>
                    </div>
                </div>

                {result && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Summary</h3>
                        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">
                                        Successfully processed payroll for {result.payrolls.length} employees.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Gross
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Deductions
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Net Salary
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {result.payrolls.map((payroll: any) => (
                                        <tr key={payroll.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {/* Requires backend to return employee name in nested object which we ensured in controller? No wait, processPayroll returns payroll object which MIGHT verify if we included employee details in the response or just the payroll record. 
                                                Let's check controller line 216: res.json({ message, payrolls }) 
                                                The upsert returns the Payroll object. It does NOT include relation unless we explicitly include it in the result query or the return of upsert (Prisma upsert returns just the model by default unless include is specified). 
                                                The controller `processPayroll` upsert logic lines 180-211 DOES NOT use `include`. 
                                                So `payroll.employee` will be undefined here. 
                                                Correction needed in controller OR frontend needs to just show IDs or fetch list.
                                                Actually, displaying ID is fine for MVP or I can refactor controller. 
                                                Let's just show Employee ID for now or Refactor controller to return Employee details. Refactoring controller is better UX. */}
                                                EMP-{payroll.employeeId.substring(0, 8)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {Number(payroll.grossSalary).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-red-600">
                                                {Number(payroll.deductions).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                                {Number(payroll.netSalary).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
