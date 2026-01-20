'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import { leaveTypesApi, LeaveType } from '@/lib/api/attendance';
import { departmentsApi, positionsApi } from '@/lib/api/hrms';
import { Trash2, Edit, Plus, Info, Check, X, Settings, ShieldAlert, Calendar } from 'lucide-react';

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

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this leave type?')) {
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
        <div className="px-4 py-6 sm:px-0">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Leave Types Configuration</h1>
                        <p className="text-sm text-gray-500">Define leave policies, limits, and carry-forward rules.</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 shadow-sm"
                    >
                        <Plus size={18} />
                        <span>Add Leave Type</span>
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Leave Type</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Entitlement</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Scope</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Restrictions</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 animate-pulse">Loading settings...</td></tr>
                            ) : leaveTypes.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No leave types defined. Create one to get started.</td></tr>
                            ) : (
                                leaveTypes.map((type) => (
                                    <tr key={type.id} className="hover:bg-gray-50 group transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span
                                                    className="flex-shrink-0 h-4 w-4 rounded-full mr-3 ring-2 ring-white shadow-sm"
                                                    style={{ backgroundColor: type.color || '#3B82F6' }}
                                                ></span>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">{type.name}</div>
                                                    <div className="text-xs text-gray-400">{type.description || 'No description'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-sm font-semibold text-gray-900">{type.days} Days/Year</div>
                                            {type.monthlyLimit > 0 && (
                                                <div className="text-xs text-orange-600">Max {type.monthlyLimit}/month</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {/* Scope Column */}
                                            <div className="text-xs">
                                                {(!type.departmentIds || type.departmentIds.length === 0) && (!type.positionIds || type.positionIds.length === 0) ? (
                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">Global</span>
                                                ) : (
                                                    <div className="flex flex-col space-y-1 items-center">
                                                        {type.departmentIds && type.departmentIds.length > 0 && (
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                                {type.departmentIds.length === departments.length ? 'All Depts' : `${type.departmentIds.length} Depts`}
                                                            </span>
                                                        )}
                                                        {type.positionIds && type.positionIds.length > 0 && (
                                                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                                                {type.positionIds.length === positions.length ? 'All Roles' : `${type.positionIds.length} Roles`}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col space-y-1 text-xs text-gray-500">
                                                {type.sandwichRule && <span className="flex items-center"><ShieldAlert size={12} className="mr-1 text-red-500" /> Sandwich Rule</span>}
                                                {type.maxConsecutiveDays > 0 && <span className="flex items-center"><Calendar size={12} className="mr-1 text-orange-500" /> Max {type.maxConsecutiveDays} consecutive</span>}
                                                {type.proofRequired && <span className="flex items-center"><Info size={12} className="mr-1 text-blue-500" /> Proof Required</span>}
                                                {!type.sandwichRule && !type.maxConsecutiveDays && !type.proofRequired && <span className="text-gray-300 mx-auto">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={() => handleEdit(type)} className="text-gray-400 hover:text-indigo-600 p-1">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(type.id)} className="text-gray-400 hover:text-red-600 p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Leave Policy' : 'New Leave Policy'}</h3>
                                    <p className="text-sm text-gray-500">Configure rules and limits</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Tabs Header */}
                            <div className="flex border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab('general')}
                                    className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'general' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    General Info
                                </button>
                                <button
                                    onClick={() => setActiveTab('entitlement')}
                                    className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'entitlement' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Entitlement
                                </button>
                                <button
                                    onClick={() => setActiveTab('restrictions')}
                                    className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'restrictions' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Restrictions
                                </button>
                                <button
                                    onClick={() => setActiveTab('assignment')}
                                    className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'assignment' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Assignment
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                                <div className="p-6 space-y-6">

                                    {/* General Tab */}
                                    {activeTab === 'general' && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Name <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border"
                                                    placeholder="e.g. Sick Leave, Privilege Leave"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Color Code</label>
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="color"
                                                        value={formData.color}
                                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                        className="h-10 w-16 p-1 rounded border border-gray-300 cursor-pointer"
                                                    />
                                                    <span className="text-sm text-gray-500">{formData.color}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <textarea
                                                    rows={3}
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border"
                                                    placeholder="Brief description of this leave type..."
                                                ></textarea>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-900 block">Is Paid Leave?</span>
                                                    <span className="text-xs text-gray-500">Uncheck for Loss of Pay (LOP)</span>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={formData.isPaid} onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Entitlement Tab */}
                                    {activeTab === 'entitlement' && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Annual Quota</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            required
                                                            min="0"
                                                            value={formData.days}
                                                            onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
                                                            className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border"
                                                        />
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">Days</div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Limit</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={formData.monthlyLimit}
                                                            onChange={(e) => setFormData({ ...formData, monthlyLimit: parseInt(e.target.value) })}
                                                            className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border"
                                                        />
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">Days</div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">Set 0 for no limit</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <div>
                                                    <span className="text-sm font-medium text-blue-900 block">Is Encashable?</span>
                                                    <span className="text-xs text-blue-700">Allow employees to encash unused balance</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.encashable}
                                                    onChange={(e) => setFormData({ ...formData, encashable: e.target.checked })}
                                                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                />
                                            </div>

                                            <div className="border-t pt-4 mt-4">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-4">Accrual Policy</h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Accrual Type</label>
                                                        <select
                                                            value={formData.accrualType}
                                                            onChange={(e) => setFormData({ ...formData, accrualType: e.target.value as any })}
                                                            className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border"
                                                        >
                                                            <option value="yearly">Yearly (Lump sum at start)</option>
                                                            <option value="monthly">Monthly (Accrual per month)</option>
                                                            <option value="daily">Daily (Accrual per day)</option>
                                                        </select>
                                                    </div>

                                                    {formData.accrualType !== 'yearly' && (
                                                        <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Accrual Rate</label>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={formData.accrualRate}
                                                                        onChange={(e) => setFormData({ ...formData, accrualRate: parseFloat(e.target.value) })}
                                                                        className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border"
                                                                    />
                                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs">
                                                                        Days/{formData.accrualType === 'monthly' ? 'Mo' : 'Day'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Accrual</label>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={formData.maxAccrual}
                                                                        onChange={(e) => setFormData({ ...formData, maxAccrual: parseInt(e.target.value) })}
                                                                        className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border"
                                                                    />
                                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">Days</div>
                                                                </div>
                                                                <p className="text-[10px] text-gray-500 mt-1">Total limit (0 = Unlimited)</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Restrictions Tab */}
                                    {activeTab === 'restrictions' && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Consecutive Days</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.maxConsecutiveDays}
                                                    onChange={(e) => setFormData({ ...formData, maxConsecutiveDays: parseInt(e.target.value) })}
                                                    className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Max days allowed in a single request (0 = unlimited)</p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Min Service Days (Probation)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.minServiceDays}
                                                    onChange={(e) => setFormData({ ...formData, minServiceDays: parseInt(e.target.value) })}
                                                    className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Employee must complete this many days to apply.</p>
                                            </div>

                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-start">
                                                    <div className="flex items-center h-5">
                                                        <input
                                                            id="sandwich"
                                                            type="checkbox"
                                                            checked={formData.sandwichRule}
                                                            onChange={(e) => setFormData({ ...formData, sandwichRule: e.target.checked })}
                                                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm">
                                                        <label htmlFor="sandwich" className="font-medium text-gray-700">Sandwich Rule</label>
                                                        <p className="text-gray-500">If leave is taken on Friday & Monday, count Weekend as leave.</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start">
                                                    <div className="flex items-center h-5">
                                                        <input
                                                            id="proof"
                                                            type="checkbox"
                                                            checked={formData.proofRequired}
                                                            onChange={(e) => setFormData({ ...formData, proofRequired: e.target.checked })}
                                                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm">
                                                        <label htmlFor="proof" className="font-medium text-gray-700">Proof Required</label>
                                                        <p className="text-gray-500">Require document upload (e.g. Medical Certificate).</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dynamic Rules Section */}
                                            <div className="pt-4 border-t border-gray-100 space-y-4">
                                                <h4 className="text-sm font-semibold text-gray-900">Advanced Conditions</h4>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Advance Notice (Days)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={formData.noticePeriod}
                                                            onChange={(e) => setFormData({ ...formData, noticePeriod: parseInt(e.target.value) })}
                                                            className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Notice If Days &gt;</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={formData.minDaysForNotice}
                                                            onChange={(e) => setFormData({ ...formData, minDaysForNotice: parseInt(e.target.value) })}
                                                            className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border"
                                                        />
                                                    </div>
                                                </div>

                                                {formData.proofRequired && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Require Proof if Days &gt;</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={formData.minDaysForProof}
                                                            onChange={(e) => setFormData({ ...formData, minDaysForProof: parseInt(e.target.value) })}
                                                            className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">Example: Set 2 to require proof only for leaves longer than 2 days.</p>
                                                    </div>
                                                )}

                                                <div className="flex items-start">
                                                    <div className="flex items-center h-5">
                                                        <input
                                                            id="calendarDays"
                                                            type="checkbox"
                                                            checked={formData.includeNonWorkingDays}
                                                            onChange={(e) => setFormData({ ...formData, includeNonWorkingDays: e.target.checked })}
                                                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm">
                                                        <label htmlFor="calendarDays" className="font-medium text-gray-700">Detailed Calendar Days</label>
                                                        <p className="text-gray-500">Count Holidays & Weekends as Leave Days (e.g. Bereavement).</p>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    )}

                                    {/* Assignment Tab */}
                                    {activeTab === 'assignment' && (
                                        <div className="space-y-6 animate-fadeIn">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900 mb-2">Applicable Departments</label>
                                                <p className="text-xs text-gray-500 mb-3">If none selected, applies to ALL departments.</p>
                                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded-md bg-gray-50">
                                                    {departments.map(dept => (
                                                        <label key={dept.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.departmentIds?.includes(dept.id)}
                                                                onChange={() => toggleSelection(dept.id, 'departmentIds')}
                                                                className="rounded text-primary-600"
                                                            />
                                                            <span className="text-sm text-gray-700">{dept.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-900 mb-2">Applicable Positions</label>
                                                <p className="text-xs text-gray-500 mb-3">If none selected, applies to ALL positions.</p>
                                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded-md bg-gray-50">
                                                    {positions.map(pos => (
                                                        <label key={pos.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.positionIds?.includes(pos.id)}
                                                                onChange={() => toggleSelection(pos.id, 'positionIds')}
                                                                className="rounded text-purple-600"
                                                            />
                                                            <span className="text-sm text-gray-700">{pos.title}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white focus:outline-none transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none transition-all transform hover:scale-[1.02]"
                                    >
                                        {isEditing ? 'Update Policy' : 'Create Policy'}
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
