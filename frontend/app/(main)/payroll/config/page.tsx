'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';
import { ShieldCheck, Save, Percent, IndianRupee, Info, AlertTriangle, Activity } from 'lucide-react';

export default function StatutoryConfigPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        pfEmployeeRate: 12,
        pfEmployerRate: 12,
        pfBasicLimit: 15000,
        esiEmployeeRate: 0.75,
        esiEmployerRate: 3.25,
        esiGrossLimit: 21000,
        professionalTaxEnabled: true,
        tdsEnabled: true
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const res = await api.get('/payroll/statutory-config');
            if (res.data) setConfig(res.data);
        } catch (error) {
            console.error('Failed to load config:', error);
            // If 404, we use defaults
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.post('/payroll/statutory-config', config);
            toast.success('Compliance Registry Updated');
        } catch (error) {
            console.error(error);
            toast.error('Synchronization failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" className="text-primary-600 mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Compliance Matrix...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-5 rounded-md border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase leading-none">Statutory Configuration</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            FinOps Registry <Percent size={10} className="text-primary-600" /> Compliance Parameters
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary py-2.5 px-6 flex items-center gap-2 shadow-lg shadow-primary-900/10 disabled:opacity-50"
                >
                    {saving ? <LoadingSpinner size="sm" /> : <Save size={16} />}
                    Finalize Governance
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Provident Fund (PF) */}
                <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Info size={100} className="text-primary-900" />
                    </div>

                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="h-8 w-8 rounded bg-primary-50 flex items-center justify-center">
                            <Percent size={14} className="text-primary-600" />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Provident Fund (EPF)</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="ent-form-group">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Employee Contribution %</label>
                            <input
                                type="number"
                                value={config.pfEmployeeRate}
                                onChange={(e) => setConfig({ ...config, pfEmployeeRate: parseFloat(e.target.value) })}
                                className="ent-input w-full"
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Employer Contribution %</label>
                            <input
                                type="number"
                                value={config.pfEmployerRate}
                                onChange={(e) => setConfig({ ...config, pfEmployerRate: parseFloat(e.target.value) })}
                                className="ent-input w-full"
                            />
                        </div>
                    </div>

                    <div className="ent-form-group">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Statutory Basic Cap (INR)</label>
                        <div className="relative">
                            <IndianRupee size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="number"
                                value={config.pfBasicLimit}
                                onChange={(e) => setConfig({ ...config, pfBasicLimit: parseFloat(e.target.value) })}
                                className="ent-input w-full pl-8"
                            />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 italic">Typically ₹15,000 as per Indian labor law standards.</p>
                    </div>
                </div>

                {/* ESI Configuration */}
                <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="h-8 w-8 rounded bg-emerald-50 flex items-center justify-center">
                            <Activity size={14} className="text-emerald-600" />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">ESIC Parameters</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="ent-form-group">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Employee Rate %</label>
                            <input
                                type="number"
                                value={config.esiEmployeeRate}
                                step="0.01"
                                onChange={(e) => setConfig({ ...config, esiEmployeeRate: parseFloat(e.target.value) })}
                                className="ent-input w-full"
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Employer Rate %</label>
                            <input
                                type="number"
                                value={config.esiEmployerRate}
                                step="0.01"
                                onChange={(e) => setConfig({ ...config, esiEmployerRate: parseFloat(e.target.value) })}
                                className="ent-input w-full"
                            />
                        </div>
                    </div>

                    <div className="ent-form-group">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Gross Salary Threshold (INR)</label>
                        <div className="relative">
                            <IndianRupee size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="number"
                                value={config.esiGrossLimit}
                                onChange={(e) => setConfig({ ...config, esiGrossLimit: parseFloat(e.target.value) })}
                                className="ent-input w-full pl-8"
                            />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 italic">Standard threshold ₹21,000 for ESIC eligibility.</p>
                    </div>
                </div>

                {/* Tax & PT Controls */}
                <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm md:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="h-8 w-8 rounded bg-amber-50 flex items-center justify-center">
                            <AlertTriangle size={14} className="text-amber-600" />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Global Governance Toggles</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md">
                            <div>
                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Professional Tax (PT) Logic</p>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Automate state-specific PT deductions</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, professionalTaxEnabled: !config.professionalTaxEnabled })}
                                className={`w-12 h-6 rounded-full transition-all relative ${config.professionalTaxEnabled ? 'bg-primary-900' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.professionalTaxEnabled ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md">
                            <div>
                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Income Tax (TDS) Estimates</p>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Enable automated TDS slab calculations</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, tdsEnabled: !config.tdsEnabled })}
                                className={`w-12 h-6 rounded-full transition-all relative ${config.tdsEnabled ? 'bg-primary-900' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.tdsEnabled ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-md">
                        <p className="text-[10px] text-amber-800 font-bold leading-relaxed flex items-center gap-2">
                            <Info size={14} />
                            NOTE: Updating these parameters will affect all UNAPPROVED payroll cycles immediately. Approved and Paid cycles remain locked against configuration drift.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
