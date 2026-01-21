'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';

import { payrollApi, Payroll } from '@/lib/api/payroll';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import { FileText, Activity, ChevronRight, LayoutGrid, Search, Filter, Download, CheckCircle, Plus } from 'lucide-react';

export default function PayslipsPage() {
    const toast = useToast();
    const { formatCurrency } = useCurrency();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);

    useEffect(() => {
        loadPayrolls();
    }, [month, year]);

    const loadPayrolls = async () => {
        try {
            setLoading(true);
            const data = await payrollApi.getList(month, year);
            setPayrolls(data);
        } catch (error) {
            console.error('Failed to load payrolls:', error);
            toast.error('Ledger sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await payrollApi.approve(id);
            toast.success('Remuneration validated and committed');
            loadPayrolls();
        } catch (error) {
            console.error(error);
            toast.error('Validation protocol failed');
        }
    };

    const handleDownload = async (id: string) => {
        try {
            const response = await payrollApi.downloadPayslip(id);
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `REMUNERATION_MANIFEST_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
            toast.error('Manifest download failed');
        }
    };

    return (
        <div className="space-y-6">
            {/* Semantic Header Component */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-900 rounded-lg shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Remuneration Ledger</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            Historical Disbursement Registry <ChevronRight size={10} className="text-primary-600" /> System Records
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <Activity size={12} />
                        <span>Registry Count: {payrolls.length}</span>
                    </div>
                    <Link href="/payroll/run">
                        <button className="px-4 py-2 bg-primary-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-lg shadow-primary-900/10 flex items-center gap-2 transition-all">
                            <Plus size={14} /> Initialize Batch
                        </button>
                    </Link>
                </div>
            </div>

            <div className="mx-2 mb-6">
                <div className="ent-card p-4 border-primary-100/50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="ent-form-group mb-0">
                            <label className="text-[9px] font-black text-primary-600 mb-1.5 uppercase tracking-widest">Pay Period (Month)</label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="ent-input w-full p-2.5 text-[11px] font-black tracking-widest uppercase cursor-pointer"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' }).toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="ent-form-group mb-0">
                            <label className="text-[9px] font-black text-primary-600 mb-1.5 uppercase tracking-widest">Pay Period (Year)</label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="ent-input w-full p-2.5 text-[11px] font-black tracking-widest"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input type="text" placeholder="FILTER BY RESOURCE ID OR NAME..." className="ent-input w-full py-2.5 pl-9 pr-3 text-[10px] font-black uppercase tracking-widest" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-2">
                <div className="ent-card overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center animate-pulse">
                            <LoadingSpinner size="lg" />
                            <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronizing Ledger Intelligence...</p>
                        </div>
                    ) : payrolls.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center opacity-40">
                            <LayoutGrid size={40} className="text-gray-300 mb-4" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Zero disbursement records detected in current period</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="ent-table">
                                <thead>
                                    <tr>
                                        <th>Resource Identity</th>
                                        <th>Division Assignment</th>
                                        <th>Gross Asset Value</th>
                                        <th>Statutory Deductions</th>
                                        <th>Net Remuneration</th>
                                        <th>Operational Status</th>
                                        <th className="text-right">Action Protocol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payrolls.map((payroll) => (
                                        <tr key={payroll.id}>
                                            <td className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-black text-[10px] text-gray-500 border border-gray-200 uppercase">
                                                    {payroll.employee.firstName[0]}
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-black text-gray-900 uppercase leading-none">
                                                        {payroll.employee.firstName} {payroll.employee.lastName}
                                                    </div>
                                                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{payroll.employee.employeeId}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                    {payroll.employee.department?.name || 'GENERIC'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-[11px] font-black text-gray-900">
                                                    {formatCurrency(payroll.grossSalary)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 inline-block uppercase">
                                                    -{formatCurrency(payroll.totalDeductions)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-[12px] font-black text-primary-600 tracking-tight">
                                                    {formatCurrency(payroll.netSalary)}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`ent-badge ${payroll.status === 'paid' ? 'ent-badge-success' : 'ent-badge-warning'
                                                    }`}>
                                                    {payroll.status?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex justify-end gap-3 px-2">
                                                    {payroll.status === 'draft' && (
                                                        <button
                                                            onClick={() => handleApprove(payroll.id)}
                                                            className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.15em] hover:text-emerald-700 transition-all flex items-center gap-1.5"
                                                        >
                                                            <CheckCircle size={12} /> Validate & Commit
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDownload(payroll.id)}
                                                        className="text-[9px] font-black text-primary-600 uppercase tracking-[0.15em] hover:text-primary-700 transition-all flex items-center gap-1.5"
                                                    >
                                                        <Download size={12} /> Download Manifest
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
