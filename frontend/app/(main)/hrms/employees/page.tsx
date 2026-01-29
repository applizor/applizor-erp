'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { employeesApi, departmentsApi, Employee, Department } from '@/lib/api/hrms';
import { PermissionGuard } from '@/components/PermissionGuard';
import { usePermission } from '@/hooks/usePermission';
import { Plus, Users, Clock, Zap, Search, Filter, Trash2, UserPlus, Fingerprint, Shield } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmployeeListSkeleton } from '@/components/hrms/EmployeeListSkeleton';
import PageHeader from '@/components/ui/PageHeader';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function EmployeesPage() {
    const toast = useToast();
    const router = useRouter();
    const { can, user, getScope } = usePermission();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [redirecting, setRedirecting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
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

        const readScope = getScope('Employee', 'read');
        const hasOwnedAccess = readScope === 'owned';

        // Check if user is Admin - they should see the list
        const isAdmin = user.roles?.some(r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'administrator');

        // If not admin and has owned access (or restricted), redirect
        if (!isAdmin && hasOwnedAccess) {
            setRedirecting(true);
            try {
                // Fetch only pertinent records (managed by backend perms)
                const employees = await employeesApi.getAll();

                // Find the employee record linked to this user
                // Fallback to first record if owned scope works correctly on backend (returns only 1)
                const mySemployee = employees.find((e: Employee) => e.userId === user.id) || employees[0];

                if (mySemployee) {
                    router.push(`/hrms/employees/${mySemployee.id}`);
                } else {
                    // If no employee record found for this user, assume they are a system user without profile
                    // Stop redirecting to show empty list or they can create one if allowed
                    setRedirecting(false);
                }
            } catch (error) {
                console.error('Failed to fetch employee for redirect:', error);
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
            toast.error('Data synchronization failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await employeesApi.delete(showDeleteConfirm);
            toast.success('Resource purged from registry');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Purge sequence failed');
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    if (redirecting) {
        return (
            <div className="flex items-center justify-center p-24">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accessing Node Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Contextual Header */}
            <PageHeader
                title="Resource Directory"
                subtitle="Global Human Capital Intelligence Matrix"
                icon={Users}
                actions={
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <div className="flex-1 lg:w-64 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="QUERY RESOURCE..."
                                className="ent-input w-full pl-9 py-1.5 text-[10px] font-black tracking-widest"
                            />
                        </div>
                        <PermissionGuard module="Employee" action="create">
                            <Link
                                href="/hrms/employees/new"
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus size={14} /> Register Resource
                            </Link>
                        </PermissionGuard>
                    </div>
                }
            />

            {/* Logical Filtration Schema */}
            <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-md border border-gray-100">
                <div className="flex items-center gap-2 px-2 text-gray-400">
                    <Filter size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Refinement:</span>
                </div>
                <CustomSelect
                    options={[
                        { label: 'Division Schema', value: '' },
                        ...departments.map(dept => ({ label: dept.name, value: dept.id }))
                    ]}
                    value={filters.departmentId}
                    onChange={(val) => setFilters({ ...filters, departmentId: val })}
                    className="min-w-[160px]"
                />

                <CustomSelect
                    options={[
                        { label: 'Engagement Status', value: '' },
                        { label: 'Active Duty', value: 'active' },
                        { label: 'On Sabbatical', value: 'on-leave' },
                        { label: 'Inactive Cache', value: 'inactive' },
                        { label: 'Terminated', value: 'terminated' }
                    ]}
                    value={filters.status}
                    onChange={(val) => setFilters({ ...filters, status: val })}
                    className="min-w-[160px]"
                />

                <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-md shadow-sm">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Nodes:</span>
                    <span className="text-[10px] font-black text-primary-600">{employees.filter(e => e.status === 'active').length}</span>
                </div>
            </div>

            {loading ? (
                <EmployeeListSkeleton />
            ) : employees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-gray-50/30 rounded-md border border-dashed border-gray-200">
                    <Users className="w-8 h-8 text-gray-300 mb-3" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Zero Resources Detected in Lifecycle</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {employees.map((emp) => (
                        <div key={emp.id} className="ent-card group relative p-4 bg-white hover:border-primary-200 hover:shadow-lg transition-all">
                            {/* Identifier Protocol */}
                            <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    emp.status === 'on-leave' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        'bg-gray-50 text-gray-500 border-gray-200'
                                    }`}>
                                    {emp.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-11 w-11 rounded-md bg-primary-900 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-primary-900/20 group-hover:scale-105 transition-transform uppercase">
                                    {emp.firstName[0]}{emp.lastName[0]}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-sm font-black text-gray-900 tracking-tight leading-none truncate mb-1">
                                        {emp.firstName} {emp.lastName}
                                    </h3>
                                    <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest truncate">
                                        {emp.id.slice(-8).toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4 bg-gray-50/50 p-2.5 rounded-md border border-gray-100/50">
                                <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                                    <span className="flex items-center gap-1.5"><Shield className="w-2.5 h-2.5" /> Division</span>
                                    <span className="text-gray-900">{emp.department?.name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                                    <span className="flex items-center gap-1.5"><Zap className="w-2.5 h-2.5" /> Designation</span>
                                    <span className="text-gray-900 truncate max-w-[120px] text-right">{emp.position?.title || 'UNASSIGNED'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                                    <span className="flex items-center gap-1.5"><Fingerprint className="w-2.5 h-2.5" /> Type</span>
                                    <span className="text-gray-900">{emp.employmentType}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={`/hrms/employees/${emp.id}`}
                                        className="text-[9px] font-black text-primary-600 hover:text-primary-800 uppercase tracking-widest transition-all hover:translate-x-0.5"
                                    >
                                        Inspect Resource
                                    </Link>
                                    {can('Employee', 'delete') && emp.userId !== user?.id && (
                                        <button
                                            onClick={() => setShowDeleteConfirm(emp.id)}
                                            className="text-[9px] font-black text-gray-300 hover:text-rose-600 uppercase tracking-widest transition-colors"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                                {emp.userId && (
                                    <div className="p-1 bg-sky-50 rounded-md text-sky-600 border border-sky-100" title="System Observer Profile Enabled">
                                        <Shield size={10} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Confirm Resource Deletion"
                message="This will decouple the resource from all organizational nodes. This action is irreversible."
                type="danger"
                confirmText="Confirm Delete"
            />
        </div>
    );
}
