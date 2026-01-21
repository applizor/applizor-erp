'use client';

import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/context/ConfirmationContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import { leaveTypesApi, LeaveType } from '@/lib/api/attendance';
import { departmentsApi, positionsApi } from '@/lib/api/hrms';
import { Trash2, Edit, Plus, Info, Check, X, Settings, ShieldAlert, Calendar, XCircle, AlertCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function LeaveTypesPage() {
    const toast = useToast();
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Tab State for Modal
    const [activeTab, setActiveTab] = useState<'general' | 'entitlement' | 'restrictions' | 'assignment'>('general');

    const [formData, setFormData] = useState<Partial<LeaveType> & {
        departmentIds: string[],
        positionIds: string[],
        noticePeriod: number,
        minDaysForNotice: number,
        minDaysForProof: number,
        includeNonWorkingDays: boolean
    }>({
        name: '', days: 0, isPaid: true, description: '', monthlyLimit: 0,
        maxConsecutiveDays: 0, minServiceDays: 0, sandwichRule: false,
        encashable: false, proofRequired: false, color: '#3B82F6',
        accrualType: 'yearly', accrualRate: 0, maxAccrual: 0,
        departmentIds: [], positionIds: [],
        // Dynamic
        noticePeriod: 0, minDaysForNotice: 0, minDaysForProof: 0, includeNonWorkingDays: false
    });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [typesData, deptsData, posData] = await Promise.all([
                leaveTypesApi.getAll(),
                departmentsApi.getAll(),
                positionsApi.getAll()
            ]);
            setLeaveTypes(typesData);
            setDepartments(deptsData);
            setPositions(posData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (type: LeaveType) => {
        const policy = typeof type.policySettings === 'string'
            ? JSON.parse(type.policySettings)
            : type.policySettings || {};

        setFormData({
            ...type,
            departmentIds: type.departmentIds || [],
            positionIds: type.positionIds || [],
            noticePeriod: policy.noticePeriod || 0,
            minDaysForNotice: policy.minDaysForNotice || 0,
            minDaysForProof: policy.minDaysForProof || 0,
            includeNonWorkingDays: policy.includeNonWorkingDays || false
        });
        setIsEditing(true);
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Pack dynamic settings
            const payload = {
                ...formData,
                policySettings: {
                    noticePeriod: formData.noticePeriod,
                    minDaysForNotice: formData.minDaysForNotice,
                    minDaysForProof: formData.minDaysForProof,
                    includeNonWorkingDays: formData.includeNonWorkingDays
                }
            };

            if (isEditing && formData.id) {
                await leaveTypesApi.update(formData.id, payload as any);
            } else {
                await leaveTypesApi.create(payload as any);
            }
            setIsModalOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to save leave type:', error);
            toast.error('Failed to save leave type');
        }
    };

    const { confirm } = useConfirm();

    const handleDelete = async (id: string) => {
        if (await confirm({ message: 'Are you sure you want to delete this leave type?', type: 'danger' })) {
            try {
                await leaveTypesApi.delete(id);
                loadData();
            } catch (error) {
                console.error('Failed to delete:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', days: 0, isPaid: true, description: '', monthlyLimit: 0,
            maxConsecutiveDays: 0, minServiceDays: 0, sandwichRule: false,
            encashable: false, proofRequired: false, color: '#3B82F6',
            accrualType: 'yearly', accrualRate: 0, maxAccrual: 0,
            departmentIds: [], positionIds: [],
            noticePeriod: 0, minDaysForNotice: 0, minDaysForProof: 0, includeNonWorkingDays: false
        });
        setIsEditing(false);
        setActiveTab('general');
    };

    const toggleSelection = (id: string, field: 'departmentIds' | 'positionIds') => {
        setFormData(prev => {
            const current = prev[field] || [];
            if (current.includes(id)) {
                return { ...prev, [field]: current.filter(x => x !== id) };
            } else {
                return { ...prev, [field]: [...current, id] };
            }
        });
    };

    return (
        <div className="animate-fade-in pb-20">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 px-2">
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-3">
                            Absence Configuration
                            {!loading && leaveTypes.length > 0 && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase font-black tracking-widest">
                                    {leaveTypes.length} POLICIES
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">
                            Statutory settings for leave entitlements, carry-forward rules, and accrual logic.
                        </p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="btn-primary"
                    >
                        <Plus size={16} className="mr-2" /> Initialise Policy
                    </button>
                </div>

                <div className="ent-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Defined Leave Manifest</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="ent-table">
                            <thead>
                                <tr>
                                    <th className="rounded-l-xl">Manifest Identity</th>
                                    <th className="text-center">Statutory Entitlement</th>
                                    <th className="text-center">Functional Scope</th>
                                    <th className="text-center">Constraints</th>
                                    <th className="text-right rounded-r-xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 animate-pulse font-black uppercase text-[10px] tracking-widest">Scanning configurations...</td></tr>
                                ) : leaveTypes.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <AlertCircle size={24} className="text-slate-200 mb-2" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No leave policies discovered</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    leaveTypes.map((type) => (
                                        <tr key={type.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="flex-shrink-0 h-4 w-4 rounded-full ring-2 ring-white shadow-sm"
                                                        style={{ backgroundColor: type.color || '#3B82F6' }}
                                                    ></div>
                                                    <div>
                                                        <div className="text-xs font-black text-slate-900 tracking-tight">{type.name}</div>
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{type.description || 'No description'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <div className="text-[10px] font-black text-slate-900">{type.days} Days/Annum</div>
                                                {type.monthlyLimit > 0 && (
                                                    <div className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter">Cap: {type.monthlyLimit}/MO</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <div className="flex flex-col gap-1 items-center">
                                                    {(!type.departmentIds || type.departmentIds.length === 0) && (!type.positionIds || type.positionIds.length === 0) ? (
                                                        <span className="ent-badge bg-emerald-50 text-emerald-700 border-emerald-100">GLOBAL SCOPE</span>
                                                    ) : (
                                                        <>
                                                            {type.departmentIds && type.departmentIds.length > 0 && (
                                                                <span className="ent-badge bg-indigo-50 text-indigo-700 border-indigo-100">
                                                                    {type.departmentIds.length === departments.length ? 'ALL DEPARTMENTS' : `${type.departmentIds.length} DEPARTMENTS`}
                                                                </span>
                                                            )}
                                                            {type.positionIds && type.positionIds.length > 0 && (
                                                                <span className="ent-badge bg-purple-50 text-purple-700 border-purple-100">
                                                                    {type.positionIds.length === positions.length ? 'ALL POSITIONS' : `${type.positionIds.length} POSITIONS`}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-tight text-slate-500">
                                                    {type.sandwichRule && <span className="flex items-center gap-1"><ShieldAlert size={10} className="text-rose-500" /> Sandwich Rule</span>}
                                                    {type.maxConsecutiveDays > 0 && <span className="flex items-center gap-1"><Calendar size={10} className="text-amber-500" /> Max {type.maxConsecutiveDays} Seq</span>}
                                                    {type.proofRequired && <span className="flex items-center gap-1"><Info size={10} className="text-indigo-500" /> Proof Enforced</span>}
                                                    {!type.sandwichRule && !type.maxConsecutiveDays && !type.proofRequired && <span className="text-slate-300 text-center">-</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(type)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(type.id)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="p-8 border-b border-slate-50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{isEditing ? 'Modify Policy Manifest' : 'Initialise Absence Policy'}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure statutory boundaries & limits</p>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <XCircle size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Tabs Header - Standardized for High Density */}
                            <div className="flex bg-slate-50/50 p-1 mx-8 mt-6 rounded-xl border border-slate-100">
                                {[
                                    { id: 'general', label: 'Identity' },
                                    { id: 'entitlement', label: 'Valuation' },
                                    { id: 'restrictions', label: 'Constraints' },
                                    { id: 'assignment', label: 'Domain' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                                <div className="p-6 space-y-6">

                                    {/* General Tab */}
                                    {activeTab === 'general' && (
                                        <div className="space-y-4 animate-in fade-in duration-300">
                                            <div className="ent-form-group">
                                                <label className="ent-label">Policy Title *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="ent-input"
                                                    placeholder="Priority Statutory Absence"
                                                />
                                            </div>
                                            <div className="ent-form-group">
                                                <label className="ent-label">Visual Taxonomy (Color)</label>
                                                <div className="flex items-center gap-3 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                                    <input
                                                        type="color"
                                                        value={formData.color}
                                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                        className="h-8 w-14 rounded-lg cursor-pointer border-none bg-transparent"
                                                    />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{formData.color}</span>
                                                </div>
                                            </div>
                                            <div className="ent-form-group">
                                                <label className="ent-label">Legal Rationalisation (Description)</label>
                                                <textarea
                                                    rows={2}
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    className="ent-textarea"
                                                    placeholder="Standardised policy guidelines..."
                                                ></textarea>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">Monetary Valuation</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Count as Statutory Paid Leave?</span>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={formData.isPaid} onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })} className="sr-only peer" />
                                                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Entitlement Tab */}
                                    {activeTab === 'entitlement' && (
                                        <div className="space-y-5 animate-in fade-in duration-300">
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="ent-form-group">
                                                    <label className="ent-label">Annual Entitlement *</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            required
                                                            min="0"
                                                            value={formData.days}
                                                            onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 0 })}
                                                            className="ent-input pr-12"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">Days</span>
                                                    </div>
                                                </div>
                                                <div className="ent-form-group">
                                                    <label className="ent-label">Monthly Limit (Cap)</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={formData.monthlyLimit}
                                                            onChange={(e) => setFormData({ ...formData, monthlyLimit: parseInt(e.target.value) || 0 })}
                                                            className="ent-input pr-12"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">Days</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">Encashment Manifest</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Allow unit-to-currency conversion?</span>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={formData.encashable} onChange={(e) => setFormData({ ...formData, encashable: e.target.checked })} className="sr-only peer" />
                                                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                                </label>
                                            </div>

                                            <div className="pt-2">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Accrual Strategy</h4>
                                                <div className="space-y-4">
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Strategy Type</label>
                                                        <select
                                                            value={formData.accrualType}
                                                            onChange={(e) => setFormData({ ...formData, accrualType: e.target.value as any })}
                                                            className="ent-input"
                                                        >
                                                            <option value="yearly">Lump-Sum (Annual Roster)</option>
                                                            <option value="monthly">Progressive (Monthly Ledger)</option>
                                                            <option value="daily">High-Frequency (Daily Allocation)</option>
                                                        </select>
                                                    </div>

                                                    {formData.accrualType !== 'yearly' && (
                                                        <div className="grid grid-cols-2 gap-5 animate-in slide-in-from-top-2 duration-300">
                                                            <div className="ent-form-group">
                                                                <label className="ent-label">Accrual Velocity</label>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={formData.accrualRate}
                                                                        onChange={(e) => setFormData({ ...formData, accrualRate: parseFloat(e.target.value) || 0 })}
                                                                        className="ent-input pr-12"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400 uppercase">{formData.accrualType === 'monthly' ? 'Unit/Mo' : 'Unit/Day'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="ent-form-group">
                                                                <label className="ent-label">Saturation Cap</label>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={formData.maxAccrual}
                                                                        onChange={(e) => setFormData({ ...formData, maxAccrual: parseInt(e.target.value) || 0 })}
                                                                        className="ent-input pr-12"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400 uppercase">Max</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Restrictions Tab */}
                                    {activeTab === 'restrictions' && (
                                        <div className="space-y-5 animate-in fade-in duration-300">
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="ent-form-group">
                                                    <label className="ent-label">Max Consecutive Scope</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.maxConsecutiveDays}
                                                        onChange={(e) => setFormData({ ...formData, maxConsecutiveDays: parseInt(e.target.value) || 0 })}
                                                        className="ent-input"
                                                        placeholder="0 = Unlimited"
                                                    />
                                                </div>
                                                <div className="ent-form-group">
                                                    <label className="ent-label">Probation Threshold</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.minServiceDays}
                                                        onChange={(e) => setFormData({ ...formData, minServiceDays: parseInt(e.target.value) || 0 })}
                                                        className="ent-input"
                                                        placeholder="Min service days"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">Sandwich Protocol</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Count weekends between leaves?</span>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" checked={formData.sandwichRule} onChange={(e) => setFormData({ ...formData, sandwichRule: e.target.checked })} className="sr-only peer" />
                                                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                                                    </label>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">Evidence Enforcement</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Require document upload?</span>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" checked={formData.proofRequired} onChange={(e) => setFormData({ ...formData, proofRequired: e.target.checked })} className="sr-only peer" />
                                                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-50 space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advanced Logical Conditions</h4>

                                                <div className="grid grid-cols-2 gap-5">
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Advance Notice (Days)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={formData.noticePeriod}
                                                            onChange={(e) => setFormData({ ...formData, noticePeriod: parseInt(e.target.value) || 0 })}
                                                            className="ent-input"
                                                        />
                                                    </div>
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Trigger Notice If Val &gt;</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={formData.minDaysForNotice}
                                                            onChange={(e) => setFormData({ ...formData, minDaysForNotice: parseInt(e.target.value) || 0 })}
                                                            className="ent-input"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">Statutory Calendar Logic</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Count holidays/weekends as leave?</span>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" checked={formData.includeNonWorkingDays} onChange={(e) => setFormData({ ...formData, includeNonWorkingDays: e.target.checked })} className="sr-only peer" />
                                                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Assignment Tab */}
                                    {activeTab === 'assignment' && (
                                        <div className="space-y-6 animate-in fade-in duration-300">
                                            <div className="ent-form-group">
                                                <label className="ent-label">Applicable Departmental Domain</label>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-3">Null selection implies global enterprise scope</p>
                                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                    {departments.map(dept => (
                                                        <label key={dept.id} className="group flex items-center gap-2 p-2 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.departmentIds?.includes(dept.id)}
                                                                onChange={() => toggleSelection(dept.id, 'departmentIds')}
                                                                className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{dept.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="ent-form-group">
                                                <label className="ent-label">Target Functional Positions</label>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-3">Null selection implies all positions in scope</p>
                                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                    {positions.map(pos => (
                                                        <label key={pos.id} className="group flex items-center gap-2 p-2 rounded-xl border border-transparent hover:border-purple-100 hover:bg-white transition-all cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.positionIds?.includes(pos.id)}
                                                                onChange={() => toggleSelection(pos.id, 'positionIds')}
                                                                className="rounded border-slate-200 text-purple-600 focus:ring-purple-500"
                                                            />
                                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight group-hover:text-purple-600 transition-colors">{pos.title}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 border-t border-slate-50 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="btn-secondary"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                    >
                                        {isEditing ? 'Synchronise Policy' : 'Execute Initialisation'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
