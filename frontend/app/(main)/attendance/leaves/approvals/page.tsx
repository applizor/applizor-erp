'use client';

import { useEffect, useState } from 'react';
import { leavesApi, leaveTypesApi } from '@/lib/api/attendance';
import { employeesApi, Employee } from '@/lib/api/hrms';
import { Check, X, Clock, User, Plus, Calendar, AlertCircle, AlertTriangle, XCircle, Info, Search, Filter } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface LeaveRequest {
    id: string;
    employee: {
        firstName: string;
        lastName: string;
        department?: { name: string };
    };
    leaveType: { name: string };
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    days: number;
}

export default function LeaveApprovalsPage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { showAlert } = useAlert();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<{ id: string, status: 'approved' | 'rejected' } | null>(null);
    const [processing, setProcessing] = useState(false);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [assignFormData, setAssignFormData] = useState({
        employeeId: '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        durationType: 'full' as 'full' | 'multiple' | 'first_half' | 'second_half',
        reason: ''
    });
    const [calculatedDays, setCalculatedDays] = useState(0);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        loadRequests();
        loadMetadata();
    }, []);

    const loadMetadata = async () => {
        try {
            const [empData, typesData] = await Promise.all([
                employeesApi.getAll({ status: 'active' }),
                leaveTypesApi.getAll()
            ]);
            setEmployees(empData);
            setLeaveTypes(typesData);
        } catch (error) {
            console.error('Failed to load metadata:', error);
        }
    };

    useEffect(() => {
        if (assignFormData.startDate && assignFormData.endDate && assignFormData.leaveTypeId && assignFormData.durationType === 'multiple') {
            checkDays();
        } else if (assignFormData.durationType !== 'multiple') {
            setCalculatedDays(assignFormData.durationType === 'full' ? 1 : 0.5);
        }
    }, [assignFormData.startDate, assignFormData.endDate, assignFormData.leaveTypeId, assignFormData.durationType]);

    const checkDays = async () => {
        try {
            setCalculating(true);
            const res = await leavesApi.calculateDays({
                leaveTypeId: assignFormData.leaveTypeId,
                startDate: assignFormData.startDate,
                endDate: assignFormData.endDate
            });
            setCalculatedDays(res.days);
        } catch (error) {
            console.error('Failed to calculate days', error);
            setCalculatedDays(0);
        } finally {
            setCalculating(false);
        }
    };

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await leavesApi.getAllLeaves();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load requests:', error);
            showAlert('Failed to load leave requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const initiateAction = (id: string, status: 'approved' | 'rejected') => {
        setSelectedAction({ id, status });
        setConfirmOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedAction) return;
        try {
            setProcessing(true);
            await leavesApi.updateStatus(selectedAction.id, selectedAction.status);
            showAlert(`Leave request ${selectedAction.status} successfully`, 'success');
            loadRequests();
        } catch (error) {
            console.error('Failed to update status:', error);
            showAlert('Failed to update status', 'error');
        } finally {
            setProcessing(false);
            setConfirmOpen(false);
            setSelectedAction(null);
        }
    };

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setProcessing(true);
            await leavesApi.create({
                ...assignFormData,
                endDate: assignFormData.durationType === 'multiple' ? assignFormData.endDate : assignFormData.startDate
            });
            showAlert('Leave assigned successfully', 'success');
            setIsAssignModalOpen(false);
            setAssignFormData({
                employeeId: '', leaveTypeId: '', startDate: '', endDate: '',
                durationType: 'full', reason: ''
            });
            loadRequests();
        } catch (error) {
            console.error('Failed to assign leave:', error);
            showAlert('Failed to assign leave', 'error');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 leading-none">
                        <Check className="w-5 h-5 text-primary-600" />
                        Absence Approvals
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Review and process employee leave applications</p>
                </div>
                <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="flex items-center gap-2 bg-primary-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Assign Leave
                </button>
            </div>

            <div className="ent-card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Requirements</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter..."
                                className="pl-8 pr-3 py-1 bg-white border border-gray-200 rounded text-[10px] focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none w-32"
                            />
                        </div>
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                            <Filter size={14} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="ent-table">
                        <thead>
                            <tr>
                                <th className="text-[10px] uppercase tracking-widest">Employee</th>
                                <th className="text-[10px] uppercase tracking-widest">Type & Temporal Scope</th>
                                <th className="text-[10px] uppercase tracking-widest">Rationalisation</th>
                                <th className="text-[10px] uppercase tracking-widest">Status</th>
                                <th className="text-[10px] uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="py-4 px-4"><div className="h-4 bg-gray-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No pending applications</p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="group hover:bg-primary-50/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-[10px]">
                                                    {req.employee.firstName[0]}{req.employee.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-900 uppercase">{req.employee.firstName} {req.employee.lastName}</div>
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{req.employee.department?.name || 'Central Staffing'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-bold text-gray-900 uppercase">{req.leaveType?.name}</div>
                                            <div className="text-[10px] font-bold text-gray-500 whitespace-nowrap mt-0.5">
                                                {new Date(req.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(req.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                <span className="ml-1 text-primary-600 font-black">({req.days}D)</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-[10px] text-gray-600 line-clamp-2 max-w-[200px]" title={req.reason}>
                                                {req.reason}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`ent-badge font-bold uppercase ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {req.status === 'pending' && (
                                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => initiateAction(req.id, 'approved')}
                                                        className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded hover:bg-emerald-100 transition-all shadow-sm"
                                                        title="Approve"
                                                    >
                                                        <Check size={14} strokeWidth={3} />
                                                    </button>
                                                    <button
                                                        onClick={() => initiateAction(req.id, 'rejected')}
                                                        className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded hover:bg-rose-100 transition-all shadow-sm"
                                                        title="Reject"
                                                    >
                                                        <X size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmAction}
                title={selectedAction?.status === 'approved' ? 'Execute Approval' : 'Execute Rejection'}
                message={`Are you sure you want to ${selectedAction?.status} this leave request? This action cannot be undone.`}
                type={selectedAction?.status === 'approved' ? 'success' : 'danger'}
                confirmText={selectedAction?.status === 'approved' ? 'Approve' : 'Reject'}
                isLoading={processing}
            />

            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Assign Absence</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Administrative Override</p>
                            </div>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAssignSubmit} className="p-5 overflow-y-auto space-y-4">
                            <div className="ent-form-group">
                                <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Select Personnel *</label>
                                <select
                                    required
                                    value={assignFormData.employeeId}
                                    onChange={(e) => setAssignFormData({ ...assignFormData, employeeId: e.target.value })}
                                    className="ent-input text-xs font-bold"
                                >
                                    <option value="">Choose an employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Leave Type *</label>
                                    <select
                                        required
                                        value={assignFormData.leaveTypeId}
                                        onChange={(e) => setAssignFormData({ ...assignFormData, leaveTypeId: e.target.value })}
                                        className="ent-input text-xs font-bold"
                                    >
                                        <option value="">Select type...</option>
                                        {leaveTypes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Duration</label>
                                    <select
                                        value={assignFormData.durationType}
                                        onChange={(e) => setAssignFormData({ ...assignFormData, durationType: e.target.value as any })}
                                        className="ent-input text-xs font-bold"
                                    >
                                        <option value="full">Full Day</option>
                                        <option value="multiple">Multiple Days</option>
                                        <option value="first_half">First Half</option>
                                        <option value="second_half">Second Half</option>
                                    </select>
                                </div>
                            </div>

                            <div className={`grid ${assignFormData.durationType === 'multiple' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">
                                        {assignFormData.durationType === 'multiple' ? 'Start Date' : 'Target Date'}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={assignFormData.startDate}
                                        onChange={(e) => setAssignFormData({ ...assignFormData, startDate: e.target.value })}
                                        className="ent-input text-xs"
                                    />
                                </div>
                                {assignFormData.durationType === 'multiple' && (
                                    <div className="ent-form-group">
                                        <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">End Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={assignFormData.endDate}
                                            onChange={(e) => setAssignFormData({ ...assignFormData, endDate: e.target.value })}
                                            className="ent-input text-xs"
                                        />
                                    </div>
                                )}
                            </div>

                            {assignFormData.startDate && (
                                <div className="bg-primary-50 border border-primary-100 rounded p-3 flex justify-between items-center shadow-inner">
                                    <span className="text-[10px] font-black text-primary-700 uppercase tracking-widest inline-flex items-center gap-1.5">
                                        <Calendar size={12} /> Valuation:
                                    </span>
                                    {calculating ? (
                                        <span className="text-[10px] font-black text-primary-400 uppercase animate-pulse">Calculating...</span>
                                    ) : (
                                        <span className="text-lg font-black text-primary-900 tracking-tighter">{calculatedDays} UNITS</span>
                                    )}
                                </div>
                            )}

                            <div className="ent-form-group">
                                <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Administrative Note *</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={assignFormData.reason}
                                    onChange={(e) => setAssignFormData({ ...assignFormData, reason: e.target.value })}
                                    className="ent-input min-h-[60px] text-xs py-2 scrollbar-thin shadow-inner"
                                    placeholder="Rationalisation for manual entry..."
                                ></textarea>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 uppercase tracking-widest transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || calculating}
                                    className="bg-primary-600 text-white px-6 py-2 rounded text-xs font-black uppercase tracking-widest hover:bg-primary-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : 'Execute Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
