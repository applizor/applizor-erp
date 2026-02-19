'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, AlertCircle, MapPin } from 'lucide-react';

export interface PTSlab {
    min: number;
    max: number;
    amount: number;
    exceptionMonth?: number;
    exceptionAmount?: number;
}

interface PTSlabsConfigProps {
    slabs: PTSlab[] | Record<string, PTSlab[]>;
    onChange: (slabs: Record<string, PTSlab[]>) => void;
    enabled: boolean;
}

const SUPPORTED_STATES = [
    'Maharashtra',
    'Madhya Pradesh',
    'Karnataka',
    'Gujarat',
    'Tamil Nadu',
    'West Bengal',
    'Telangana',
    'Andhra Pradesh',
    'Delhi',
    'Other'
];

export default function PTSlabsConfig({ slabs, onChange, enabled }: PTSlabsConfigProps) {
    const [activeState, setActiveState] = useState<string>('Maharashtra');

    // Normalize input to object
    const slabMap: Record<string, PTSlab[]> = useMemo(() => {
        if (Array.isArray(slabs)) {
            return { 'Maharashtra': slabs };
        }
        return slabs || {};
    }, [slabs]);

    const activeSlabs = slabMap[activeState] || [];

    const updateMap = (state: string, newSlabs: PTSlab[]) => {
        const newMap = { ...slabMap, [state]: newSlabs };
        onChange(newMap);
    };

    const addSlab = () => {
        const newSlab: PTSlab = { min: 0, max: 0, amount: 200 };
        // Suggest min based on last max
        if (activeSlabs.length > 0) {
            const lastSlab = activeSlabs[activeSlabs.length - 1];
            newSlab.min = lastSlab.max + 1;
            newSlab.max = 999999999;
        }
        updateMap(activeState, [...activeSlabs, newSlab]);
    };

    const removeSlab = (index: number) => {
        const newSlabs = [...activeSlabs];
        newSlabs.splice(index, 1);
        updateMap(activeState, newSlabs);
    };

    const updateSlab = (index: number, field: keyof PTSlab, value: number) => {
        const newSlabs = [...activeSlabs];
        newSlabs[index] = { ...newSlabs[index], [field]: value };
        updateMap(activeState, newSlabs);
    };

    if (!enabled) return null;

    return (
        <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm md:col-span-2 space-y-6 animate-fade-in">
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

            {/* State Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {SUPPORTED_STATES.map(state => {
                    const hasRule = (slabMap[state] || []).length > 0;
                    return (
                        <button
                            key={state}
                            onClick={() => setActiveState(state)}
                            className={`
                                whitespace-nowrap px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all border
                                ${activeState === state
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : hasRule
                                        ? 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300'
                                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600'
                                }
                            `}
                        >
                            {state} {hasRule && '✓'}
                        </button>
                    )
                })}
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
                        {activeSlabs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6 text-[10px] text-slate-400 uppercase italic">
                                    No slabs defined for <span className="font-bold text-slate-600">{activeState}</span>.
                                </td>
                            </tr>
                        ) : (
                            activeSlabs.map((slab, index) => (
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
                    <strong>Logic for {activeState}:</strong> If an employee's <strong>Gross Salary</strong> falls between Min and Max, the Amount will be deducted.
                </p>
            </div>
        </div>
    );
}
