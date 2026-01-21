'use client';

import { useEffect, useState } from 'react';
import { leavesApi, LeaveType } from '@/lib/api/attendance';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, FileText, Calendar, Info, Trash2 } from 'lucide-react';
import { LeaveBalanceCards } from '@/components/attendance/LeaveBalanceCards';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

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

        if (calculatedDays && calculatedDays > 0) {
            const balanceRecord = balances.find((b: any) => b.leaveType.id === formData.leaveTypeId);
            if (balanceRecord) {
                if (calculatedDays > balanceRecord.remaining) {
                    const lopDays = calculatedDays - balanceRecord.remaining;
                    setLopWarning(`Insufficient Balance (Remaining: ${balanceRecord.remaining}). Results in ${lopDays} LOP days.`);
                } else {
                    setLopWarning(null);
                }
            }
        }
        setInsufficientBalance(false);

        const minDaysProof = policy.minDaysForProof || 0;
        if (type.proofRequired) {
            if (minDaysProof > 0) {
                if (calculatedDays && calculatedDays > minDaysProof) {
                    isProofNeeded = true;
                    warnings.push(`Proof required for leaves > ${minDaysProof} days.`);
                }
            } else {
                isProofNeeded = true;
            }
        }
        setProofRequired(isProofNeeded);

        const noticePeriod = policy.noticePeriod || 0;
        const minDaysNotice = policy.minDaysForNotice || 0;

        if (noticePeriod > 0 && formData.startDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const start = new Date(formData.startDate);

            if (calculatedDays && calculatedDays > minDaysNotice) {
                const diffTime = start.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < noticePeriod) {
                    warnings.push(`Requires ${noticePeriod} days advance notice.`);
                }
            }
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
            toast.success('File uploaded');
        } catch (error: any) {
            toast.error('Upload failed');
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
                leavesApi.getMyBalances().catch(() => [])
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
            toast.success('Leave request submitted!');
            setIsModalOpen(false);
            setFormData({ ...formData, startDate: '', endDate: '', reason: '', attachmentPath: '', category: '' });
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 leading-none">
                        <Clock className="w-5 h-5 text-primary-600" />
                        Absence Ledger
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Track and manage your leave requests</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="primary"
                    icon={Plus}
                    className="text-sm font-medium"
                >
                    Add Leave
                </Button>
            </div>

            <LeaveBalanceCards balances={balances} loading={loading} />

            <div className="ent-card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Applications</h3>
                    {!loading && leaves.length > 0 && (
                        <span className="text-[10px] font-bold text-gray-500">{leaves.length} Total</span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="ent-table">
                        <thead>
                            <tr>
                                <th className="text-[10px] uppercase tracking-widest">Type</th>
                                <th className="text-[10px] uppercase tracking-widest">Duration</th>
                                <th className="text-[10px] uppercase tracking-widest">Units</th>
                                <th className="text-[10px] uppercase tracking-widest">Status</th>
                                <th className="text-[10px] uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <>
                                    <TableRowSkeleton columns={5} />
                                    <TableRowSkeleton columns={5} />
                                    <TableRowSkeleton columns={5} />
                                </>
                            ) : leaves.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No records found</p>
                                    </td>
                                </tr>
                            ) : (
                                leaves.map((leave) => (
                                    <tr key={leave.id} className="group hover:bg-primary-50/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-md bg-gray-50 border border-gray-100 ${leave.leaveType?.name?.includes('Sick') ? 'text-rose-600' : 'text-primary-600'}`}>
                                                    <Calendar size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-900 uppercase">{leave.leaveType?.name}</div>
                                                    <div className="text-[9px] font-bold text-gray-400 font-mono tracking-tighter uppercase">ID: {leave.id.slice(-8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-[10px] font-bold text-gray-600 whitespace-nowrap">
                                                {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                <span className="mx-1 text-gray-300">→</span>
                                                {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-black text-gray-900 whitespace-nowrap">
                                                {leave.days} <span className="text-[9px] text-gray-400 uppercase tracking-tighter">Days</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`ent-badge font-bold uppercase ${getStatusStyles(leave.status)}`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {leave.status === 'pending' && (
                                                <button className="p-1 px-2 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-md transition-all">
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">New Leave Application</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Absence Protocol</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-md transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Leave Type *</label>
                                    <select
                                        required
                                        value={formData.leaveTypeId}
                                        onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                                        className="ent-input text-xs font-bold"
                                    >
                                        {leaveTypes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Duration</label>
                                    <div className="flex gap-1 p-1 bg-gray-50 rounded-md border border-gray-200">
                                        {[
                                            { id: 'full', label: 'Day' },
                                            { id: 'multiple', label: 'Multi' },
                                            { id: 'first_half', label: 'H1' },
                                            { id: 'second_half', label: 'H2' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, durationType: opt.id as any }))}
                                                className={`flex-1 py-1 rounded-md text-[9px] font-black uppercase transition-all ${formData.durationType === opt.id ? 'bg-white text-primary-600 shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={`grid ${formData.durationType === 'multiple' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">
                                        {formData.durationType === 'multiple' ? 'Start Date' : 'Target Date'}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="ent-input text-xs"
                                    />
                                </div>
                                {formData.durationType === 'multiple' && (
                                    <div className="ent-form-group">
                                        <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">End Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="ent-input text-xs"
                                        />
                                    </div>
                                )}
                            </div>

                            {formData.startDate && (formData.durationType !== 'multiple' || formData.endDate) && (
                                <div className="bg-primary-50 border border-primary-100 rounded-md p-3 flex justify-between items-center shadow-inner">
                                    <span className="text-[10px] font-black text-primary-700 uppercase tracking-widest">Absence Valuation:</span>
                                    {calculating ? (
                                        <span className="text-[10px] font-black text-primary-400 uppercase animate-pulse">Calculating...</span>
                                    ) : (
                                        <span className="text-lg font-black text-primary-900 tracking-tighter">{calculatedDays ?? 0} UNITS</span>
                                    )}
                                </div>
                            )}

                            {(validationWarnings.length > 0 || lopWarning) && (
                                <div className="space-y-2">
                                    {validationWarnings.map((warn, i) => (
                                        <div key={i} className="bg-amber-50 border border-amber-100 rounded-md px-3 py-2 flex items-center gap-2 text-amber-700 text-[10px] font-bold uppercase">
                                            <AlertTriangle size={12} />
                                            {warn}
                                        </div>
                                    ))}
                                    {lopWarning && (
                                        <div className="bg-rose-50 border border-rose-100 rounded-md px-3 py-2 flex items-center gap-2 text-rose-700 text-[10px] font-bold uppercase">
                                            <AlertCircle size={12} />
                                            {lopWarning}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="ent-form-group">
                                <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Reason for Absence *</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="ent-input min-h-[60px] text-xs py-2 scrollbar-thin"
                                    placeholder="Brief explanation for requested downtime..."
                                />
                            </div>

                            <div className="ent-form-group">
                                <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Attachment {proofRequired && '*'}</label>
                                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md border border-dashed border-gray-300">
                                    <input
                                        type="file"
                                        onChange={handleFileUpload}
                                        className="text-[10px] text-gray-400 flex-1 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-slate-800 file:text-white file:cursor-pointer transition-all"
                                    />
                                    {uploading && <LoadingSpinner size="sm" />}
                                    {formData.attachmentPath && <CheckCircle size={14} className="text-emerald-500" />}
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                                <Button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={(proofRequired && !formData.attachmentPath) || insufficientBalance || submitting}
                                    isLoading={submitting}
                                    variant="primary"
                                    className="text-xs"
                                >
                                    Submit Request
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
