'use client';

import { useEffect, useState } from 'react';
import { leavesApi, leaveTypesApi } from '@/lib/api/attendance';
import { employeesApi, Employee } from '@/lib/api/hrms';
import { Check, X, Clock, User, Plus, Calendar, AlertCircle } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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

    // Confirmation State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<{ id: string, status: 'approved' | 'rejected' } | null>(null);
    const [processing, setProcessing] = useState(false);

    // Admin Assignment Modal State
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
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Leave Approvals</h2>
                    <p className="text-sm text-gray-500">Manage employee leave requests and assignments</p>
                </div>
                <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 shadow-sm"
                >
                    <Plus size={18} />
                    <span>Assign Leave</span>
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type & Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-50 rounded w-40"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-12 ml-auto"></div></td>
                                </tr>
                            ))
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No leave requests found.</td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                <User size={16} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {req.employee.firstName} {req.employee.lastName}
                                                </div>
                                                <div className="text-xs text-gray-500">{req.employee.department?.name || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{req.leaveType?.name || 'Unknown Type'}</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                            <span className="ml-1 text-gray-400">({req.days} days)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 line-clamp-2 max-w-xs" title={req.reason}>{req.reason}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {req.status === 'pending' && (
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => initiateAction(req.id, 'approved')}
                                                    className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded-full hover:bg-green-100"
                                                    title="Approve"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={() => initiateAction(req.id, 'rejected')}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-full hover:bg-red-100"
                                                    title="Reject"
                                                >
                                                    <X size={18} />
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

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmAction}
                title={selectedAction?.status === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
                message={`Are you sure you want to ${selectedAction?.status} this leave request? This action cannot be undone.`}
                type={selectedAction?.status === 'approved' ? 'success' : 'danger'}
                confirmText={selectedAction?.status === 'approved' ? 'Approve' : 'Reject'}
                isLoading={processing}
            />

            {/* Admin Assign Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Assign Leave</h3>
                                <p className="text-sm text-gray-500">Manually assign leave to an employee</p>
                            </div>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAssignSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Employee <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={assignFormData.employeeId}
                                    onChange={(e) => setAssignFormData({ ...assignFormData, employeeId: e.target.value })}
                                    className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="">Choose an employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Leave Type <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        value={assignFormData.leaveTypeId}
                                        onChange={(e) => setAssignFormData({ ...assignFormData, leaveTypeId: e.target.value })}
                                        className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
                                    >
                                        <option value="">Select type...</option>
                                        {leaveTypes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Duration Type</label>
                                    <select
                                        value={assignFormData.durationType}
                                        onChange={(e) => setAssignFormData({ ...assignFormData, durationType: e.target.value as any })}
                                        className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
                                    >
                                        <option value="full">Full Day</option>
                                        <option value="multiple">Multiple Days</option>
                                        <option value="first_half">First Half</option>
                                        <option value="second_half">Second Half</option>
                                    </select>
                                </div>
                            </div>

                            <div className={`grid ${assignFormData.durationType === 'multiple' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                        {assignFormData.durationType === 'multiple' ? 'Start Date' : 'Date'}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={assignFormData.startDate}
                                        onChange={(e) => setAssignFormData({ ...assignFormData, startDate: e.target.value })}
                                        className="block w-full rounded-lg border-gray-300 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
                                    />
                                </div>
                                {assignFormData.durationType === 'multiple' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">End Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={assignFormData.endDate}
                                            onChange={(e) => setAssignFormData({ ...assignFormData, endDate: e.target.value })}
                                            className="block w-full rounded-lg border-gray-300 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {assignFormData.startDate && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex justify-between items-center text-blue-800 text-sm">
                                    <span className="font-medium inline-flex items-center"><Calendar size={14} className="mr-1" /> Total Days:</span>
                                    {calculating ? (
                                        <span className="animate-pulse">Calculating...</span>
                                    ) : (
                                        <span className="font-bold text-lg">{calculatedDays} Days</span>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Reason / Note <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    rows={3}
                                    value={assignFormData.reason}
                                    onChange={(e) => setAssignFormData({ ...assignFormData, reason: e.target.value })}
                                    className="block w-full rounded-lg border-gray-300 p-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 resize-none"
                                    placeholder="Reason for manual assignment..."
                                ></textarea>
                            </div>

                            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || calculating}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-500/30"
                                >
                                    {processing ? 'Assigning...' : 'Assign Leave'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
