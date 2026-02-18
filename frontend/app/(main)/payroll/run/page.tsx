'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, FileText, CheckCircle, Activity, Briefcase, ChevronRight, LayoutGrid, DollarSign } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';
import { payrollApi } from '@/lib/api/payroll';
import { PermissionGuard } from '@/components/PermissionGuard';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function RunPayrollPage() {
    const toast = useToast();
    const router = useRouter();
    const { can, user } = usePermission();

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    if (user && !can('Payroll', 'create')) {
        return <AccessDenied />;
    }

    const handleProcess = async () => {
        try {
            setLoading(true);
            const data = await payrollApi.process({ month, year });
            setResult(data);
            toast.success(`Batch processed: ${data.payrolls.length} entities synchronized`);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Batch initialization failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header (Compact) */}
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-md border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-900 rounded-md flex items-center justify-center shadow-md">
                        <DollarSign size={16} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Payroll Engine</h2>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">Automated Batch Computation Cycle</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-md text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <Activity size={12} className="text-primary-600" />
                        <span>Calculated: {result?.payrolls.length || 0} Entities</span>
                    </div>
                </div>
            </div>

            <div className="mx-2 mb-8">
                <div className="ent-card p-6 border-primary-100/50 bg-gradient-to-br from-white to-gray-50/50">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-2.5 rounded-md bg-primary-900 text-white">
                            <Clock size={16} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">Batch Parameters</h3>
                            <p className="text-[10px] text-gray-500 font-bold leading-relaxed max-w-2xl italic">
                                Initialize global remuneration synchronization for the specified fiscal period. Operations involve
                                net valuation logic based on active structures, attendance-based LOP, and authorized variances.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                        <div className="ent-form-group">
                            <label className="text-[9px] font-black text-primary-600 mb-1.5 uppercase tracking-widest">Pay Period (Month)</label>
                            <CustomSelect
                                options={Array.from({ length: 12 }, (_, i) => ({
                                    label: new Date(0, i).toLocaleString('default', { month: 'long' }).toUpperCase(),
                                    value: String(i + 1)
                                }))}
                                value={String(month)}
                                onChange={(val) => setMonth(Number(val))}
                                className="w-full"
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="text-[9px] font-black text-primary-600 mb-1.5 uppercase tracking-widest">Pay Period (Year)</label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="ent-input w-full p-2.5 text-[11px] font-black tracking-widest"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <PermissionGuard module="Payroll" action="create">
                                <button
                                    onClick={handleProcess}
                                    disabled={loading}
                                    className="w-full h-[41px] bg-primary-900 text-white rounded-md font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary-900/10 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <LoadingSpinner size="sm" />
                                            <span>Processing Batch...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileText size={16} />
                                            <span>Initialize Batch Protocol</span>
                                        </>
                                    )}
                                </button>
                            </PermissionGuard>
                        </div>
                    </div>
                </div>
            </div>

            {result && (
                <div className="mx-2 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="ent-card overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Activity size={12} className="text-primary-600" />
                                Execution Summary: {result.payrolls.length} Recognized Entities
                            </h3>
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-100 flex items-center gap-2 uppercase tracking-widest">
                                <CheckCircle size={14} />
                                Protocol Verified
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="ent-table">
                                <thead>
                                    <tr>
                                        <th>Resource Entity</th>
                                        <th className="text-center">LOP Days</th>
                                        <th>Gross Asset Value</th>
                                        <th>Statutory Deductions</th>
                                        <th>Net Remuneration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.payrolls.map((payroll: any) => (
                                        <tr key={payroll.id}>
                                            <td className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center font-black text-[10px] text-gray-400 border border-gray-200 uppercase">
                                                    ID
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-black text-gray-900 uppercase">
                                                        EMP-{payroll.employeeId.slice(0, 8).toUpperCase()}
                                                    </div>
                                                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">System ID: {payroll.id.slice(-6).toUpperCase()}</div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className={`text-[11px] font-black ${payroll.absentDays > 0 ? 'text-rose-600 bg-rose-50' : 'text-gray-400 bg-gray-50'} px-2 py-0.5 rounded-md inline-block border border-transparent`}>
                                                    {payroll.absentDays || 0}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-[11px] font-black text-gray-900">
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(payroll.grossSalary))}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 inline-block uppercase">
                                                    -{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(payroll.deductions))}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-[12px] font-black text-primary-600 tracking-tight">
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(payroll.netSalary))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
