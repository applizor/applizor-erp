'use client';

import { useEffect, useState } from 'react';
import { leaveTypesApi, LeaveType } from '@/lib/api/attendance';
import { usePermission } from '@/hooks/usePermission';
import { PermissionGuard } from '@/components/PermissionGuard';
import AccessDenied from '@/components/AccessDenied';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConfirm } from '@/context/ConfirmationContext';
import PageHeader from '@/components/ui/PageHeader';
import { Settings, Sliders } from 'lucide-react';

export default function LeaveTypesPage() {
    const { can, user } = usePermission();
    const toast = useToast();
    const [types, setTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingType, setEditingType] = useState<LeaveType | null>(null);
    const [saving, setSaving] = useState(false);

    // Page Level Security
    if (user && !can('LeaveType', 'read')) {
        return <AccessDenied />;
    }

    // Form Data
    const [formData, setFormData] = useState<Partial<LeaveType> & {
        noticePeriod: number;
        minDaysForNotice: number;
        minDaysForProof: number;
        includeNonWorkingDays: boolean;
    }>({
        name: '',
        days: 12,
        isPaid: true,
        description: '',
        frequency: 'yearly',
        carryForward: true,
        maxCarryForward: 5,
        monthlyLimit: 2,
        maxConsecutiveDays: 10,
        minServiceDays: 0,
        sandwichRule: false,
        encashable: false,
        proofRequired: false,
        color: '#3B82F6',
        accrualType: 'yearly',
        accrualRate: 0,
        maxAccrual: 0,
        quarterlyLimit: 0,
        probationQuota: 0,
        confirmationBonus: 0,
        // Dynamic
        noticePeriod: 0,
        minDaysForNotice: 0,
        minDaysForProof: 0,
        includeNonWorkingDays: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await leaveTypesApi.getAll();
            setTypes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (type: LeaveType) => {
        const policy = typeof type.policySettings === 'string'
            ? JSON.parse(type.policySettings)
            : type.policySettings || {};

        setEditingType(type);
        setFormData({
            ...type,
            accrualRate: type.accrualRate || 0,
            maxAccrual: type.maxAccrual || 0,
            quarterlyLimit: type.quarterlyLimit || 0,
            probationQuota: type.probationQuota || 0,
            confirmationBonus: type.confirmationBonus || 0,
            noticePeriod: policy.noticePeriod || 0,
            minDaysForNotice: policy.minDaysForNotice || 0,
            minDaysForProof: policy.minDaysForProof || 0,
            includeNonWorkingDays: policy.includeNonWorkingDays || false
        });
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingType(null);
        setFormData({
            name: '',
            days: 12,
            isPaid: true,
            description: '',
            frequency: 'yearly',
            carryForward: true,
            maxCarryForward: 5,
            monthlyLimit: 2,
            maxConsecutiveDays: 10,
            minServiceDays: 0,
            sandwichRule: false,
            encashable: false,
            proofRequired: false,
            color: '#3B82F6',
            accrualType: 'yearly',
            accrualRate: 0,
            maxAccrual: 0,
            quarterlyLimit: 0,
            probationQuota: 0,
            confirmationBonus: 0,
            noticePeriod: 0,
            minDaysForNotice: 0,
            minDaysForProof: 0,
            includeNonWorkingDays: false
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                ...formData,
                policySettings: {
                    noticePeriod: formData.noticePeriod,
                    minDaysForNotice: formData.minDaysForNotice,
                    minDaysForProof: formData.minDaysForProof,
                    includeNonWorkingDays: formData.includeNonWorkingDays
                }
            };

            if (editingType) {
                await leaveTypesApi.update(editingType.id, payload);
                toast.success('Leave type updated successfully');
            } else {
                await leaveTypesApi.create(payload);
                toast.success('Leave type created successfully');
            }
            setShowForm(false);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const { confirm } = useConfirm();

    const handleDelete = async (id: string) => {
        if (!await confirm({ message: 'Are you sure?', type: 'danger' })) return;
        try {
            await leaveTypesApi.delete(id);
            toast.success('Leave type deleted successfully');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Leave Configuration"
                subtitle="Define leave policies, quotas, and rules"
                icon={Settings}
                actions={
                    <PermissionGuard module="LeaveType" action="create">
                        <button
                            onClick={handleCreate}
                            className="ent-button-primary"
                        >
                            + Add Leave Type
                        </button>
                    </PermissionGuard>
                }
            />

            {showForm && (
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 mb-8 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            {editingType ? <Settings size={16} /> : <Sliders size={16} />}
                            {editingType ? 'Edit Configuration' : 'New Leave Policy'}
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Basic Info */}
                        <div className="md:col-span-3">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="ent-form-group">
                                    <label className="ent-label">Policy Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="ent-input" placeholder="e.g. Annual Leave" />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Annual Quota</label>
                                    <input type="number" required value={formData.days} onChange={e => setFormData({ ...formData, days: parseInt(e.target.value) })} className="ent-input" />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">UI Color Tag</label>
                                    <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="mt-1 block w-full h-9 border-gray-200 rounded-md cursor-pointer" />
                                </div>
                                <div className="md:col-span-3 ent-form-group">
                                    <label className="ent-label">Description</label>
                                    <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="ent-input" placeholder="Brief description of this leave policy..." />
                                </div>
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="md:col-span-3 pt-2">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Accrual & Limits</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="ent-form-group">
                                    <label className="ent-label">Accrual Type</label>
                                    <select value={formData.accrualType} onChange={e => setFormData({ ...formData, accrualType: e.target.value as any })} className="ent-select">
                                        <option value="yearly">Yearly (Lump sum)</option>
                                        <option value="monthly">Monthly Accrual</option>
                                        <option value="daily">Daily Accrual</option>
                                    </select>
                                </div>
                                {formData.accrualType !== 'yearly' && (
                                    <>
                                        <div className="ent-form-group">
                                            <label className="ent-label">Accrual Rate</label>
                                            <div className="relative">
                                                <input type="number" step="0.01" value={formData.accrualRate} onChange={e => setFormData({ ...formData, accrualRate: parseFloat(e.target.value) })} className="ent-input" />
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-[10px] font-bold">
                                                    /{formData.accrualType === 'monthly' ? 'MO' : 'DAY'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ent-form-group">
                                            <label className="ent-label">Max Accrual Cap</label>
                                            <input type="number" value={formData.maxAccrual} onChange={e => setFormData({ ...formData, maxAccrual: parseInt(e.target.value) })} className="ent-input" placeholder="0 = Unlimited" />
                                        </div>
                                    </>
                                )}

                                <div className="bg-gray-50/50 p-3 rounded-md border border-gray-100 flex items-center gap-3">
                                    <input type="checkbox" checked={formData.carryForward} onChange={e => setFormData({ ...formData, carryForward: e.target.checked })} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                                    <div>
                                        <label className="ent-label mb-0 cursor-pointer" onClick={() => setFormData({ ...formData, carryForward: !formData.carryForward })}>Allow Carry Forward</label>
                                        <p className="text-[9px] text-gray-400">Transfer unused balance to next cycle</p>
                                    </div>
                                </div>

                                <div className="ent-form-group">
                                    <label className="ent-label">Max Carry Forward</label>
                                    <input type="number" disabled={!formData.carryForward} value={formData.maxCarryForward} onChange={e => setFormData({ ...formData, maxCarryForward: parseInt(e.target.value) })} className="ent-input disabled:bg-gray-50 disabled:text-gray-400" />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Monthly Usage Limit</label>
                                    <input type="number" value={formData.monthlyLimit} onChange={e => setFormData({ ...formData, monthlyLimit: parseInt(e.target.value) })} className="ent-input" placeholder="0 = Unlimited" />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Consecutive Days Limit</label>
                                    <input type="number" value={formData.maxConsecutiveDays} onChange={e => setFormData({ ...formData, maxConsecutiveDays: parseInt(e.target.value) })} className="ent-input" placeholder="0 = Unlimited" />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Min Service Required</label>
                                    <div className="relative">
                                        <input type="number" value={formData.minServiceDays} onChange={e => setFormData({ ...formData, minServiceDays: parseInt(e.target.value) })} className="ent-input" />
                                        <span className="absolute right-3 top-2 text-[10px] text-gray-400 font-bold">DAYS</span>
                                    </div>
                                </div>

                                <div className="md:col-span-3 mt-2">
                                    <div className="bg-primary-50/30 rounded-md border border-primary-100/50 p-4">
                                        <h5 className="text-[10px] font-black text-primary-700 uppercase tracking-widest mb-3">Probation & Confirmation Rules</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="ent-form-group">
                                                <label className="ent-label text-primary-600">Probation Quota</label>
                                                <input type="number" step="0.5" value={formData.probationQuota} onChange={e => setFormData({ ...formData, probationQuota: parseFloat(e.target.value) })} className="ent-input border-primary-200 focus:border-primary-400" />
                                            </div>
                                            <div className="ent-form-group">
                                                <label className="ent-label text-primary-600">Confirmation Bonus</label>
                                                <input type="number" step="0.5" value={formData.confirmationBonus} onChange={e => setFormData({ ...formData, confirmationBonus: parseFloat(e.target.value) })} className="ent-input border-primary-200 focus:border-primary-400 font-bold text-primary-700" />
                                            </div>
                                            <div className="ent-form-group">
                                                <label className="ent-label text-primary-600">Quarterly Limit</label>
                                                <input type="number" value={formData.quarterlyLimit} onChange={e => setFormData({ ...formData, quarterlyLimit: parseInt(e.target.value) })} className="ent-input border-primary-200 focus:border-primary-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Special Rules */}
                        <div className="md:col-span-3 pt-2">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Boolean Policies</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <label className="flex items-start p-3 bg-gray-50 rounded-md border border-gray-200 cursor-pointer hover:bg-white hover:border-gray-300 transition-all">
                                    <input type="checkbox" checked={formData.isPaid} onChange={e => setFormData({ ...formData, isPaid: e.target.checked })} className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    <span className="ml-2">
                                        <span className="block text-xs font-bold text-gray-900 uppercase">Paid Leave</span>
                                        <span className="block text-[10px] text-gray-500 mt-0.5">Salary is not deducted</span>
                                    </span>
                                </label>
                                <label className="flex items-start p-3 bg-gray-50 rounded-md border border-gray-200 cursor-pointer hover:bg-white hover:border-gray-300 transition-all">
                                    <input type="checkbox" checked={formData.sandwichRule} onChange={e => setFormData({ ...formData, sandwichRule: e.target.checked })} className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    <span className="ml-2">
                                        <span className="block text-xs font-bold text-gray-900 uppercase">Sandwich Rule</span>
                                        <span className="block text-[10px] text-gray-500 mt-0.5">Include weekends gaps</span>
                                    </span>
                                </label>
                                <label className="flex items-start p-3 bg-gray-50 rounded-md border border-gray-200 cursor-pointer hover:bg-white hover:border-gray-300 transition-all">
                                    <input type="checkbox" checked={formData.encashable} onChange={e => setFormData({ ...formData, encashable: e.target.checked })} className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    <span className="ml-2">
                                        <span className="block text-xs font-bold text-gray-900 uppercase">Encashable</span>
                                        <span className="block text-[10px] text-gray-500 mt-0.5">Pay out unused days</span>
                                    </span>
                                </label>
                                <label className="flex items-start p-3 bg-gray-50 rounded-md border border-gray-200 cursor-pointer hover:bg-white hover:border-gray-300 transition-all">
                                    <input type="checkbox" checked={formData.proofRequired} onChange={e => setFormData({ ...formData, proofRequired: e.target.checked })} className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    <span className="ml-2">
                                        <span className="block text-xs font-bold text-gray-900 uppercase">Proof Required</span>
                                        <span className="block text-[10px] text-gray-500 mt-0.5">Must upload document</span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Dynamic Rules Section */}
                        <div className="md:col-span-3 pt-2">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Advanced Conditions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50/30 p-4 rounded-md border border-gray-100">
                                    <label className="ent-label mb-2">Advance Notice Policy</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Min Notice (Days)</span>
                                            <input type="number" min="0" value={formData.noticePeriod} onChange={e => setFormData({ ...formData, noticePeriod: parseInt(e.target.value) })} className="ent-input" />
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">If Duration &gt; X</span>
                                            <input type="number" min="0" value={formData.minDaysForNotice} onChange={e => setFormData({ ...formData, minDaysForNotice: parseInt(e.target.value) })} className="ent-input" />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-2 font-medium">Example: Require 14 days notice if leave duration exceeds 4 days.</p>
                                </div>

                                <div className="bg-gray-50/30 p-4 rounded-md border border-gray-100">
                                    <div className="ent-form-group mb-4">
                                        <label className="ent-label">Proof Threshold</label>
                                        <div className="flex items-center gap-3">
                                            <input type="number" min="0" value={formData.minDaysForProof} onChange={e => setFormData({ ...formData, minDaysForProof: parseInt(e.target.value) })} className="ent-input w-24" placeholder="0 = Always" />
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Days</span>
                                        </div>
                                        <p className="text-[9px] text-gray-400 mt-1.5 font-medium">Require proof only if leave exceeds this many days.</p>
                                    </div>

                                    <div className="flex items-center pt-2 border-t border-gray-200/50">
                                        <input type="checkbox" checked={formData.includeNonWorkingDays} onChange={e => setFormData({ ...formData, includeNonWorkingDays: e.target.checked })} className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                        <label className="ml-2 block text-xs font-bold text-gray-900 uppercase">
                                            Include Non-Working Days
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-3 flex justify-end space-x-3 pt-6 border-t border-gray-100 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="ent-button-secondary">Cancel</button>
                            <button type="submit" disabled={saving} className="ent-button-primary flex items-center gap-2">
                                {saving && <LoadingSpinner size="sm" />}
                                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {types.map(type => (
                    <div key={type.id} className="ent-card p-5 relative overflow-hidden group hover:border-primary-200">
                        <div className="h-1.5 w-full absolute top-0 left-0" style={{ backgroundColor: type.color }}></div>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{type.name}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{type.days} Days / {type.frequency}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <span className={`ent-badge ${type.isPaid ? 'ent-badge-success' : 'ent-badge-danger'}`}>
                                        {type.isPaid ? 'Paid' : 'Unpaid'}
                                    </span>
                                    <span className="ent-badge bg-gray-100 text-gray-500 border-gray-200">
                                        {type.accrualType}
                                    </span>
                                </div>
                            </div>

                            {type.description && (
                                <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-md italic border border-gray-100 line-clamp-2">"{type.description}"</p>
                            )}

                            <div className="space-y-4">
                                {/* Section 1: Limits & Accrual */}
                                <div className="bg-gray-50/50 rounded-md p-3 border border-gray-100">
                                    <h4 className="text-[10px] uppercase tracking-wider font-black text-gray-400 mb-2 flex items-center gap-1.5">
                                        <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                                        Policy Limits
                                    </h4>
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                                        <div className="flex justify-between items-center group/item hover:bg-white p-1 rounded transition-colors">
                                            <span className="text-gray-500 font-medium">Monthly Limit</span>
                                            <span className="font-bold text-gray-900 tabular-nums">{type.monthlyLimit > 0 ? `${type.monthlyLimit} Days` : '∞'}</span>
                                        </div>
                                        <div className="flex justify-between items-center group/item hover:bg-white p-1 rounded transition-colors">
                                            <span className="text-gray-500 font-medium">Consecutive</span>
                                            <span className="font-bold text-gray-900 tabular-nums">{type.maxConsecutiveDays > 0 ? `${type.maxConsecutiveDays} Days` : '∞'}</span>
                                        </div>
                                        {type.accrualType !== 'yearly' && (
                                            <>
                                                <div className="flex justify-between items-center group/item hover:bg-white p-1 rounded transition-colors">
                                                    <span className="text-gray-500 font-medium">Accrual Rate</span>
                                                    <span className="font-bold text-gray-900 tabular-nums">{type.accrualRate || 0}/{type.accrualType === 'monthly' ? 'Mo' : 'Day'}</span>
                                                </div>
                                                <div className="flex justify-between items-center group/item hover:bg-white p-1 rounded transition-colors">
                                                    <span className="text-gray-500 font-medium">Max Accrual</span>
                                                    <span className="font-bold text-gray-900 tabular-nums">{(type.maxAccrual ?? 0) > 0 ? type.maxAccrual : '∞'}</span>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between items-center group/item hover:bg-white p-1 rounded transition-colors">
                                            <span className="text-gray-500 font-medium">Min Service</span>
                                            <span className="font-bold text-gray-900 tabular-nums">{type.minServiceDays} Days</span>
                                        </div>
                                        {type.quarterlyLimit ? (
                                            <div className="flex justify-between items-center group/item hover:bg-white p-1 rounded transition-colors">
                                                <span className="text-gray-500 font-medium">Quarterly Limit</span>
                                                <span className="font-bold text-primary-700 tabular-nums">{type.quarterlyLimit} Days</span>
                                            </div>
                                        ) : null}
                                        {type.probationQuota ? (
                                            <div className="col-span-2 border-t border-dashed border-gray-200 mt-1 pt-1 flex justify-between items-center">
                                                <span className="text-gray-400 font-medium text-[10px]">Probation Quota</span>
                                                <span className="font-bold text-gray-700 text-[10px] tabular-nums">{type.probationQuota} Days</span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Section 2: Boolean Rules */}
                                <div>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Existing Rules */}
                                        {type.carryForward ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                                                Carry Fwd ({type.maxCarryForward})
                                            </span>
                                        ) : null}

                                        {type.sandwichRule && (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">
                                                Sandwich Rule
                                            </span>
                                        )}

                                        {type.encashable && (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wide">
                                                Encashable
                                            </span>
                                        )}

                                        {/* Dynamic Policy Parsing */}
                                        {(() => {
                                            const policy = typeof type.policySettings === 'string'
                                                ? JSON.parse(type.policySettings)
                                                : type.policySettings || {};

                                            return (
                                                <>
                                                    {type.proofRequired && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wide">
                                                            Proof {policy.minDaysForProof ? `> ${policy.minDaysForProof} Days` : 'Req'}
                                                        </span>
                                                    )}

                                                    {type.confirmationBonus ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                                                            + {type.confirmationBonus} Days Bonus
                                                        </span>
                                                    ) : null}

                                                    {policy.noticePeriod > 0 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-wide">
                                                            Notice {policy.noticePeriod} Days
                                                        </span>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest group-hover:text-primary-300 transition-colors">ID: {type.id.toString().slice(0, 4)}</span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <PermissionGuard module="LeaveType" action="update">
                                        <button onClick={() => handleEdit(type)} className="text-xs font-bold text-gray-600 hover:text-primary-600 px-3 py-1.5 rounded bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 transition-all shadow-sm">
                                            Edit Policy
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard module="LeaveType" action="delete">
                                        <button onClick={() => handleDelete(type.id)} className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5 rounded bg-red-50 hover:bg-red-100 border border-transparent transition-all">
                                            Delete
                                        </button>
                                    </PermissionGuard>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
