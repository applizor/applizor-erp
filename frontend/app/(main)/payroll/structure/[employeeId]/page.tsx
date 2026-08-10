'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { payrollApi, SalaryComponent, EmployeeSalaryStructure } from '@/lib/api/payroll';
import { employeesApi } from '@/lib/api/hrms';
import { DollarSign, Activity, ChevronRight, Briefcase, Calculator, Save, ArrowLeft, Calendar, Sparkles } from 'lucide-react';

import Link from 'next/link';

export default function SalaryStructurePage({ params }: { params: { employeeId: string } }) {
    const toast = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [employee, setEmployee] = useState<any>(null);
    const [components, setComponents] = useState<SalaryComponent[]>([]);

    const [ctc, setCtc] = useState<number>(0);
    const [monthlySalary, setMonthlySalary] = useState<number>(0);
    const [breakdown, setBreakdown] = useState<Record<string, number>>({});

    useEffect(() => {
        loadData();
    }, []);

    const autoCalculateComponents = (monthlyVal: number, compList: SalaryComponent[] = components) => {
        if (!monthlyVal || monthlyVal <= 0) return;

        const basic = Math.round(monthlyVal * 0.50);
        const hra = Math.round(basic * 0.50);

        const basicComp = compList.find(c => c.name.toUpperCase().includes('BASIC'));
        const hraComp = compList.find(c => c.name.toUpperCase().includes('HRA'));
        const specialComp = compList.find(c => c.name.toUpperCase().includes('SPECIAL'));

        const newBreakdown: Record<string, number> = {};
        compList.forEach(c => newBreakdown[c.id] = 0);

        let allocated = 0;
        if (basicComp) {
            newBreakdown[basicComp.id] = basic;
            allocated += basic;
        }
        if (hraComp) {
            newBreakdown[hraComp.id] = hra;
            allocated += hra;
        }
        if (specialComp) {
            const balance = monthlyVal - allocated;
            newBreakdown[specialComp.id] = balance > 0 ? balance : 0;
        }

        setBreakdown(newBreakdown);
    };

    const loadData = async () => {
        try {
            const [emp, comps, struct] = await Promise.all([
                employeesApi.getById(params.employeeId),
                payrollApi.getComponents(),
                payrollApi.getStructure(params.employeeId).catch(() => null)
            ]);

            setEmployee(emp);
            setComponents(comps);

            if (struct && Number(struct.ctc) > 0) {
                const ctcVal = Number(struct.ctc);
                setCtc(ctcVal);
                setMonthlySalary(Math.round(ctcVal / 12));
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

    const handleMonthlyChange = (val: number) => {
        setMonthlySalary(val);
        const newCtc = val * 12;
        setCtc(newCtc);
        autoCalculateComponents(val);
    };

    const handleCtcChange = (val: number) => {
        setCtc(val);
        const newMonthly = Math.round(val / 12);
        setMonthlySalary(newMonthly);
        autoCalculateComponents(newMonthly);
    };

    const handleManualAutoAllocate = () => {
        const val = monthlySalary || (ctc ? Math.round(ctc / 12) : 0);
        if (!val) {
            toast.error('Please enter a valid Monthly Salary or CTC amount first');
            return;
        }
        autoCalculateComponents(val);
        toast.success('Strategy auto-calculated (Basic 50%, HRA 50% of Basic, Special Allowance balance)');
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
                ctc: ctc || monthlySalary * 12,
                netSalary: gross - deductions,
                components: componentList
            });

            toast.success('Architecture committed to registry');
            router.push('/payroll/structure');
        } catch (error) {
            toast.error('Failed to commit configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" className="text-primary-600" />
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Designing Compensation Architecture...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header (Compact) */}
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-md border border-slate-100">
                <div className="flex items-center gap-3">
                    <Link href="/payroll/structure" className="p-2 hover:bg-white text-slate-400 rounded-md transition-colors border border-transparent hover:border-slate-200">
                        <ArrowLeft size={16} />
                    </Link>
                    <div className="w-8 h-8 bg-primary-900 rounded-md flex items-center justify-center shadow-md ml-1">
                        <Calculator size={16} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Remuneration Wizard</h2>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            Target Personnel <ChevronRight size={8} /> <span className="text-primary-600">{employee?.firstName} {employee?.lastName}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: </span>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">ACTIVE SESSION</span>
                    </div>
                </div>
            </div>

            <div className="ent-card p-8 bg-gradient-to-br from-white to-gray-50/30">
                {/* Dual Input Section: Monthly Salary & Annual CTC */}
                <div className="mb-10 p-6 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black text-primary-900 uppercase tracking-widest">
                            <Sparkles size={14} className="text-amber-500" />
                            Valuation Calculator & Auto-Allocation Engine
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Enter Monthly Gross or Annual CTC
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        {/* Monthly Salary Input */}
                        <div className="md:col-span-5 space-y-1.5">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={12} className="text-primary-600" /> Monthly Gross Salary (Per Month)
                            </label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px] tracking-wider uppercase">₹/MON</span>
                                <input
                                    type="number"
                                    value={monthlySalary || ''}
                                    onChange={(e) => handleMonthlyChange(Number(e.target.value))}
                                    className="ent-input w-full pl-16 h-12 text-xl font-black tracking-tight border border-slate-300 focus:border-primary-600 transition-all rounded-md bg-white shadow-xs"
                                    placeholder="e.g. 12000"
                                />
                            </div>
                        </div>

                        {/* Annual CTC Input */}
                        <div className="md:col-span-4 space-y-1.5">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                <DollarSign size={12} className="text-emerald-600" /> Annual CTC (Yearly)
                            </label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px] tracking-wider uppercase">₹/YR</span>
                                <input
                                    type="number"
                                    value={ctc || ''}
                                    onChange={(e) => handleCtcChange(Number(e.target.value))}
                                    className="ent-input w-full pl-16 h-12 text-xl font-black tracking-tight border border-slate-300 focus:border-primary-600 transition-all rounded-md bg-white shadow-xs"
                                    placeholder="e.g. 144000"
                                />
                            </div>
                        </div>

                        {/* Auto Allocate Button */}
                        <div className="md:col-span-3">
                            <button
                                type="button"
                                onClick={handleManualAutoAllocate}
                                className="w-full h-12 bg-primary-900 hover:bg-primary-800 text-white rounded-md font-black text-[9px] uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
                            >
                                <Calculator size={14} /> Auto-Allocate
                            </button>
                        </div>
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

                <div className="mt-14 bg-primary-900 rounded-md border border-black p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl shadow-primary-900/20">
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
                        className="bg-white text-primary-900 px-12 h-14 rounded-md font-black text-[11px] uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-3"
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
