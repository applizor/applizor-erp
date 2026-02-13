'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { FileText, Save, Plus, Trash2, CheckCircle } from 'lucide-react';

export default function TaxDeclarationPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [regime, setRegime] = useState<'old' | 'new'>('new');
    const [investments, setInvestments] = useState<any[]>([]);
    const [declaration, setDeclaration] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Get current user's employee ID (assuming stored in user object or fetched via session)
            const user = await api.get('/auth/me').then(res => res.data);
            if (!user.employeeId) return toast.error('Employee profile not found');

            const res = await api.get(`/payroll/declarations/${user.employeeId}`);
            const current = res.data.find((d: any) => d.financialYear === '2025-26');

            if (current) {
                setDeclaration(current);
                setRegime(current.regime);
                setInvestments(current.investments);
            }
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const addInvestment = () => {
        setInvestments([...investments, { section: '80C', componentName: '', declaredAmount: 0 }]);
    };

    const removeInvestment = (index: number) => {
        setInvestments(investments.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            const user = await api.get('/auth/me').then(res => res.data);
            await api.post('/payroll/declarations/submit', {
                employeeId: user.employeeId,
                financialYear: '2025-26',
                regime,
                investments
            });
            toast.success('Tax Declaration Submitted Successfully');
        } catch (error) {
            toast.error('Submission failed');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black uppercase text-gray-900">Tax Planning Portal</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">FY 2025-26 • Investment Declaration</p>
                </div>
                <Button onClick={handleSave} className="btn-primary">
                    <Save size={14} className="mr-2" /> Submit Declaration
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Regime Selection */}
                <Card className="ent-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                            Tax Regime Selection
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div
                            className={`p-4 rounded-md border-2 cursor-pointer transition-all ${regime === 'new' ? 'border-primary-600 bg-primary-50' : 'border-gray-100'}`}
                            onClick={() => setRegime('new')}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold">New Tax Regime</span>
                                {regime === 'new' && <CheckCircle className="text-primary-600" size={16} />}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Lower tax rates, no deductions allowed except Standard Deduction.</p>
                        </div>

                        <div
                            className={`p-4 rounded-md border-2 cursor-pointer transition-all ${regime === 'old' ? 'border-primary-600 bg-primary-50' : 'border-gray-100'}`}
                            onClick={() => setRegime('old')}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold">Old Tax Regime</span>
                                {regime === 'old' && <CheckCircle className="text-primary-600" size={16} />}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Higher rates, but 80C, 80D, HRA deductions are applicable.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Investment List */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="ent-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase">Deduction & Investment Proofs</CardTitle>
                            <Button variant="outline" size="sm" onClick={addInvestment} className="h-8 text-[10px] uppercase font-bold tracking-widest">
                                <Plus size={12} className="mr-1" /> Add Component
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Section</th>
                                            <th className="py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Description</th>
                                            <th className="py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Amount (Declared)</th>
                                            <th className="py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {investments.map((inv, index) => (
                                            <tr key={index}>
                                                <td className="py-3 pr-4">
                                                    <select
                                                        value={inv.section}
                                                        onChange={(e) => {
                                                            const newInv = [...investments];
                                                            newInv[index].section = e.target.value;
                                                            setInvestments(newInv);
                                                        }}
                                                        className="ent-input w-24 h-8 py-0 uppercase"
                                                    >
                                                        <option>80C</option>
                                                        <option>80D</option>
                                                        <option>HRA</option>
                                                        <option>Others</option>
                                                    </select>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <input
                                                        type="text"
                                                        value={inv.componentName}
                                                        onChange={(e) => {
                                                            const newInv = [...investments];
                                                            newInv[index].componentName = e.target.value;
                                                            setInvestments(newInv);
                                                        }}
                                                        placeholder="e.g. PPF, LIC, Rent"
                                                        className="ent-input w-full h-8 py-0"
                                                    />
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <input
                                                        type="number"
                                                        value={inv.declaredAmount}
                                                        onChange={(e) => {
                                                            const newInv = [...investments];
                                                            newInv[index].declaredAmount = Number(e.target.value);
                                                            setInvestments(newInv);
                                                        }}
                                                        className="ent-input w-32 h-8 py-0 font-bold"
                                                    />
                                                </td>
                                                <td className="py-3 text-center">
                                                    <button onClick={() => removeInvestment(index)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-md transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {investments.length === 0 && (
                                    <div className="py-12 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No investments declared yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
