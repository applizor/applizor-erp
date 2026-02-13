'use client';

import { Plus, Trash2, AlertCircle } from 'lucide-react';

export interface PTSlab {
    min: number;
    max: number;
    amount: number;
    exceptionMonth?: number;
    exceptionAmount?: number;
}

interface PTSlabsConfigProps {
    slabs: PTSlab[];
    onChange: (slabs: PTSlab[]) => void;
    enabled: boolean;
}

export default function PTSlabsConfig({ slabs, onChange, enabled }: PTSlabsConfigProps) {

    const addSlab = () => {
        const newSlab: PTSlab = { min: 0, max: 0, amount: 200 };
        // Suggest min based on last max
        if (slabs.length > 0) {
            const lastSlab = slabs[slabs.length - 1];
            newSlab.min = lastSlab.max + 1;
            newSlab.max = 999999999;
        }
        onChange([...slabs, newSlab]);
    };

    const removeSlab = (index: number) => {
        const newSlabs = [...slabs];
        newSlabs.splice(index, 1);
        onChange(newSlabs);
    };

    const updateSlab = (index: number, field: keyof PTSlab, value: number) => {
        const newSlabs = [...slabs];
        newSlabs[index] = { ...newSlabs[index], [field]: value };
        onChange(newSlabs);
    };

    if (!enabled) return null;

    return (
        <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm md:col-span-2 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center">
                        <span className="font-black text-xs text-blue-600">PT</span>
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Professional Tax Slabs</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">State-Specific Deduction Rules</p>
                    </div>
                </div>
                <button
                    onClick={addSlab}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <Plus size={12} /> Add Range
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="ent-table w-full">
                    <thead>
                        <tr>
                            <th className="w-[20%]">Min Salary (₹)</th>
                            <th className="w-[20%]">Max Salary (₹)</th>
                            <th className="w-[15%]">Amount (₹)</th>
                            <th className="w-[15%]">Exception Month</th>
                            <th className="w-[15%]">Exception Amount (₹)</th>
                            <th className="w-[5%] text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {slabs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6 text-[10px] text-slate-400 uppercase italic">
                                    No slabs defined. System will not deduct PT.
                                </td>
                            </tr>
                        ) : (
                            slabs.map((slab, index) => (
                                <tr key={index} className="group hover:bg-slate-50/50">
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            value={slab.min}
                                            onChange={(e) => updateSlab(index, 'min', parseFloat(e.target.value))}
                                            className="ent-input w-full"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            value={slab.max}
                                            onChange={(e) => updateSlab(index, 'max', parseFloat(e.target.value))}
                                            className="ent-input w-full"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            value={slab.amount}
                                            onChange={(e) => updateSlab(index, 'amount', parseFloat(e.target.value))}
                                            className="ent-input w-full"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={slab.exceptionMonth || ''}
                                            onChange={(e) => updateSlab(index, 'exceptionMonth', parseInt(e.target.value))}
                                            className="ent-input w-full"
                                        >
                                            <option value="">None</option>
                                            <option value="2">February (2)</option>
                                            <option value="3">March (3)</option>
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            value={slab.exceptionAmount || 0}
                                            disabled={!slab.exceptionMonth}
                                            onChange={(e) => updateSlab(index, 'exceptionAmount', parseFloat(e.target.value))}
                                            className="ent-input w-full disabled:opacity-50"
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => removeSlab(index)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50/50 rounded border border-blue-100">
                <AlertCircle size={14} className="text-blue-600 mt-0.5" />
                <p className="text-[10px] text-blue-900 leading-relaxed">
                    <strong>Logic:</strong> If an employee's <strong>Gross Salary</strong> falls between Min and Max (inclusive), the defined Amount will be deducted.
                    If an Exception Month is set, that specific month will deduct the Exception Amount instead.
                </p>
            </div>
        </div>
    );
}
