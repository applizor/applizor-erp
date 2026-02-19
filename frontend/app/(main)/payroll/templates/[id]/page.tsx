'use client';

import { useEffect, useState, use } from 'react';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Save, Plus, Trash2, Calculator, GripVertical } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useCurrency } from '@/context/CurrencyContext';

// Formula evaluation utility
const evaluateFormula = (formula: string, context: Record<string, number>): number => {
    try {
        let expression = formula;
        Object.keys(context).forEach(key => {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            expression = expression.replace(regex, String(context[key]));
        });
        if (!/^[\d+\-*/().\s]+$/.test(expression)) return 0;
        // eslint-disable-next-line no-new-func
        return new Function(`return ${expression}`)();
    } catch (e) {
        return 0;
    }
};

export default function EditSalaryTemplatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const toast = useToast();
    const router = useRouter();
    const { formatCurrency } = useCurrency();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [components, setComponents] = useState<any[]>([]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // Structure State
    const [templateComponents, setTemplateComponents] = useState<any[]>([]);

    // Preview Settings
    const [previewCtc, setPreviewCtc] = useState<number>(1200000);
    const [previewBreakdown, setPreviewBreakdown] = useState<Record<string, number>>({});
    const [previewGross, setPreviewGross] = useState<number>(0);
    const [previewNet, setPreviewNet] = useState<number>(0);

    useEffect(() => {
        Promise.all([loadComponents(), loadTemplate()]);
    }, []);

    // Real-time calculation
    useEffect(() => {
        if (components.length > 0) calculatePreview();
    }, [templateComponents, previewCtc, components]);

    const loadComponents = async () => {
        try {
            const res = await api.get('/payroll/components');
            setComponents(res.data);
        } catch (error) {
            toast.error('Failed to load components');
        }
    };

    const loadTemplate = async () => {
        try {
            setFetching(true);
            const res = await api.get(`/payroll/templates/${id}`);
            const data = res.data;
            setName(data.name);
            setDescription(data.description || '');

            // Map components
            setTemplateComponents(data.components.map((tc: any) => ({
                componentId: tc.componentId,
                calculationType: tc.calculationType,
                value: tc.value,
                formula: tc.formula,
                tempId: tc.id || Date.now() + Math.random()
            })));

        } catch (error) {
            console.error('Load Error:', error);
            toast.error('Failed to load template details');
            router.push('/payroll/templates');
        } finally {
            setFetching(false);
        }
    };

    const addComponent = () => {
        setTemplateComponents([
            ...templateComponents,
            {
                componentId: '',
                calculationType: 'flat',
                value: 0,
                formula: '',
                tempId: Date.now()
            }
        ]);
    };

    const removeComponent = (index: number) => {
        const newComps = [...templateComponents];
        newComps.splice(index, 1);
        setTemplateComponents(newComps);
    };

    const updateComponent = (index: number, field: string, value: any) => {
        const newComps = [...templateComponents];
        newComps[index] = { ...newComps[index], [field]: value };
        setTemplateComponents(newComps);
    };

    const calculatePreview = () => {
        if (!previewCtc) return;

        const monthlyGross = Math.floor(previewCtc / 12);
        const context: Record<string, number> = {
            CTC: previewCtc,
            GROSS: monthlyGross,
            BASIC: 0
        };
        const breakdown: Record<string, number> = {};

        // 1. First Pass
        templateComponents.forEach(tc => {
            const compName = components.find(c => c.id === tc.componentId)?.name || '';
            let val = 0;

            if (tc.calculationType === 'flat') val = Number(tc.value);
            else if (tc.calculationType === 'percentage') val = (monthlyGross * Number(tc.value)) / 100;
            else if (tc.calculationType === 'formula') val = 0;

            breakdown[tc.tempId] = val;

            if (compName.toUpperCase().includes('BASIC')) context['BASIC'] = val;
            context[compName.toUpperCase().replace(/\s/g, '_')] = val;
        });

        // 2. Second Pass (Formulas)
        templateComponents.forEach(tc => {
            if (tc.calculationType === 'formula') {
                const val = evaluateFormula(tc.formula || '0', context);
                breakdown[tc.tempId] = val;

                const compName = components.find(c => c.id === tc.componentId)?.name || '';
                context[compName.toUpperCase().replace(/\s/g, '_')] = val;
                if (compName.toUpperCase().includes('BASIC')) context['BASIC'] = val;
            }
        });

        // Summation
        let totalDeductions = 0;
        let totalEarnings = 0;

        templateComponents.forEach(tc => {
            const comp = components.find(c => c.id === tc.componentId);
            const val = breakdown[tc.tempId] || 0;
            if (comp?.type === 'deduction') totalDeductions += val;
            else totalEarnings += val;
        });

        setPreviewBreakdown(breakdown);
        setPreviewGross(totalEarnings);
        setPreviewNet(totalEarnings - totalDeductions);
    };

    const handleSave = async () => {
        if (!name) return toast.error('Template Name is required');
        if (templateComponents.length === 0) return toast.error('Add at least one component');

        try {
            setLoading(true);
            await api.put(`/payroll/templates/${id}`, {
                name,
                description,
                components: templateComponents.map(tc => ({
                    componentId: tc.componentId,
                    calculationType: tc.calculationType,
                    value: Number(tc.value),
                    formula: tc.formula
                }))
            });

            toast.success('Template updated successfully');
            router.push('/payroll/templates');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update template');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-10 flex justify-center"><LoadingSpinner /></div>;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-md border border-slate-200 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/payroll/templates" className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Edit Template</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Modify Remuneration Structure</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right mr-4 border-r border-slate-200 pr-4 hidden md:block">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Est. Net Pay</div>
                        <div className="text-lg font-black text-emerald-600 tracking-tight leading-none">{formatCurrency(previewNet)}</div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-900/20"
                    >
                        {loading ? <LoadingSpinner /> : <Save size={14} />}
                        Update Structure
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* Left: Configuration */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-2">

                    {/* Meta Info */}
                    <div className="ent-card p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="ent-form-group">
                            <label className="ent-label">Structure Name</label>
                            <input
                                type="text"
                                className="ent-input text-sm font-bold"
                                placeholder="E.g. Senior Management Structure"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">Description / Applicability</label>
                            <input
                                type="text"
                                className="ent-input"
                                placeholder="E.g. Applicable for Grade A Employees"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Component Builder */}
                    <div className="ent-card flex-1 flex flex-col min-h-[400px]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-primary-100 text-primary-700 flex items-center justify-center">
                                    <GripVertical size={14} />
                                </div>
                                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Components Sequence</h3>
                            </div>
                            <button
                                onClick={addComponent}
                                className="text-[10px] font-black uppercase tracking-wider text-white bg-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-800 transition-all flex items-center gap-1 shadow-sm"
                            >
                                <Plus size={12} /> Add Component
                            </button>
                        </div>

                        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                            {templateComponents.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2 min-h-[200px]">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                                        <Plus size={24} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-wide">Start adding components</p>
                                </div>
                            ) : (
                                templateComponents.map((tc, index) => {
                                    const selectedComp = components.find(c => c.id === tc.componentId);
                                    const isDeduction = selectedComp?.type === 'deduction';

                                    return (
                                        <div key={tc.tempId} className="flex flex-col md:flex-row gap-3 items-start p-3 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition-all group relative">
                                            {/* Drag Handle */}
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 hidden group-hover:block cursor-move">
                                                <GripVertical size={14} />
                                            </div>

                                            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 self-center ml-2">
                                                {index + 1}
                                            </div>

                                            {/* Component Select */}
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="ent-label mb-1 block">Component</label>
                                                <CustomSelect
                                                    options={components.map(c => ({
                                                        label: c.name,
                                                        value: c.id,
                                                        icon: c.type === 'deduction' ? <div className="w-2 h-2 rounded-full bg-rose-500" /> : <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    }))}
                                                    value={tc.componentId}
                                                    onChange={(val) => updateComponent(index, 'componentId', val)}
                                                    placeholder="Select Component"
                                                />
                                            </div>

                                            {/* Calculation Logic */}
                                            <div className="flex gap-3 flex-[2]">
                                                <div className="w-[140px]">
                                                    <label className="ent-label mb-1 block">Logic Type</label>
                                                    <select
                                                        className="ent-input h-[38px]"
                                                        value={tc.calculationType}
                                                        onChange={(e) => updateComponent(index, 'calculationType', e.target.value)}
                                                    >
                                                        <option value="flat">Flat Amount</option>
                                                        <option value="percentage">% of Gross</option>
                                                        <option value="formula">Custom Formula</option>
                                                    </select>
                                                </div>

                                                <div className="flex-1">
                                                    <label className="ent-label mb-1 block">
                                                        {tc.calculationType === 'formula' ? 'Expression' : (tc.calculationType === 'percentage' ? 'Percentage' : 'Value')}
                                                    </label>
                                                    {tc.calculationType === 'formula' ? (
                                                        <input
                                                            type="text"
                                                            className="ent-input font-mono text-xs text-blue-600 h-[38px]"
                                                            placeholder="GROSS * 0.5"
                                                            value={tc.formula || ''}
                                                            onChange={(e) => updateComponent(index, 'formula', e.target.value)}
                                                        />
                                                    ) : (
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                className="ent-input h-[38px] pr-8"
                                                                placeholder="0.00"
                                                                value={tc.value}
                                                                onChange={(e) => updateComponent(index, 'value', e.target.value)}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                                                                {tc.calculationType === 'percentage' ? '%' : ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Preview Value */}
                                            <div className="w-[120px] self-center text-right px-2">
                                                <div className={`text-xs font-black ${isDeduction ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {isDeduction ? '-' : '+'}{formatCurrency(previewBreakdown[tc.tempId] || 0)}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">Est. Monthly</div>
                                            </div>

                                            {/* Delete */}
                                            <button
                                                onClick={() => removeComponent(index)}
                                                className="self-center p-2 text-slate-300 hover:text-rose-500 transition-colors hover:bg-rose-50 rounded-md"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Live Preview */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
                    <div className="ent-card bg-slate-900 text-white p-6 flex flex-col h-full shadow-xl shadow-slate-200">
                        <div className="flex items-center gap-2 mb-6 text-slate-400 border-b border-slate-700 pb-4">
                            <Calculator size={16} />
                            <h3 className="text-xs font-black uppercase tracking-widest">Live Simulation</h3>
                        </div>

                        {/* Simulator Input */}
                        <div className="mb-8">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-2">Test Annual CTC</label>
                            <input
                                type="number"
                                value={previewCtc}
                                onChange={(e) => setPreviewCtc(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-3 text-lg font-mono font-bold text-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                            />
                            <div className="text-right mt-1 text-[10px] text-slate-500 font-mono">
                                Monthly Gross: {formatCurrency(Math.floor(previewCtc / 12))}
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="flex-1 overflow-y-auto space-y-1 mb-6 pr-2">
                            {templateComponents.length > 0 ? (
                                templateComponents.map(tc => {
                                    const comp = components.find(c => c.id === tc.componentId);
                                    const val = previewBreakdown[tc.tempId] || 0;
                                    if (!comp) return null;

                                    return (
                                        <div key={tc.tempId} className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                            <span className="text-[11px] font-medium text-slate-300">{comp.name}</span>
                                            <span className={`text-[11px] font-mono font-bold ${comp.type === 'deduction' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {formatCurrency(val)}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-slate-600 text-xs py-10 italic">
                                    Add components to see breakdown
                                </div>
                            )}
                        </div>

                        {/* Summary Footer */}
                        <div className="mt-auto bg-slate-800/50 rounded-lg p-4 space-y-2 border border-slate-700">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Total Earnings</span>
                                <span className="text-xs font-bold text-emerald-400">{formatCurrency(previewGross)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Total Deductions</span>
                                <span className="text-xs font-bold text-rose-400">{formatCurrency(previewGross - previewNet)}</span>
                            </div>
                            <div className="border-t border-slate-600 pt-2 flex justify-between items-center mt-2">
                                <span className="text-[11px] uppercase font-black text-white tracking-widest">Net Pay</span>
                                <span className="text-lg font-black text-white tracking-tight">{formatCurrency(previewNet)}</span>
                            </div>
                        </div>

                        {/* Formula Guide */}
                        <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500 leading-relaxed">
                            <p className="font-bold text-slate-400 mb-1">Variables Available:</p>
                            CTC, GROSS, BASIC, HRA... (use component names in CAPS)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
