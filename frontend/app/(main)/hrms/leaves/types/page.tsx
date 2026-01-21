'use client';

import { useEffect, useState } from 'react';
import { leaveTypesApi, LeaveType } from '@/lib/api/attendance';
import { usePermission } from '@/hooks/usePermission';
import { PermissionGuard } from '@/components/PermissionGuard';
import AccessDenied from '@/components/AccessDenied';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConfirm } from '@/context/ConfirmationContext';

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leave Configuration</h1>
                    <p className="text-sm text-gray-500">Define leave policies, quotas, and rules.</p>
                </div>
                <PermissionGuard module="LeaveType" action="create">
                    <button
                        onClick={handleCreate}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 shadow-sm"
                    >
                        + Add Leave Type
                    </button>
                </PermissionGuard>
            </div>

            {showForm && (
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 mb-8 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            {editingType ? 'Edit Leave Type' : 'New Leave Type'}
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Basic Info */}
                        <div className="md:col-span-3">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="e.g. Annual Leave" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Quota (Days)</label>
                                    <input type="number" required value={formData.days} onChange={e => setFormData({ ...formData, days: parseInt(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">UI Color</label>
                                    <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="mt-1 block w-full h-9 border-gray-300 rounded-md shadow-sm" />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="md:col-span-3 border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Accrual & Limits</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Accrual Type</label>
                                    <select value={formData.accrualType} onChange={e => setFormData({ ...formData, accrualType: e.target.value as any })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        <option value="yearly">Yearly (Lump sum)</option>
                                        <option value="monthly">Monthly Accrual</option>
                                        <option value="daily">Daily Accrual</option>
                                    </select>
                                </div>
                                {formData.accrualType !== 'yearly' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Accrual Rate</label>
                                            <div className="relative">
                                                <input type="number" step="0.01" value={formData.accrualRate} onChange={e => setFormData({ ...formData, accrualRate: parseFloat(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs">
                                                    /{formData.accrualType === 'monthly' ? 'Mo' : 'Day'}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Max Accrual</label>
                                            <input type="number" value={formData.maxAccrual} onChange={e => setFormData({ ...formData, maxAccrual: parseInt(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="0 = Unlimited" />
                                        </div>
                                    </>
                                )}
                                <div className="flex items-center mt-6">
                                    <input type="checkbox" checked={formData.carryForward} onChange={e => setFormData({ ...formData, carryForward: e.target.checked })} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                                    <label className="ml-2 block text-sm text-gray-900">Allow Carry Forward</label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Carry Forward</label>
                                    <input type="number" disabled={!formData.carryForward} value={formData.maxCarryForward} onChange={e => setFormData({ ...formData, maxCarryForward: parseInt(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Monthly Usage Limit</label>
                                    <input type="number" value={formData.monthlyLimit} onChange={e => setFormData({ ...formData, monthlyLimit: parseInt(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="0 = Unlimited" />
                                    <p className="text-xs text-gray-500">Max days allowed per month</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Consecutive Days Limit</label>
                                    <input type="number" value={formData.maxConsecutiveDays} onChange={e => setFormData({ ...formData, maxConsecutiveDays: parseInt(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="0 = Unlimited" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Min Service (Days)</label>
                                    <input type="number" value={formData.minServiceDays} onChange={e => setFormData({ ...formData, minServiceDays: parseInt(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                    <p className="text-xs text-gray-500">Wait period before eligible</p>
                                </div>
                                <div className="border-t border-gray-100 md:col-span-3 mt-2 pt-2">
                                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Probation & Confirmation</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Probation Quota</label>
                                            <input type="number" step="0.5" value={formData.probationQuota} onChange={e => setFormData({ ...formData, probationQuota: parseFloat(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                            <p className="text-xs text-gray-500">Leaves allowed during probation</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Confirmation Bonus</label>
                                            <input type="number" step="0.5" value={formData.confirmationBonus} onChange={e => setFormData({ ...formData, confirmationBonus: parseFloat(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-primary-600 font-bold" />
                                            <p className="text-xs text-gray-500">Auto-added after probation ends</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Quarterly Limit</label>
                                            <input type="number" value={formData.quarterlyLimit} onChange={e => setFormData({ ...formData, quarterlyLimit: parseInt(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                            <p className="text-xs text-gray-500">Max days per quarter (CL/SL)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Special Rules */}
                        <div className="md:col-span-3 border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Advanced Policies</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <label className="flex items-start">
                                    <input type="checkbox" checked={formData.isPaid} onChange={e => setFormData({ ...formData, isPaid: e.target.checked })} className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    <span className="ml-2">
                                        <span className="block text-sm font-medium text-gray-900">Paid Leave</span>
                                        <span className="block text-xs text-gray-500">Salary is not deducted</span>
                                    </span>
                                </label>
                                <label className="flex items-start">
                                    <input type="checkbox" checked={formData.sandwichRule} onChange={e => setFormData({ ...formData, sandwichRule: e.target.checked })} className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    <span className="ml-2">
                                        <span className="block text-sm font-medium text-gray-900">Sandwich Rule</span>
                                        <span className="block text-xs text-gray-500">Includes weekends/holidays if leave taken around them</span>
                                    </span>
                                </label>
                                <label className="flex items-start">
                                    <input type="checkbox" checked={formData.encashable} onChange={e => setFormData({ ...formData, encashable: e.target.checked })} className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    <span className="ml-2">
                                        <span className="block text-sm font-medium text-gray-900">Encashable</span>
                                        <span className="block text-xs text-gray-500">Unused days can be paid out</span>
                                    </span>
                                </label>
                                <label className="flex items-start">
                                    <input type="checkbox" checked={formData.proofRequired} onChange={e => setFormData({ ...formData, proofRequired: e.target.checked })} className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    <span className="ml-2">
                                        <span className="block text-sm font-medium text-gray-900">Proof Required</span>
                                        <span className="block text-xs text-gray-500">Must upload document</span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Dynamic Rules Section */}
                        <div className="md:col-span-3 border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Advanced Conditions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Advance Notice (Days)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" min="0" value={formData.noticePeriod} onChange={e => setFormData({ ...formData, noticePeriod: parseInt(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="Notice Days" />
                                        <input type="number" min="0" value={formData.minDaysForNotice} onChange={e => setFormData({ ...formData, minDaysForNotice: parseInt(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="If Leave > X" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">E.g. Require 14 days notice if leave greater than 4 days.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Proof Required Threshold</label>
                                    <input type="number" min="0" value={formData.minDaysForProof} onChange={e => setFormData({ ...formData, minDaysForProof: parseInt(e.target.value) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="0 = Always" />
                                    <p className="text-xs text-gray-500 mt-1">Require proof only if leave exceeds X days.</p>
                                </div>

                                <div className="flex items-center pt-6">
                                    <input type="checkbox" checked={formData.includeNonWorkingDays} onChange={e => setFormData({ ...formData, includeNonWorkingDays: e.target.checked })} className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    <label className="ml-2 block text-sm text-gray-900">
                                        Detailed Calendar Days
                                        <span className="block text-xs text-gray-500">Count Holidays & Weekends as Leave (e.g. Bereavement)</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-3 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2">
                                {saving && <LoadingSpinner size="sm" />}
                                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {types.map(type => (
                    <div key={type.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="h-2 w-full absolute top-0" style={{ backgroundColor: type.color }}></div>
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{type.name}</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">{type.days} Days / {type.frequency}</p>
                                </div>
                                <div className="flex flex-col items-end space-y-1">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${type.isPaid ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                        {type.isPaid ? 'Paid' : 'Unpaid'}
                                    </span>
                                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 uppercase tracking-wide">
                                        {type.accrualType}
                                    </span>
                                </div>
                            </div>

                            {type.description && (
                                <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-md italic border border-gray-100 line-clamp-2">"{type.description}"</p>
                            )}

                            <div className="space-y-4">
                                {/* Section 1: Limits & Accrual */}
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">Policy Limits</h4>
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Monthly Limit:</span>
                                            <span className="font-medium text-gray-900">{type.monthlyLimit > 0 ? `${type.monthlyLimit} Days` : 'Unlimited'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Consecutive:</span>
                                            <span className="font-medium text-gray-900">{type.maxConsecutiveDays > 0 ? `${type.maxConsecutiveDays} Days` : 'Unlimited'}</span>
                                        </div>
                                        {type.accrualType !== 'yearly' && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Accrual Rate:</span>
                                                    <span className="font-medium text-gray-900">{type.accrualRate || 0}/{type.accrualType === 'monthly' ? 'Mo' : 'Day'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Max Accrual:</span>
                                                    <span className="font-medium text-gray-900">{(type.maxAccrual ?? 0) > 0 ? type.maxAccrual : '∞'}</span>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Min Service:</span>
                                            <span className="font-medium text-gray-900">{type.minServiceDays} Days</span>
                                        </div>
                                        {type.quarterlyLimit ? (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Quarterly Limit:</span>
                                                <span className="font-medium text-primary-600">{type.quarterlyLimit} Days</span>
                                            </div>
                                        ) : null}
                                        {type.probationQuota ? (
                                            <div className="flex justify-between border-t border-dashed border-gray-100 mt-1 pt-1">
                                                <span className="text-gray-500 text-[11px]">Probation Quota:</span>
                                                <span className="font-medium text-gray-900 text-[11px]">{type.probationQuota} Days</span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Section 2: Boolean Rules */}
                                <div className="pt-3 border-t border-gray-100">
                                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">Rules & Settings</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Existing Rules */}
                                        {type.carryForward ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                ✅ Carry Fwd (Max {type.maxCarryForward})
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                                                ❌ No Carry Fwd
                                            </span>
                                        )}

                                        {type.sandwichRule && (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                🥪 Sandwich Rule
                                            </span>
                                        )}

                                        {type.encashable && (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                💰 Encashable
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
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100">
                                                            📎 Proof {policy.minDaysForProof ? `> ${policy.minDaysForProof} Days` : 'Req'}
                                                        </span>
                                                    )}

                                                    {type.confirmationBonus ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse">
                                                            🎁 Bonus: +{type.confirmationBonus} Days
                                                        </span>
                                                    ) : null}

                                                    {policy.noticePeriod > 0 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                                                            ⏳ Notice: {policy.noticePeriod} Days
                                                        </span>
                                                    )}

                                                    {policy.includeNonWorkingDays && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                                                            📅 Calendar Days
                                                        </span>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end space-x-3">
                                <PermissionGuard module="LeaveType" action="update">
                                    <button onClick={() => handleEdit(type)} className="text-primary-600 hover:text-primary-800 text-sm font-semibold flex items-center">
                                        Edit Policy
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard module="LeaveType" action="delete">
                                    <button onClick={() => handleDelete(type.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Delete</button>
                                </PermissionGuard>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
