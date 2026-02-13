'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { payrollApi, SalaryComponent, SalaryTemplate } from '@/lib/api/payroll';
import { employeesApi } from '@/lib/api/hrms';
import { DollarSign, Activity, ChevronRight, Calculator, Save, ArrowLeft, Percent, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';

export default function ConfigureStructurePage() {
    const { id } = useParams();
    const employeeId = id as string;
    const toast = useToast();
    const router = useRouter();
    const { formatCurrency } = useCurrency();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [employee, setEmployee] = useState<any>(null);
    const [components, setComponents] = useState<SalaryComponent[]>([]);
    const [statConfig, setStatConfig] = useState<any>(null);

    const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

    const [ctc, setCtc] = useState<number>(0);
    const [breakdown, setBreakdown] = useState<Record<string, number>>({});

    useEffect(() => {
        loadData();
    }, [employeeId]);

    const loadData = async () => {
        try {
            const [emp, comps, struct, config, temps] = await Promise.all([
                employeesApi.getById(employeeId),
                payrollApi.getComponents(),
                payrollApi.getStructure(employeeId).catch(() => null),
                api.get('/payroll/statutory-config').then(res => res.data).catch(() => null),
                payrollApi.getTemplates()
            ]);

            setEmployee(emp);
            setComponents(comps);
            setStatConfig(config);
            setTemplates(temps);

            if (struct && struct.ctc) {
                setCtc(Number(struct.ctc));
                setSelectedTemplateId(struct.templateId || '');
                const mapping: any = {};
                // Handle different response structures if necessary
                if (struct.components) {
                    struct.components.forEach((c: any) => {
                        mapping[c.salaryComponentId || c.componentId] = Number(c.amount || c.monthlyAmount);
                    });
                } else if (struct.breakdown) {
                    Object.assign(mapping, struct.breakdown);
                }
                setBreakdown(mapping);
            }
        } catch (error) {
            console.error('Load error:', error);
            toast.error('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoCalculate = async () => {
        if (!ctc) return toast.error('Enter CTC first');
        if (!selectedTemplateId) return toast.error('Select a Template first');

        setLoading(true);
        try {
            const preview = await payrollApi.previewTemplate(selectedTemplateId, ctc);

            const basicId = components.find(c => c.name.toUpperCase().includes('BASIC'))?.id;
            const basic = preview[basicId || ''] || 0;
            const monthlyGross = ctc / 12;

            const isPF = (name: string) => {
                const n = name.toUpperCase();
                return n.includes('PF') || n.includes('PROVIDENT FUND') || n.includes('EPF');
            };
            const isESI = (name: string) => {
                const n = name.toUpperCase();
                return n.includes('ESI') || n.includes('ESIC');
            };

            const newBreakdown = { ...preview };

            // Apply Statutory Overrides from Config
            const pfComp = components.find(c => c.type === 'deduction' && isPF(c.name));
            if (pfComp && basic) {
                const rate = statConfig ? Number(statConfig.pfEmployeeRate) : 12;
                const limit = statConfig ? Number(statConfig.pfBasicLimit) : 15000;
                const pfWage = Math.min(basic, limit);
                newBreakdown[pfComp.id] = Math.floor(pfWage * (rate / 100));
            }

            const esiComp = components.find(c => c.type === 'deduction' && isESI(c.name));
            const esiLimit = statConfig ? Number(statConfig.esiGrossLimit) : 21000;
            const esiRate = statConfig ? Number(statConfig.esiEmployeeRate) : 0.75;

            if (esiComp && monthlyGross <= esiLimit) {
                newBreakdown[esiComp.id] = Math.ceil(monthlyGross * (esiRate / 100));
            } else if (esiComp) {
                newBreakdown[esiComp.id] = 0;
            }

            setBreakdown(newBreakdown);
            toast.success(`Dynamic Allocation Applied via ${templates.find(t => t.id === selectedTemplateId)?.name}`);
        } catch (error) {
            console.error('Auto calculate error:', error);
            toast.error('Dynamic calculation failed');
        } finally {
            setLoading(false);
        }
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
                return { salaryComponentId: compId, amount };
            });

            await payrollApi.saveStructure(employeeId, {
                ctc,
                templateId: selectedTemplateId,
                netSalary: gross - deductions,
                components: componentList
            });

            toast.success('Architecture committed to registry');
            router.push('/payroll/structure');
        } catch (error) {
            console.error('Save error:', error);
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

    const grossMonthly = Object.entries(breakdown).reduce((sum, [id, val]) => {
        const c = components.find(x => x.id === id);
        return c?.type === 'earning' ? sum + val : sum;
    }, 0);

    const netMonthly = Object.entries(breakdown).reduce((sum, [id, val]) => {
        const c = components.find(x => x.id === id);
        return c?.type === 'earning' ? sum + val : sum - val;
    }, 0);

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Page Header */}
            <div className="flex justify-between items-center bg-white p-5 rounded-md border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/payroll/structure" className="p-2.5 bg-slate-50 text-slate-400 rounded-md transition-all border border-slate-100 hover:bg-primary-900 hover:text-white hover:border-primary-900 shadow-sm">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="w-10 h-10 bg-primary-900 rounded-md flex items-center justify-center shadow-lg">
                        <Calculator size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">Remuneration Architecture</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Target Personnel</p>
                            <ChevronRight size={10} className="text-gray-300" />
                            <span className="text-[10px] text-primary-600 font-black uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                                {employee?.firstName} {employee?.lastName}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-md shadow-sm">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Secure Session Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Valuations & Templates */}
                    <div className="ent-card p-6 bg-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-12 bg-primary-50/30 rounded-full -mr-16 -mt-16 blur-3xl -z-1" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.15em] flex items-center gap-2">
                                    <DollarSign size={12} className="text-primary-600" /> Annual Cost to Company (CTC)
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-gray-300 font-black text-[12px]">₹</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={ctc}
                                        onChange={(e) => setCtc(Number(e.target.value))}
                                        className="ent-input w-full pl-10 h-12 text-xl font-black tracking-tight border-slate-200 focus:border-primary-500 hover:border-slate-300 transition-all rounded-md"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.15em] flex items-center gap-2">
                                    <Activity size={12} className="text-primary-600" /> Allocation Protocol (Template)
                                </label>
                                <select
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                    className="ent-input w-full h-12 text-xs font-black tracking-widest border-slate-200 focus:border-primary-500 hover:border-slate-300 transition-all rounded-md appearance-none uppercase bg-white"
                                >
                                    <option value="">Select Protocol</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleAutoCalculate}
                            disabled={loading || !ctc || !selectedTemplateId}
                            className="mt-6 w-full h-12 bg-primary-900 text-white rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-primary-950 active:scale-[0.98] shadow-lg shadow-primary-900/10 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                        >
                            {loading ? <Activity className="animate-spin" size={16} /> : <Percent size={16} />}
                            {loading ? 'Processing System Metrics...' : 'Execute Intelligent Allocation'}
                        </button>
                    </div>

                    {/* Breakdown Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                        {/* Earnings */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                                <h3 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Earnings
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {components.filter(c => c.type === 'earning').map(comp => (
                                    <div key={comp.id} className="bg-white p-3 rounded-md border border-slate-100 shadow-sm transition-all hover:border-emerald-200 group">
                                        <label className="text-[8px] font-black text-gray-400 mb-1.5 uppercase tracking-widest flex justify-between">
                                            <span>{comp.name}</span>
                                            {breakdown[comp.id] > 0 && <span className="text-emerald-600 font-black">ACTIVE</span>}
                                        </label>
                                        <input
                                            type="number"
                                            value={breakdown[comp.id] || 0}
                                            onChange={(e) => setBreakdown({ ...breakdown, [comp.id]: Number(e.target.value) })}
                                            className="w-full bg-transparent text-[13px] font-black tracking-tight text-slate-700 focus:outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                                <h3 className="text-[11px] font-black text-rose-800 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Deductions
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {components.filter(c => c.type === 'deduction').map(comp => (
                                    <div key={comp.id} className="bg-white p-3 rounded-md border border-slate-100 shadow-sm transition-all hover:border-rose-200 group">
                                        <label className="text-[8px] font-black text-gray-400 mb-1.5 uppercase tracking-widest flex justify-between">
                                            <span>{comp.name}</span>
                                            {breakdown[comp.id] > 0 && <span className="text-rose-600 font-black">DEDUCTING</span>}
                                        </label>
                                        <input
                                            type="number"
                                            value={breakdown[comp.id] || 0}
                                            onChange={(e) => setBreakdown({ ...breakdown, [comp.id]: Number(e.target.value) })}
                                            className="w-full bg-transparent text-[13px] font-black tracking-tight text-slate-700 focus:outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Economic Summary Sidebar */}
                <div className="space-y-6">
                    <div className="bg-primary-900 text-white p-8 rounded-md shadow-2xl relative overflow-hidden ring-4 ring-primary-50 group">
                        <div className="absolute top-0 right-0 p-20 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl transition-all group-hover:scale-110" />

                        <div className="relative z-10 space-y-6">
                            <div>
                                <p className="text-[9px] font-black text-primary-300 uppercase tracking-[0.25em] mb-1">Monthly Gross Pay</p>
                                <p className="text-3xl font-black tracking-tighter transition-all hover:text-emerald-400 cursor-default">
                                    {formatCurrency(grossMonthly)}
                                </p>
                            </div>

                            <div className="pt-6 border-t border-white/10 space-y-6">
                                <div>
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-1">Estimated Net Liquidity</p>
                                    <p className="text-3xl font-black text-emerald-400 tracking-tighter">
                                        {formatCurrency(netMonthly)}
                                    </p>
                                    <p className="text-[8px] font-bold text-primary-400 uppercase tracking-widest mt-1 italic">
                                        Take-home amount after base deductions
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full h-14 bg-emerald-500 text-white rounded-md font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 transition-all hover:bg-emerald-400 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-30 mt-4"
                            >
                                {saving ? <LoadingSpinner size="sm" /> : <Save size={18} />}
                                {saving ? 'Committing...' : 'Commit Architecture'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={14} className="text-slate-400" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Audit</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Monthly Statutory Load</span>
                                <span className="text-sm font-black text-slate-700">
                                    {formatCurrency(Object.entries(breakdown).reduce((sum, [id, val]) => {
                                        const c = components.find(x => x.id === id);
                                        return c?.type === 'deduction' ? sum + val : sum;
                                    }, 0))}
                                </span>
                            </div>
                            <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Annualized Take-Home</span>
                                <span className="text-sm font-black text-slate-700">
                                    {formatCurrency(netMonthly * 12)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
