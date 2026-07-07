'use client';

import { Plus, Trash2, AlertCircle } from 'lucide-react';

export interface SlabRow {
    min: number;
    max: number | string; // Can be a number or 'Infinity' or ''
    amount?: number;
    rate?: number;
}

interface SlabBracketEditorProps {
    value: SlabRow[] | any;
    onChange: (value: any[]) => void;
    ruleType: string; // 'slab' is expected, but we show this component when selected
    valueType: 'amount' | 'rate'; // Whether the output value is amount or rate
}

export default function SlabBracketEditor({ value, onChange, ruleType, valueType }: SlabBracketEditorProps) {
    // Normalize incoming legacy data (from -> min, to -> max, tax -> amount)
    const slabs: SlabRow[] = (Array.isArray(value) ? value : []).map((row: any) => {
        const min = row.min !== undefined ? row.min : (row.from !== undefined ? row.from : 0);
        let max = row.max !== undefined ? row.max : (row.to !== undefined ? row.to : 'Infinity');
        if (max === 999999 || max === 999999999 || max === 'Infinity') {
            max = 'Infinity';
        } else {
            max = Number(max);
        }
        const amount = row.amount !== undefined ? Number(row.amount) : (row.tax !== undefined ? Number(row.tax) : 0);
        const rate = row.rate !== undefined ? Number(row.rate) : 0;
        return { min, max, amount, rate };
    });

    const propagateChange = (updatedSlabs: SlabRow[]) => {
        const mapped = updatedSlabs.map(row => {
            const maxVal = row.max === 'Infinity' ? 999999999 : Number(row.max);
            return {
                min: Number(row.min),
                max: maxVal,
                amount: Number(row.amount ?? 0),
                rate: Number(row.rate ?? 0),
                from: Number(row.min),
                to: maxVal,
                tax: Number(row.amount ?? 0)
            };
        });
        onChange(mapped);
    };

    const handleAddRow = () => {
        const newRow: SlabRow = { min: 0, max: 'Infinity' };
        if (valueType === 'rate') {
            newRow.rate = 0;
            newRow.amount = 0;
        } else {
            newRow.amount = 0;
            newRow.rate = 0;
        }

        // If there are existing rows, set the new row's min to the last row's max + 1
        if (slabs.length > 0) {
            const lastRow = slabs[slabs.length - 1];
            const lastMax = Number(lastRow.max);
            if (!isNaN(lastMax) && isFinite(lastMax)) {
                newRow.min = lastMax + 1;
            }
        }
        
        propagateChange([...slabs, newRow]);
    };

    const handleRemoveRow = (index: number) => {
        const updated = [...slabs];
        updated.splice(index, 1);
        propagateChange(updated);
    };

    const handleFieldChange = (index: number, field: keyof SlabRow, val: any) => {
        const updated = [...slabs];
        const row = { ...updated[index] };

        if (field === 'min') {
            row.min = val === '' ? 0 : parseFloat(val) || 0;
        } else if (field === 'max') {
            if (val === '' || val === 'Infinity') {
                row.max = 'Infinity';
            } else {
                row.max = parseFloat(val) || 0;
            }
        } else if (field === 'amount') {
            row.amount = val === '' ? 0 : parseFloat(val) || 0;
        } else if (field === 'rate') {
            row.rate = val === '' ? 0 : parseFloat(val) || 0;
        }

        updated[index] = row;
        propagateChange(updated);
    };

    if (ruleType !== 'slab') return null;

    return (
        <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-4 space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Slab Bracket Editor</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Define continuous ranges and matching rates/amounts</p>
                </div>
                <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary-900 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-primary-800 transition-colors shadow-sm"
                >
                    <Plus size={12} /> Add Bracket
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
                <table className="ent-table w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="w-[30%] px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500">Salary From</th>
                            <th className="w-[30%] px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500">Salary To</th>
                            <th className="w-[25%] px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                {valueType === 'rate' ? 'Rate (%)' : 'Deduction Amount'}
                            </th>
                            <th className="w-[15%] text-center px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {slabs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-[10px] text-slate-400 font-bold uppercase italic">
                                    No brackets defined. Click Add Bracket to start.
                                </td>
                            </tr>
                        ) : (
                            slabs.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-3 py-2">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                min={0}
                                                className="ent-input w-full"
                                                value={row.min}
                                                onChange={(e) => handleFieldChange(index, 'min', e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type={row.max === 'Infinity' ? 'text' : 'number'}
                                                required
                                                className="ent-input w-full"
                                                value={row.max === 'Infinity' ? 'Above Limit / Infinity' : row.max}
                                                disabled={row.max === 'Infinity'}
                                                onChange={(e) => handleFieldChange(index, 'max', e.target.value)}
                                                placeholder="Infinity"
                                            />
                                            {row.max !== 'Infinity' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleFieldChange(index, 'max', 'Infinity')}
                                                    className="px-2 py-1 text-[8px] font-black text-slate-400 hover:text-slate-600 bg-slate-100 rounded uppercase tracking-wider whitespace-nowrap"
                                                >
                                                    Set Infinity
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleFieldChange(index, 'max', row.min + 10000)}
                                                    className="px-2 py-1 text-[8px] font-black text-primary-600 hover:text-primary-800 bg-primary-50 rounded uppercase tracking-wider whitespace-nowrap"
                                                >
                                                    Set Numeric
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        {valueType === 'rate' ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                min={0}
                                                max={100}
                                                className="ent-input w-full"
                                                value={row.rate ?? 0}
                                                onChange={(e) => handleFieldChange(index, 'rate', e.target.value)}
                                                placeholder="e.g. 5"
                                            />
                                        ) : (
                                            <input
                                                type="number"
                                                required
                                                min={0}
                                                className="ent-input w-full"
                                                value={row.amount ?? 0}
                                                onChange={(e) => handleFieldChange(index, 'amount', e.target.value)}
                                                placeholder="e.g. 200"
                                            />
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRow(index)}
                                            className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors rounded hover:bg-rose-50"
                                            title="Delete row"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                <AlertCircle size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-[9px] text-blue-900 leading-normal font-bold uppercase tracking-wider">
                    Be sure that range bounds do not overlap. The final range should end at "Infinity" to catch all exceeding values.
                </p>
            </div>
        </div>
    );
}
