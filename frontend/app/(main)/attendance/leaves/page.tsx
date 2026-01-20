'use client';

import { useEffect, useState } from 'react';
import { leavesApi, LeaveType } from '@/lib/api/attendance';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, FileText } from 'lucide-react';
import { LeaveBalanceCards } from '@/components/attendance/LeaveBalanceCards';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface LeaveRequest {
    id: string;
    leaveType: { name: string };
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    days: number;
    category?: string;
}

export default function MyLeavesPage() {
    const toast = useToast();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [balances, setBalances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        durationType: 'multiple' as 'full' | 'multiple' | 'first_half' | 'second_half',
        attachmentPath: '',
        category: ''
    });
    const [uploading, setUploading] = useState(false);
    const [calculatedDays, setCalculatedDays] = useState<number | null>(null);
    const [calculating, setCalculating] = useState(false);
    const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
    const [proofRequired, setProofRequired] = useState(false);
    const [insufficientBalance, setInsufficientBalance] = useState(false);
    const [lopWarning, setLopWarning] = useState<string | null>(null);

    useEffect(() => {
        if (formData.startDate && formData.endDate && formData.leaveTypeId) {
            checkDays();
        } else {
            setCalculatedDays(null);
        }
    }, [formData.startDate, formData.endDate, formData.leaveTypeId]);

    useEffect(() => {
        validatePolicy();
    }, [formData, calculatedDays, leaveTypes, balances]);

    const validatePolicy = () => {
        const type = leaveTypes.find(t => t.id === formData.leaveTypeId);
        if (!type) {
            setValidationWarnings([]);
            setProofRequired(false);
            setInsufficientBalance(false);
            return;
        }

        const policy = typeof type.policySettings === 'string'
            ? JSON.parse(type.policySettings)
            : type.policySettings || {};

        const warnings: string[] = [];
        let isProofNeeded = false;
        let balanceExceeded = false;

        // 0. Balance Check (LOP Warning)
        if (calculatedDays && calculatedDays > 0) {
            const balanceRecord = balances.find((b: any) => b.leaveType.id === formData.leaveTypeId);
            if (balanceRecord) {
                // Check if remaining balance is enough
                if (calculatedDays > balanceRecord.remaining) {
                    const lopDays = calculatedDays - balanceRecord.remaining;
                    // Instead of blocking, set LOP Warning
                    setLopWarning(`Insufficient Balance (Remaining: ${balanceRecord.remaining}). This application will result in ${lopDays} days of Loss of Pay (LOP).`);
                } else {
                    setLopWarning(null);
                }
            }
        }
        setInsufficientBalance(false); // Never block on balance now

        // 1. Proof Requirement
        const minDaysProof = policy.minDaysForProof || 0;
        if (type.proofRequired) {
            // If threshold set, check days. Else always required.
            if (minDaysProof > 0) {
                if (calculatedDays && calculatedDays > minDaysProof) {
                    isProofNeeded = true;
                    warnings.push(`Proof is required for leaves exceeding ${minDaysProof} days.`);
                }
            } else {
                isProofNeeded = true;
            }
        }
        setProofRequired(isProofNeeded);

        // 2. Notice Period
        const noticePeriod = policy.noticePeriod || 0;
        const minDaysNotice = policy.minDaysForNotice || 0;

        if (noticePeriod > 0 && formData.startDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const start = new Date(formData.startDate);

            // Check threshold first
            if (calculatedDays && calculatedDays > minDaysNotice) {
                const diffTime = start.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < noticePeriod) {
                    warnings.push(`Policy requires ${noticePeriod} days advance notice for this leave duration.`);
                }
            }
        }

        // 3. Calendar Days
        if (policy.includeNonWorkingDays) {
            // Just a visual cue, not a warning unless we want to be strict
            // warnings.push("Note: Weekends & Holidays are counted as leave days.");
        }

        setValidationWarnings(warnings);
    };

    const checkDays = async () => {
        if (formData.durationType === 'first_half' || formData.durationType === 'second_half') {
            setCalculatedDays(0.5);
            return;
        }

        try {
            setCalculating(true);
            const res = await leavesApi.calculateDays({
                leaveTypeId: formData.leaveTypeId,
                startDate: formData.startDate,
                endDate: formData.endDate
            });
            setCalculatedDays(res.days);
        } catch (error) {
            console.error('Failed to calculate days', error);
            setCalculatedDays(0);
        } finally {
            setCalculating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const res = await leavesApi.uploadAttachment(formDataUpload);
            setFormData(prev => ({ ...prev, attachmentPath: res.filePath }));
            toast.success('File uploaded successfully');
        } catch (error: any) {
            console.error('File upload failed:', error);
            toast.error(error.response?.data?.error || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [leavesData, typesData, balancesData] = await Promise.all([
                leavesApi.getMyLeaves(),
                leavesApi.getTypes(),
                leavesApi.getMyBalances().catch(() => []) // Handle error gracefully if no permission/data
            ]);
            setLeaves(leavesData);
            setLeaveTypes(typesData);
            setBalances(balancesData);
            if (typesData.length > 0) {
                setFormData(prev => ({ ...prev, leaveTypeId: typesData[0].id }));
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await leavesApi.create({
                ...formData,
                endDate: formData.durationType === 'multiple' ? formData.endDate : formData.startDate
            });
            toast.success('Leave request submitted successfully!');
            setIsModalOpen(false);
            setFormData({ ...formData, startDate: '', endDate: '', reason: '', attachmentPath: '', category: '' });
            loadData();
        } catch (error: any) {
            console.error('Failed to apply leave:', error);
            toast.error(error.response?.data?.error || 'Failed to submit leave request');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="flex items-center text-green-700 bg-green-100 px-2 py-1 rounded text-xs"><CheckCircle size={12} className="mr-1" /> Approved</span>;
            case 'rejected': return <span className="flex items-center text-red-700 bg-red-100 px-2 py-1 rounded text-xs"><XCircle size={12} className="mr-1" /> Rejected</span>;
            default: return <span className="flex items-center text-yellow-700 bg-yellow-100 px-2 py-1 rounded text-xs"><Clock size={12} className="mr-1" /> Pending</span>;
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">My Leaves</h2>
                    <p className="text-sm text-gray-500">Track and apply for leaves</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                    <Plus size={18} />
                    <span>Apply Leave</span>
                </button>
            </div>

            <LeaveBalanceCards balances={balances} loading={loading} />

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-4 rounded-md shadow animate-pulse flex justify-between">
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                                <div className="h-3 bg-gray-100 rounded w-48"></div>
                            </div>
                            <div className="h-10 bg-gray-100 rounded w-full mt-4"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <ul className="divide-y divide-gray-100">
                        {leaves.length === 0 ? (
                            <li className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center bg-gray-50">
                                <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                                    <AlertCircle size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-gray-900 font-medium mb-1">No Leave Requests</h3>
                                <p className="text-sm text-gray-500">You haven't applied for any leaves yet.</p>
                            </li>
                        ) : (
                            leaves.map((leave) => (
                                <li key={leave.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                        <div className="flex items-start space-x-4">
                                            <div className={`p-2 rounded-lg ${leave.leaveType?.name?.includes('Sick') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <span className="font-semibold text-gray-900">
                                                        {leave.leaveType?.name || 'Unknown Type'}
                                                        {leave.category && <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">{leave.category}</span>}
                                                    </span>
                                                    {getStatusBadge(leave.status)}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center space-x-2">
                                                    <span>{new Date(leave.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    <span>-</span>
                                                    <span>{new Date(leave.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="font-medium text-gray-700">{leave.days} Days</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2 line-clamp-1">{leave.reason}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 sm:mt-0 text-right">
                                            <div className="text-xs text-gray-400 font-mono mb-1">#REF-{leave.id.slice(-6).toUpperCase()}</div>
                                            {leave.status === 'pending' && (
                                                <button className="text-red-600 text-xs hover:underline">Cancel Request</button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">New Leave Request</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
                            {/* Choose Member & Leave Type Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Leave Type <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        value={formData.leaveTypeId}
                                        onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                                        className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
                                    >
                                        {leaveTypes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Duration Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'full', label: 'Full Day' },
                                            { id: 'multiple', label: 'Multiple' },
                                            { id: 'first_half', label: '1st Half' },
                                            { id: 'second_half', label: '2nd Half' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, durationType: opt.id as any }))}
                                                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${formData.durationType === opt.id ? 'bg-primary-50 border-primary-600 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Date Selection */}
                            <div className={`grid ${formData.durationType === 'multiple' ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                        {formData.durationType === 'multiple' ? 'From Date' : 'Date'}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="block w-full rounded-lg border-gray-300 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
                                    />
                                </div>
                                {formData.durationType === 'multiple' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="block w-full rounded-lg border-gray-300 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Duration Summary */}
                            {formData.startDate && formData.endDate && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex justify-between items-center text-blue-800 text-sm">
                                    <span className="font-medium">Actual Leave Days:</span>
                                    {calculating ? (
                                        <span className="text-gray-500 font-medium animate-pulse text-sm">Calculating...</span>
                                    ) : (
                                        <span className="font-bold text-lg">{calculatedDays ?? 0} Days</span>
                                    )}
                                </div>
                            )}

                            {/* Validation Warnings */}
                            {validationWarnings.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                                    {validationWarnings.map((warn, i) => (
                                        <div key={i} className="flex items-start text-amber-800 text-sm">
                                            <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                                            <span>{warn}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* LOP Warning Alert */}
                            {lopWarning && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start text-orange-800 text-sm">
                                    <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="font-bold block mb-1">Loss of Pay Warning</span>
                                        {lopWarning}
                                        <span className="block text-xs mt-1 text-orange-700">Salary deduction will be applied for the LOP days.</span>
                                    </div>
                                </div>
                            )}

                            {/* Calendar Days Note */}
                            {(() => {
                                const type = leaveTypes.find(t => t.id === formData.leaveTypeId);
                                const policy = type?.policySettings as any;
                                if (policy?.includeNonWorkingDays) {
                                    return (
                                        <div className="flex items-center text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100 mb-2">
                                            <AlertCircle size={14} className="mr-1.5" />
                                            Note: This leave type includes weekends and holidays in the day count.
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Category Selection (Sick/Casual) - Unified */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Leave Category <span className="text-gray-400 font-normal normal-case">(Specify if applicable)</span></label>
                                <div className="flex space-x-4">
                                    {['Sick', 'Casual'].map((cat) => (
                                        <label key={cat} className={`flex-1 relative flex items-center justify-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 focus:outline-none ${formData.category === cat ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'}`}>
                                            <input
                                                type="radio"
                                                name="leaveCategory"
                                                value={cat}
                                                checked={formData.category === cat}
                                                onChange={() => setFormData({ ...formData, category: cat })}
                                                className="sr-only"
                                            />
                                            <span className={`text-sm font-medium ${formData.category === cat ? 'text-primary-900' : 'text-gray-900'}`}>{cat}</span>
                                        </label>
                                    ))}
                                    <label className={`flex-1 relative flex items-center justify-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 focus:outline-none ${!formData.category ? 'bg-gray-100 border-gray-300' : 'border-gray-200'}`}>
                                        <input
                                            type="radio"
                                            name="leaveCategory"
                                            value=""
                                            checked={!formData.category}
                                            onChange={() => setFormData({ ...formData, category: '' })}
                                            className="sr-only"
                                        />
                                        <span className="text-sm font-medium text-gray-500">None</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Reason for Absence <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="block w-full rounded-lg border-gray-300 p-3 text-sm focus:border-primary-500 focus:ring-primary-500 resize-none"
                                    placeholder="e.g. Feeling unwell, Family emergency..."
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                    Attachment {proofRequired ? <span className="text-red-500">* (Proof Required)</span> : <span className="font-normal normal-case text-gray-400">(Optional)</span>}
                                </label>
                                <div className="mt-1 flex items-center space-x-4">
                                    <input
                                        type="file"
                                        onChange={handleFileUpload}
                                        className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                    />
                                    {uploading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>}
                                    {formData.attachmentPath && <CheckCircle size={18} className="text-green-500" />}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">PDF, DOC, DOCX and Images up to 5MB</p>
                            </div>

                            <div className="pt-4 flex items-center justify-end space-x-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={(proofRequired && !formData.attachmentPath) || insufficientBalance || submitting}
                                    className={`px-5 py-2.5 text-white rounded-lg text-sm font-medium shadow-lg transition-all transform hover:scale-[1.02] flex items-center space-x-2 ${(proofRequired && !formData.attachmentPath) || insufficientBalance || submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30'}`}
                                >
                                    {submitting && <LoadingSpinner size="sm" />}
                                    <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
