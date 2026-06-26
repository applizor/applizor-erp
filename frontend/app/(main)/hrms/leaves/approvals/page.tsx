'use client';

import { useEffect, useState } from 'react';
import { leavesApi, leaveTypesApi } from '@/lib/api/attendance';
import { employeesApi, Employee } from '@/lib/api/hrms';
import { Check, X, Clock, User, Plus, Calendar, AlertCircle, AlertTriangle, XCircle, Info, Search, Filter, Eye, Download } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
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
    leaveType: { name: string; isPaid?: boolean };
    startDate: string;
    endDate: string;
    reason?: string;
    status: string;
    days: number;
    durationType?: string;
    category?: string;
    lopDays?: number;
    approvedBy?: string;
    approvedAt?: string;
    assignedBy?: string;
    attachmentPath?: string;
    createdAt?: string;
    updatedAt?: string;
}

export default function LeaveApprovalsPage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { showAlert } = useAlert();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<{ id: string, status: 'approved' | 'rejected' | 'pending' } | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null);
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

    const initiateRevert = (id: string) => {
        setSelectedAction({ id, status: 'pending' });
        setConfirmOpen(true);
    };

    const initiateDelete = (id: string) => {
        setSelectedDeleteId(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedAction) return;
        try {
            setProcessing(true);
            await leavesApi.updateStatus(selectedAction.id, selectedAction.status);
            showAlert(`Leave request ${selectedAction.status === 'pending' ? 'reverted to pending' : selectedAction.status} successfully`, 'success');
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

    const handleDeleteConfirm = async () => {
        if (!selectedDeleteId) return;
        try {
            setProcessing(true);
            await leavesApi.deleteLeave(selectedDeleteId);
            showAlert('Leave request deleted successfully', 'success');
            loadRequests();
        } catch (error) {
            console.error('Failed to delete leave:', error);
            showAlert('Failed to delete leave', 'error');
        } finally {
            setProcessing(false);
            setDeleteConfirmOpen(false);
            setSelectedDeleteId(null);
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
                <div className="ent-table-container">
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
                                    <tr
                                        key={req.id}
                                        onClick={() => setDetailRequest(req)}
                                        className="group hover:bg-primary-50/30 transition-colors cursor-pointer"
                                    >
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
                                            <div className="flex justify-end gap-1.5 opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setDetailRequest(req)}
                                                    className="p-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded hover:bg-slate-100 transition-all shadow-sm"
                                                    title="View Details"
                                                >
                                                    <Eye size={14} strokeWidth={2} />
                                                </button>
                                                {req.status === 'pending' ? (
                                                    <>
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
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => initiateRevert(req.id)}
                                                            className="p-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded hover:bg-amber-100 transition-all shadow-sm"
                                                            title="Revert to Pending"
                                                        >
                                                            <Clock size={14} strokeWidth={2} />
                                                        </button>
                                                        <button
                                                            onClick={() => initiateDelete(req.id)}
                                                            className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded hover:bg-rose-100 transition-all shadow-sm"
                                                            title="Delete"
                                                        >
                                                            <XCircle size={14} strokeWidth={2} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
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
                title={selectedAction?.status === 'approved' ? 'Execute Approval' : selectedAction?.status === 'rejected' ? 'Execute Rejection' : 'Revert to Pending'}
                message={
                    selectedAction?.status === 'pending'
                        ? 'Are you sure you want to revert this leave request back to pending? The leave balance will be restored if it was previously approved.'
                        : `Are you sure you want to ${selectedAction?.status} this leave request?`
                }
                type={selectedAction?.status === 'approved' ? 'success' : 'warning'}
                confirmText={selectedAction?.status === 'pending' ? 'Revert' : selectedAction?.status === 'approved' ? 'Approve' : 'Reject'}
                isLoading={processing}
            />

            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Leave Request"
                message="Are you sure you want to delete this leave request? This action cannot be undone. Leave balance will be restored if the leave was approved."
                type="danger"
                confirmText="Delete"
                isLoading={processing}
            />

            {/* Detail Modal */}
            {detailRequest && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetailRequest(null)}>
                    <div className="bg-white rounded-md shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded bg-primary-900 flex items-center justify-center text-white font-bold text-xs">
                                    {detailRequest.employee.firstName[0]}{detailRequest.employee.lastName[0]}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase">Leave Application</h3>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                        {detailRequest.employee.firstName} {detailRequest.employee.lastName}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setDetailRequest(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Status */}
                            <div className="flex justify-between items-center">
                                <span className={`ent-badge font-black uppercase text-[10px] tracking-widest ${detailRequest.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    detailRequest.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                        'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                    {detailRequest.status}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                    Applied {detailRequest.createdAt ? new Date(detailRequest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Leave Type</div>
                                    <div className="text-xs font-black text-slate-900 uppercase">{detailRequest.leaveType.name}</div>
                                    {detailRequest.leaveType.isPaid !== undefined && (
                                        <div className={`text-[9px] font-bold mt-0.5 ${detailRequest.leaveType.isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {detailRequest.leaveType.isPaid ? 'PAID' : 'UNPAID'}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</div>
                                    <div className="text-xs font-black text-slate-900">
                                        {detailRequest.days} {detailRequest.days === 1 ? 'DAY' : 'DAYS'}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                                        {detailRequest.durationType === 'first_half' ? 'First Half' :
                                         detailRequest.durationType === 'second_half' ? 'Second Half' :
                                         detailRequest.durationType === 'half' ? 'Half Day' :
                                         detailRequest.durationType === 'multiple' ? 'Multiple Days' : 'Full Day'}
                                    </div>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date Range</div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 text-center">
                                        <div className="text-[9px] font-bold text-slate-500 uppercase">From</div>
                                        <div className="text-sm font-black text-slate-900">
                                            {new Date(detailRequest.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="text-slate-300 font-black text-lg">→</div>
                                    <div className="flex-1 text-center">
                                        <div className="text-[9px] font-bold text-slate-500 uppercase">To</div>
                                        <div className="text-sm font-black text-slate-900">
                                            {new Date(detailRequest.endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Rationalisation</div>
                                <div className="text-xs text-slate-700 leading-relaxed">{detailRequest.reason || 'No reason provided'}</div>
                            </div>

                            {/* Additional Info */}
                            {(detailRequest.category || detailRequest.lopDays || detailRequest.lopDays! > 0) && (
                                <div className="grid grid-cols-2 gap-4">
                                    {detailRequest.category && (
                                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</div>
                                            <div className="text-xs font-black text-slate-900 uppercase">{detailRequest.category}</div>
                                        </div>
                                    )}
                                    {detailRequest.lopDays !== undefined && detailRequest.lopDays > 0 && (
                                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Loss of Pay Days</div>
                                            <div className="text-xs font-black text-rose-700">{detailRequest.lopDays} DAYS</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Approval / Audit Trail */}
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Audit Trail</div>
                                <div className="space-y-1.5">
                                    {detailRequest.assignedBy && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="font-bold text-slate-500">Assigned By</span>
                                            <span className="font-black text-slate-800 uppercase">{detailRequest.assignedBy}</span>
                                        </div>
                                    )}
                                    {detailRequest.approvedBy && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="font-bold text-slate-500">Approved By</span>
                                            <span className="font-black text-slate-800 uppercase">{detailRequest.approvedBy}</span>
                                        </div>
                                    )}
                                    {detailRequest.approvedAt && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="font-bold text-slate-500">Approved At</span>
                                            <span className="font-black text-slate-800">
                                                {new Date(detailRequest.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                    {detailRequest.attachmentPath && (
                                        <div className="flex justify-between text-[10px] items-center">
                                            <span className="font-bold text-slate-500">Attachment</span>
                                            <a
                                                href={detailRequest.attachmentPath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-black text-primary-700 hover:text-primary-900 underline inline-flex items-center gap-1"
                                            >
                                                <Download size={10} />
                                                View File
                                            </a>
                                        </div>
                                    )}
                                    {!detailRequest.assignedBy && !detailRequest.approvedBy && !detailRequest.approvedAt && !detailRequest.attachmentPath && (
                                        <p className="text-[10px] text-slate-400 italic">No audit records available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 p-3 flex justify-end">
                            <button
                                onClick={() => setDetailRequest(null)}
                                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 uppercase tracking-widest transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
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
                                <CustomSelect
                                    value={assignFormData.employeeId}
                                    onChange={(val) => setAssignFormData({ ...assignFormData, employeeId: val })}
                                    options={[
                                        { label: 'Choose an employee...', value: '' },
                                        ...employees.map(emp => ({ label: `${emp.firstName} ${emp.lastName} (${emp.employeeId})`, value: emp.id }))
                                    ]}
                                    placeholder="Choose an employee..."
                                    className="w-full"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Leave Type *</label>
                                    <CustomSelect
                                        value={assignFormData.leaveTypeId}
                                        onChange={(val) => setAssignFormData({ ...assignFormData, leaveTypeId: val })}
                                        options={[
                                            { label: 'Select type...', value: '' },
                                            ...leaveTypes.map(t => ({ label: t.name, value: t.id }))
                                        ]}
                                        placeholder="Select type..."
                                        className="w-full"
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">Duration</label>
                                    <CustomSelect
                                        value={assignFormData.durationType}
                                        onChange={(val) => setAssignFormData({ ...assignFormData, durationType: val as any })}
                                        options={[
                                            { label: 'Full Day', value: 'full' },
                                            { label: 'Multiple Days', value: 'multiple' },
                                            { label: 'First Half', value: 'first_half' },
                                            { label: 'Second Half', value: 'second_half' }
                                        ]}
                                        className="w-full"
                                    />
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
