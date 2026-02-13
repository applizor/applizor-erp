'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Filter
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/useToast';

export default function TimesheetApprovals() {
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchPendingTimesheets();
    }, []);

    const fetchPendingTimesheets = async () => {
        try {
            // Backend doesn't support filtering by status yet in `getTimesheets` or we need a specific approvals endpoint
            // We will reuse `getTimesheets` but we might need to update it to support status filter
            // Actually `getTimesheets` only supports owned/added check logic.
            // Manager view needs to see ALL submitted timesheets.
            // I probably need to update `getTimesheets` controller to allow "view_all" for managers or specific status filter.
            // Let's assume for now I added status support in `getTimesheets` (I did not, I need to do that!)
            // Wait, `getTimesheets` has `const { projectId, taskId, startDate, endDate } = req.query;`
            // It does NOT have status.
            // I need to update backend to support status filter.
            // AND I need to ensure Managers can see others' timesheets.

            const res = await api.get('/timesheets?status=submitted');
            // This will likely return empty if I am not an admin or if I can't see others.
            // For this step, I'll build the UI assuming backend works, then fix backend.
            setTimesheets(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            if (selectedIds.length === 0) return;
            await api.post('/timesheets/approve', { ids: selectedIds });
            toast.success('Timesheets approved');
            fetchPendingTimesheets();
            setSelectedIds([]);
        } catch (error) {
            toast.error('Failed to approve');
        }
    };

    const handleReject = async () => {
        try {
            if (selectedIds.length === 0) return;
            await api.post('/timesheets/reject', { ids: selectedIds, reason: rejectReason });
            toast.success('Timesheets rejected');
            setShowRejectModal(false);
            setRejectReason('');
            fetchPendingTimesheets();
            setSelectedIds([]);
        } catch (error) {
            toast.error('Failed to reject');
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-6">
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">
                            Timesheet Approvals
                        </h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wide">
                            Review & Approve Team Hours
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <>
                            <button onClick={() => setShowRejectModal(true)} className="ent-button-danger flex items-center gap-2">
                                <XCircle size={14} /> Reject ({selectedIds.length})
                            </button>
                            <button onClick={handleApprove} className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                                <CheckCircle2 size={14} /> Approve ({selectedIds.length})
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                <table className="ent-table w-full text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 w-10">
                                <input type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(timesheets.map((t: any) => t.id));
                                        else setSelectedIds([]);
                                    }}
                                    checked={selectedIds.length === timesheets.length && timesheets.length > 0}
                                />
                            </th>
                            <th className="p-3">Employee</th>
                            <th className="p-3">Project</th>
                            <th className="p-3">Task</th>
                            <th className="p-3 text-right">Hours</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {timesheets.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-400 text-xs">No pending timesheets</td></tr>
                        ) : (
                            timesheets.map((t: any) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3">
                                        <input type="checkbox"
                                            checked={selectedIds.includes(t.id)}
                                            onChange={() => toggleSelect(t.id)}
                                        />
                                    </td>
                                    <td className="p-3 font-bold text-gray-900">
                                        {t.employee.firstName} {t.employee.lastName}
                                    </td>
                                    <td className="p-3 text-gray-600">{t.project?.name}</td>
                                    <td className="p-3 text-gray-500">{t.task?.title || '-'}</td>
                                    <td className="p-3 text-right font-mono font-bold text-gray-900">{t.hours}</td>
                                    <td className="p-3 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-600">
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                    <div className="bg-white p-6 rounded-md w-96">
                        <h3 className="text-sm font-black uppercase mb-4">Reject Timesheets</h3>
                        <textarea
                            className="ent-input w-full h-24 mb-4"
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowRejectModal(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleReject} className="ent-button-danger">Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
