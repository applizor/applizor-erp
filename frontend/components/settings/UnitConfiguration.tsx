'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { Plus, Trash2, Loader2, Box, Scale } from 'lucide-react';
import api from '@/lib/api';

interface UnitType {
    id: string;
    name: string;
    symbol: string;
    isActive: boolean;
}

export default function UnitConfiguration() {
    const [units, setUnits] = useState<UnitType[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const toast = useToast();

    // New Unit Form State
    const [newName, setNewName] = useState('');
    const [newSymbol, setNewSymbol] = useState('');

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        try {
            const res = await api.get('/settings/units');
            setUnits(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load units');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await api.post('/settings/units', {
                name: newName,
                symbol: newSymbol
            });
            setUnits([res.data, ...units]);
            setNewName('');
            setNewSymbol('');
            toast.success('Unit type added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add unit type');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this unit type?')) return;
        try {
            await api.delete(`/settings/units/${id}`);
            setUnits(units.filter(u => u.id !== id));
            toast.success('Unit type deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete unit type');
        }
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                    <Scale size={16} className="text-primary-600" />
                    New Measurement Unit
                </h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="ent-form-group md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Unit Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Kilogram, Hour, Box"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            required
                            className="ent-input w-full"
                        />
                    </div>
                    <div className="ent-form-group">
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Symbol</label>
                        <input
                            type="text"
                            placeholder="e.g. kg, hr, box"
                            value={newSymbol}
                            onChange={e => setNewSymbol(e.target.value)}
                            required
                            className="ent-input w-full"
                        />
                    </div>
                    <div className="ent-form-group">
                        <button
                            type="submit"
                            disabled={creating}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            ADD UNIT
                        </button>
                    </div>
                </form>

                {/* Suggestions Section */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Common Suggestions</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { name: 'Service', symbol: 'srv' },
                            { name: 'Hours', symbol: 'hr' },
                            { name: 'Month', symbol: 'mo' },
                            { name: 'Year', symbol: 'yr' },
                            { name: 'Quantity', symbol: 'qty' },
                            { name: 'Each', symbol: 'ea' },
                            { name: 'Numbers', symbol: 'nos' }
                        ].map((sug) => (
                            <button
                                key={sug.symbol}
                                type="button"
                                onClick={() => {
                                    setNewName(sug.name);
                                    setNewSymbol(sug.symbol);
                                }}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:border-primary-600 hover:text-primary-600 transition-all cursor-pointer"
                            >
                                {sug.name} ({sug.symbol})
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="ent-card overflow-hidden">
                <table className="ent-table w-full">
                    <thead>
                        <tr>
                            <th className="text-left px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Name</th>
                            <th className="text-left px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Symbol</th>
                            <th className="text-right px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {units.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-xs text-slate-400">No units configured.</td>
                            </tr>
                        ) : (
                            units.map(unit => (
                                <tr key={unit.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-xs font-bold text-slate-900">{unit.name}</td>
                                    <td className="px-4 py-3 text-xs font-mono text-slate-600 bg-slate-100/50 rounded inline-block my-1 px-2">{unit.symbol}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(unit.id)}
                                            className="text-slate-400 hover:text-red-600 transition-colors"
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
        </div>
    );
}
