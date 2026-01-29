'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { Plus, Trash2, Loader2, Percent } from 'lucide-react';
import api from '@/lib/api';

interface TaxRate {
    id: string;
    name: string;
    percentage: number;
    description: string;
    isActive: boolean;
}

export default function TaxConfiguration() {
    const [taxes, setTaxes] = useState<TaxRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const toast = useToast();

    // New Tax Form State
    const [newName, setNewName] = useState('');
    const [newPercentage, setNewPercentage] = useState('');
    const [newDescription, setNewDescription] = useState('');

    useEffect(() => {
        fetchTaxes();
    }, []);

    const fetchTaxes = async () => {
        try {
            const res = await api.get('/settings/taxes');
            setTaxes(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load tax rates');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await api.post('/settings/taxes', {
                name: newName,
                percentage: parseFloat(newPercentage),
                description: newDescription
            });
            setTaxes([res.data, ...taxes]);
            setNewName('');
            setNewPercentage('');
            setNewDescription('');
            toast.success('Tax rate added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add tax rate');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tax rate?')) return;
        try {
            await api.delete(`/settings/taxes/${id}`);
            setTaxes(taxes.filter(t => t.id !== id));
            toast.success('Tax rate deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete tax rate');
        }
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                    <Percent size={16} className="text-primary-600" />
                    New Tax Rate
                </h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="ent-form-group">
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Name</label>
                        <input
                            type="text"
                            placeholder="e.g. GST 18%"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            required
                            className="ent-input w-full"
                        />
                    </div>
                    <div className="ent-form-group">
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Rate (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="18.00"
                            value={newPercentage}
                            onChange={e => setNewPercentage(e.target.value)}
                            required
                            className="ent-input w-full"
                        />
                    </div>
                    <div className="ent-form-group">
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Description</label>
                        <input
                            type="text"
                            placeholder="Optional"
                            value={newDescription}
                            onChange={e => setNewDescription(e.target.value)}
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
                            ADD TAX
                        </button>
                    </div>
                </form>

                {/* Suggestions Section */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Common Suggestions</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { name: 'GST 18%', percentage: '18', description: 'Standard GST Rate' },
                            { name: 'GST 12%', percentage: '12', description: 'Reduced GST Rate' },
                            { name: 'GST 5%', percentage: '5', description: 'Essential GST Rate' },
                            { name: 'GST 28%', percentage: '28', description: 'Luxury GST Rate' },
                            { name: 'VAT 15%', percentage: '15', description: 'Standard VAT' },
                            { name: 'No Tax', percentage: '0', description: 'Exempt' }
                        ].map((sug) => (
                            <button
                                key={sug.name}
                                type="button"
                                onClick={() => {
                                    setNewName(sug.name);
                                    setNewPercentage(sug.percentage);
                                    setNewDescription(sug.description);
                                }}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:border-primary-600 hover:text-primary-600 transition-all cursor-pointer"
                            >
                                {sug.name}
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
                            <th className="text-right px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Rate</th>
                            <th className="text-left px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Description</th>
                            <th className="text-right px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {taxes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-xs text-slate-400">No tax rates configured.</td>
                            </tr>
                        ) : (
                            taxes.map(tax => (
                                <tr key={tax.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-xs font-bold text-slate-900">{tax.name}</td>
                                    <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right">{Number(tax.percentage).toFixed(2)}%</td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{tax.description || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(tax.id)}
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
