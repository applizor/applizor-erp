'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { payrollApi, SalaryComponent, EmployeeSalaryStructure } from '@/lib/api/payroll';
import { employeesApi } from '@/lib/api/hrms';
import { DollarSign, Activity, ChevronRight, Briefcase, Calculator, Save, ArrowLeft } from 'lucide-react';

import Link from 'next/link';

export default function SalaryStructurePage({ params }: { params: { employeeId: string } }) {
    const toast = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [employee, setEmployee] = useState<any>(null);
    const [components, setComponents] = useState<SalaryComponent[]>([]);

    const [ctc, setCtc] = useState<number>(0);
    const [breakdown, setBreakdown] = useState<Record<string, number>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [emp, comps, struct] = await Promise.all([
                employeesApi.getById(params.employeeId),
                payrollApi.getComponents(),
                payrollApi.getStructure(params.employeeId).catch(() => null)
            ]);

            setEmployee(emp);
            setComponents(comps);

            if (struct) {
                setCtc(Number(struct.ctc));
                const mapping: any = {};
                struct.components.forEach((c: any) => mapping[c.componentId] = Number(c.monthlyAmount));
                setBreakdown(mapping);
            }
        } catch (error) {
            console.error('Load error:', error);
            toast.error('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoCalculate = () => {
        if (!ctc) return;
        const monthlyCtc = ctc / 12;

        const basic = monthlyCtc * 0.5;
        const hra = basic * 0.5;

        const basicComp = components.find(c => c.name.toLowerCase().includes('basic'));
        const hraComp = components.find(c => c.name.toLowerCase().includes('hra'));
        const specialComp = components.find(c => c.name.toLowerCase().includes('special') || c.name.toLowerCase().includes('allowance'));

        const newBreakdown: any = { ...breakdown };
        let allocated = 0;

        if (basicComp) {
            newBreakdown[basicComp.id] = basic;
            allocated += basic;
        }
        if (hraComp) {
            newBreakdown[hraComp.id] = hra;
            allocated += hra;
        }

        const pfComp = components.find(c => c.type === 'deduction' && c.name.toLowerCase().includes('pf'));
        if (pfComp && basicComp) {
            const pf = basic * 0.12;
            newBreakdown[pfComp.id] = pf;
        }

        if (specialComp) {
            const balance = monthlyCtc - allocated;
            newBreakdown[specialComp.id] = balance > 0 ? balance : 0;
        }

        setBreakdown(newBreakdown);
        toast.success('Protocol auto-calculated');
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            let gross = 0;
            let deductions = 0;

            const componentList = Object.entries(breakdown).map(([compId, amount]) => {
                const comp = components.find(c => c.id === compId);
                if (comp) {
                    if (comp.type === 'earning') gross += amount;
                    if (comp.type === 'deduction') deductions += amount;
                }
                return { componentId: compId, amount };
            });

            await payrollApi.saveStructure(params.employeeId, {
                ctc,
                netSalary: gross - deductions,
                components: componentList
            });

            toast.success('Architecture committed to registry');
            router.push('/hrms/employees');
        } catch (error) {
            toast.error('Failed to commit configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center animate-pulse">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Architectural Discovery in progress...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-900 rounded-lg shadow-lg">
                        <Calculator className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Salary Architecture</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            Compensational Protocol for <span className="text-primary-600 font-black">{employee?.firstName} {employee?.lastName}</span>
                        </p>
                    </div>
                </div>

                <Link href="/hrms/employees">
                    <button className="flex items-center gap-2 py-2 px-4 rounded font-black text-[10px] text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-all">
                        <ArrowLeft size={14} /> Global Registry
                    </button>
                </Link>
            </div>

            <div className="ent-card p-8 bg-gradient-to-br from-white to-gray-50/30">
                <div className="mb-10 space-y-2">
                    <label className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2">
                        <DollarSign size={12} /> Annualized Cost to Company (CTC) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-4">
                        <div className="relative flex-1 group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-[10px] tracking-wider uppercase">VALUATION</span>
                            <input
                                type="number"
                                value={ctc}
                                onChange={(e) => setCtc(Number(e.target.value))}
                                className="ent-input w-full pl-24 h-14 text-2xl font-black tracking-tighter border-2 border-gray-200 focus:border-primary-500 transition-all rounded-xl shadow-inner bg-white/50"
                                placeholder="0.00"
                            />
                        </div>
                        <button
                            onClick={handleAutoCalculate}
                            className="px-8 bg-white border border-gray-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-primary-500 hover:text-primary-600 text-gray-500 shadow-sm transition-all flex items-center gap-3 active:scale-95"
                        >
                            <Calculator size={16} /> Intelligent Auto-Allocation
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-3 border-b border-emerald-100/50">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                            <h3 className="text-[11px] font-black text-emerald-800 uppercase tracking-[0.2em]">Earning Components</h3>
                        </div>
                        <div className="space-y-5">
                            {components.filter(c => c.type === 'earning').map(comp => (
                                <div key={comp.id} className="ent-form-group">
                                    <label className="text-[9px] font-black text-gray-500 mb-1.5 uppercase tracking-widest px-1">{comp.name}</label>
                                    <input
                                        type="number"
                                        value={breakdown[comp.id] || 0}
                                        onChange={(e) => setBreakdown({ ...breakdown, [comp.id]: Number(e.target.value) })}
                                        className="ent-input w-full p-2.5 text-[12px] font-black tracking-tight"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-3 border-b border-rose-100/50">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/20" />
                            <h3 className="text-[11px] font-black text-rose-800 uppercase tracking-[0.2em]">Deduction Components</h3>
                        </div>
                        <div className="space-y-5">
                            {components.filter(c => c.type === 'deduction').map(comp => (
                                <div key={comp.id} className="ent-form-group">
                                    <label className="text-[9px] font-black text-gray-500 mb-1.5 uppercase tracking-widest px-1">{comp.name}</label>
                                    <input
                                        type="number"
                                        value={breakdown[comp.id] || 0}
                                        onChange={(e) => setBreakdown({ ...breakdown, [comp.id]: Number(e.target.value) })}
                                        className="ent-input w-full p-2.5 text-[12px] font-black tracking-tight"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-14 bg-primary-900 rounded-2xl border border-black p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl shadow-primary-900/20">
                    <div className="flex gap-12">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-primary-400 uppercase tracking-[0.2em]">Gross Value (Monthly)</p>
                            <p className="text-2xl font-black text-white tracking-tighter">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Object.entries(breakdown).reduce((sum, [id, val]) => {
                                    const c = components.find(x => x.id === id);
                                    return c?.type === 'earning' ? sum + val : sum;
                                }, 0))}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Net Liquidity (Take-Home)</p>
                            <p className="text-2xl font-black text-emerald-400 tracking-tighter">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Object.entries(breakdown).reduce((sum, [id, val]) => {
                                    const c = components.find(x => x.id === id);
                                    return c?.type === 'earning' ? sum + val : sum - val;
                                }, 0))}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-white text-primary-900 px-12 h-14 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    >
                        {saving ? (
                            <>
                                <LoadingSpinner size="sm" />
                                <span>Commiting Configuration...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Commit Structure</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
