'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { employeesApi } from '@/lib/api/hrms';
import { payrollApi } from '@/lib/api/payroll';
import { Users, Search, ChevronRight, Edit, Calculator, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/context/CurrencyContext';

export default function SalaryStructureListPage() {
    const toast = useToast();
    const { formatCurrency } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<any[]>([]);
    const [structures, setStructures] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [emps, structs] = await Promise.all([
                employeesApi.getAll(),
                api.get('/payroll/structures').then(res => res.data).catch(() => [])
            ]);
            setEmployees(emps);
            setStructures(structs);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    const getStructureForEmployee = (empId: string) => {
        return structures.find(s => s.employeeId === empId);
    };

    return (
        <div className="space-y-6">
            {/* Page Header (Compact) */}
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-md border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-900 rounded-md flex items-center justify-center shadow-md">
                        <Calculator size={16} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Structure Administration</h2>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Remuneration Architecture Registry</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{employees.length} Personnel</span>
                    </div>
                </div>
            </div>

            {/* Registry Search */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-md border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                    <Search size={14} className="text-slate-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Personnel Search</span>
                </div>
                <input
                    type="text"
                    placeholder="LOCATE EMPLOYEE BY NAME, ID OR DEPARTMENT..."
                    className="flex-1 bg-transparent border-none text-[10px] font-bold uppercase tracking-wider placeholder-slate-300 focus:ring-0"
                />
            </div>

            {/* Data Grid */}
            <div className="ent-card overflow-hidden">
                <table className="ent-table">
                    <thead>
                        <tr>
                            <th>Employee Identity</th>
                            <th>Department & Position</th>
                            <th>Current CTC</th>
                            <th>Monthly Net (Est)</th>
                            <th className="text-right">Architecture</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && employees.length === 0 ? (
                            <TableRowSkeleton columns={5} rows={5} />
                        ) : employees.map((emp) => {
                            const struct = getStructureForEmployee(emp.id);
                            return (
                                <tr key={emp.id} className="group hover:bg-primary-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-100 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                                {emp.firstName[0]}
                                            </div>
                                            <div>
                                                <div className="text-[12px] font-black text-slate-900 tracking-tight leading-none uppercase">
                                                    {emp.firstName} {emp.lastName}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                                                    EMP ID: {emp.employeeId || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div>
                                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                                                {emp.department?.name || 'GEN'}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                                                {emp.position?.title || 'GENERAL'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {struct ? (
                                            <div className="text-[11px] font-black text-slate-900">
                                                {formatCurrency(Number(struct.ctc))}
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-black text-slate-300 uppercase italic">Not Configured</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {struct ? (
                                            <div className="text-[11px] font-black text-emerald-600">
                                                {formatCurrency(Number(struct.netSalary))}
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-black text-slate-300 uppercase italic">---</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link
                                            href={`/payroll/structure/${emp.id}`}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-md border border-slate-100 hover:bg-primary-900 hover:text-white hover:border-primary-900 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                                        >
                                            <Edit size={12} /> {struct ? 'Modify' : 'Initialize'}
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import api from '@/lib/api';
