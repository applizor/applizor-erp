'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { employeesApi, departmentsApi, Employee, Department } from '@/lib/api/hrms';
import { PermissionGuard } from '@/components/PermissionGuard';
import { usePermission } from '@/hooks/usePermission';

export default function EmployeesPage() {
    const toast = useToast();
    const router = useRouter();
    const { can, user } = usePermission();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [redirecting, setRedirecting] = useState(false);
    const [filters, setFilters] = useState({
        departmentId: '',
        status: ''
    });

    useEffect(() => {
        checkAccessAndRedirect();
    }, [user]);

    useEffect(() => {
        if (!redirecting) {
            loadData();
        }
    }, [filters, redirecting]);

    const checkAccessAndRedirect = async () => {
        if (!user) return;

        // Check if user has only "owned" read access
        const permissions = user.permissions?.['Employee'];
        const hasOwnedAccess = permissions?.readLevel === 'owned';

        if (hasOwnedAccess) {
            // Find employee record for current user and redirect
            setRedirecting(true);
            try {
                const employees = await employeesApi.getAll();
                if (employees.length > 0) {
                    // Should only return one employee (their own)
                    router.push(`/hrms/employees/${employees[0].id}`);
                } else {
                    // No employee record found
                    setRedirecting(false);
                }
            } catch (error) {
                console.error('Failed to fetch employee:', error);
                setRedirecting(false);
            }
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [empData, deptData] = await Promise.all([
                employeesApi.getAll(filters.departmentId || filters.status ? filters : undefined),
                departmentsApi.getAll()
            ]);
            setEmployees(empData);
            setDepartments(deptData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        try {
            await employeesApi.delete(id);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete employee');
        }
    };

    if (redirecting) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-medium text-gray-900">Employees</h2>
                    <select
                        value={filters.departmentId}
                        onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                        className="border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on-leave">On Leave</option>
                        <option value="terminated">Terminated</option>
                    </select>
                </div>
                <PermissionGuard module="Employee" action="create">
                    <Link
                        href="/hrms/employees/new"
                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm"
                    >
                        + Add Employee
                    </Link>
                </PermissionGuard>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : employees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No employees found.</div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {employees.map((emp) => (
                            <li key={emp.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-4">
                                        {emp.firstName[0]}{emp.lastName[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-md font-medium text-gray-900">{emp.firstName} {emp.lastName}</h3>
                                        <p className="text-sm text-gray-500">
                                            {emp.position?.title} • {emp.department?.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {emp.email} • {emp.phone}
                                        </p>
                                        {(emp.employmentType || emp.hourlyRate) && (
                                            <p className="text-xs text-primary-600 mt-1">
                                                {emp.employmentType} {emp.hourlyRate ? `• $${emp.hourlyRate}/hr` : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex flex-col items-end space-y-1">
                                        <span className={`px-2 py-1 text-xs rounded-full ${emp.status === 'active' ? 'bg-green-100 text-green-800' :
                                            emp.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                                emp.status === 'on-leave' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {emp.status}
                                        </span>
                                        {/* Check for User Account */}
                                        {emp.userId && (
                                            <span className="px-2 py-0.5 text-[10px] border border-blue-200 text-blue-600 rounded-full bg-blue-50">
                                                Portal Access
                                            </span>
                                        )}
                                        {/* Check for Admin Role (Optional, requires matching logic to backend/frontend type) */}
                                        {/* @ts-ignore */}
                                        {emp.user?.roles?.some(r => r.role?.isSystem) && (
                                            <span className="px-2 py-0.5 text-[10px] border border-purple-200 text-purple-600 rounded-full bg-purple-50">
                                                System Admin
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Link
                                            href={`/hrms/employees/${emp.id}`}
                                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                                        >
                                            View
                                        </Link>
                                        {/* Only show delete button if:
                                            1. User has delete permission AND
                                            2. Not viewing their own employee record */}
                                        {can('Employee', 'delete') && emp.userId !== user?.id && (
                                            <button
                                                onClick={() => handleDelete(emp.id)}
                                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
