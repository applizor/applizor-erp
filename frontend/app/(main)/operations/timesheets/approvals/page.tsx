'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import api from '@/lib/api';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    Eye,
    X,
    AlertCircle,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dialog } from '@/components/ui/Dialog';
import { PermissionGuard } from '@/components/PermissionGuard';
import TimesheetDetailModal from '@/components/hrms/timesheets/TimesheetDetailModal';

function statusBadge(status: string) {
    switch (status) {
        case 'approved':
            return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 capitalize">Approved</Badge>;
        case 'rejected':
            return <Badge className="bg-rose-50 text-rose-700 border-rose-100 capitalize">Rejected</Badge>;
        case 'submitted':
            return <Badge className="bg-amber-50 text-amber-700 border-amber-100 capitalize">Submitted</Badge>;
        case 'draft':
            return <Badge className="bg-slate-50 text-slate-600 border-slate-100 capitalize">Draft</Badge>;
        default:
            return <Badge className="bg-slate-50 text-slate-600 border-slate-100 capitalize">{status}</Badge>;
    }
}

export default function TimesheetApprovals() {
    const toast = useToast();
    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [showFilters, setShowFilters] = useState(true);
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('submitted');

    const [employees, setEmployees] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [detailEntry, setDetailEntry] = useState<any | null>(null);

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            const [projRes, empRes] = await Promise.all([
                api.get('/projects'),
                api.get('/employees'),
            ]);
            const projList = Array.isArray(projRes.data)
                ? projRes.data
                : (projRes.data?.data || projRes.data?.projects || []);
            setProjects(projList);
            setEmployees(empRes.data?.employees || empRes.data?.data || empRes.data || []);
        } catch {
            console.error('Failed to load filter options');
        }
    };

    const fetchPendingTimesheets = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('limit', '200');
            params.set('sort', 'date');
            if (filterStatus) params.set('status', filterStatus);
            if (filterEmployee) params.set('employeeId', filterEmployee);
            if (filterProject) params.set('projectId', filterProject);
            if (filterStartDate) params.set('startDate', filterStartDate);
            if (filterEndDate) params.set('endDate', filterEndDate);

            const res = await api.get(`/timesheets?${params.toString()}`);
            setTimesheets(res.data?.data || res.data || []);
            setSelectedIds([]);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load timesheets');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterEmployee, filterProject, filterStartDate, filterEndDate, toast]);

    useEffect(() => {
        fetchPendingTimesheets();
    }, [fetchPendingTimesheets]);

    const hasActiveFilters = !!(
        filterEmployee || filterProject || filterStartDate || filterEndDate || (filterStatus && filterStatus !== 'submitted')
    );

    const clearFilters = () => {
        setFilterEmployee('');
        setFilterProject('');
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterStatus('submitted');
    };

    const actionableSelected = timesheets.filter(
        (t) => selectedIds.includes(t.id) && t.status === 'submitted'
    );
    // Backend enforces Timesheet update permission OR project manager/admin membership
    const canBulkAct = actionableSelected.length > 0;

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const submitted = timesheets.filter((t) => t.status === 'submitted');
        if (selectedIds.length === submitted.length && submitted.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(submitted.map((t) => t.id));
        }
    };

    const handleApproveConfirm = async () => {
        const ids = actionableSelected.map((t) => t.id);
        if (ids.length === 0) return;
        try {
            setProcessing(true);
            await api.post('/timesheets/approve', { ids });
            toast.success(
                ids.length === 1
                    ? 'Timesheet approved'
                    : `${ids.length} timesheets approved`
            );
            setShowApproveConfirm(false);
            setSelectedIds([]);
            fetchPendingTimesheets();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to approve');
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason.trim()) {
            toast.error('Rejection reason is required');
            return;
        }
        const ids = actionableSelected.map((t) => t.id);
        if (ids.length === 0) return;
        try {
            setProcessing(true);
            await api.post('/timesheets/reject', { ids, reason: rejectReason.trim() });
            toast.success(
                ids.length === 1
                    ? 'Timesheet rejected'
                    : `${ids.length} timesheets rejected`
            );
            setShowRejectDialog(false);
            setRejectReason('');
            setSelectedIds([]);
            fetchPendingTimesheets();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to reject');
        } finally {
            setProcessing(false);
        }
    };

    const submittedOnPage = timesheets.filter((t) => t.status === 'submitted');
    const totalHours = timesheets.reduce((acc, t) => acc + Number(t.hours || 0), 0);

    return (
        <PermissionGuard module="Timesheet" action="read">
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                                Timesheet Approvals
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wide">
                                Review &amp; approve team hours
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-slate-50 px-4 py-2 rounded-md border border-slate-200 flex flex-col items-center min-w-[88px]">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pending</span>
                            <span className="text-lg font-black text-amber-600 leading-none">
                                {filterStatus === 'submitted' ? timesheets.length : submittedOnPage.length}
                            </span>
                        </div>
                        <div className="bg-slate-50 px-4 py-2 rounded-md border border-slate-200 flex flex-col items-center min-w-[88px]">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Hours</span>
                            <span className="text-lg font-black text-slate-900 leading-none">{totalHours.toFixed(2)}h</span>
                        </div>
                        <Button
                            variant={showFilters ? 'secondary' : 'ghost'}
                            onClick={() => setShowFilters(!showFilters)}
                            className={`rounded-md h-10 px-4 text-[10px] font-black uppercase tracking-widest border transition-all ${
                                showFilters
                                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 shadow-sm'
                            }`}
                        >
                            <Filter size={14} className="mr-2" /> Filters
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                                    Employee
                                </label>
                                <CustomSelect
                                    options={[
                                        { value: '', label: 'All Employees' },
                                        ...employees.map((e: any) => ({
                                            value: e.id,
                                            label: `${e.firstName} ${e.lastName}`,
                                        })),
                                    ]}
                                    value={filterEmployee}
                                    onChange={setFilterEmployee}
                                    placeholder="All Employees"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                                    Project
                                </label>
                                <CustomSelect
                                    options={[
                                        { value: '', label: 'All Projects' },
                                        ...projects.map((p: any) => ({
                                            value: p.id,
                                            label: p.name,
                                        })),
                                    ]}
                                    value={filterProject}
                                    onChange={setFilterProject}
                                    placeholder="All Projects"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                                    Status
                                </label>
                                <CustomSelect
                                    options={[
                                        { value: 'submitted', label: 'Submitted (Pending)' },
                                        { value: '', label: 'All Statuses' },
                                        { value: 'approved', label: 'Approved' },
                                        { value: 'rejected', label: 'Rejected' },
                                        { value: 'draft', label: 'Draft' },
                                    ]}
                                    value={filterStatus}
                                    onChange={setFilterStatus}
                                    placeholder="Status"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    className="ent-input w-full"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    className="ent-input w-full"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-700"
                            >
                                <X size={12} /> Reset filters
                            </button>
                        )}
                    </div>
                )}

                {/* Bulk actions bar */}
                {selectedIds.length > 0 && (
                    <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 animate-in zoom-in-95">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">
                            {actionableSelected.length} submitted selected
                            {selectedIds.length !== actionableSelected.length && (
                                <span className="text-slate-400 font-bold normal-case tracking-normal ml-1">
                                    ({selectedIds.length - actionableSelected.length} not actionable)
                                </span>
                            )}
                        </span>
                        <div className="flex items-center gap-2">
                            {canBulkAct && (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowApproveConfirm(true)}
                                        disabled={processing}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <CheckCircle2 size={14} className="mr-2" />
                                        Approve ({actionableSelected.length})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowRejectDialog(true)}
                                        disabled={processing}
                                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                    >
                                        <XCircle size={14} className="mr-2" />
                                        Reject ({actionableSelected.length})
                                    </Button>
                                </>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedIds([])}
                                disabled={processing}
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                    <div className="ent-table-container">
                        <table className="ent-table w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300"
                                            onChange={toggleSelectAll}
                                            checked={
                                                submittedOnPage.length > 0 &&
                                                selectedIds.length === submittedOnPage.length
                                            }
                                            disabled={submittedOnPage.length === 0}
                                            title="Select all submitted"
                                        />
                                    </th>
                                    <th className="px-4 py-3">Employee</th>
                                    <th className="px-4 py-3">Project / Task</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3 text-right">Hours</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <LoadingSpinner />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                                    Loading timesheets...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : timesheets.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                                                <div className="p-3 rounded-full bg-slate-50 border border-slate-100">
                                                    <Clock size={32} className="opacity-30" />
                                                </div>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                                                    {filterStatus === 'submitted'
                                                        ? 'No timesheets pending approval'
                                                        : 'No timesheets match your filters'}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {filterStatus === 'submitted'
                                                        ? 'When team members submit drafts, they will appear here for review.'
                                                        : 'Try adjusting employee, project, date range, or status.'}
                                                </p>
                                                {hasActiveFilters && (
                                                    <button
                                                        type="button"
                                                        onClick={clearFilters}
                                                        className="text-[10px] font-black uppercase tracking-widest text-primary-700 hover:underline mt-1"
                                                    >
                                                        Reset to pending
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    timesheets.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300"
                                                    checked={selectedIds.includes(t.id)}
                                                    onChange={() => toggleSelect(t.id)}
                                                    disabled={t.status !== 'submitted'}
                                                    title={
                                                        t.status !== 'submitted'
                                                            ? 'Only submitted entries can be approved/rejected'
                                                            : undefined
                                                    }
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-md bg-primary-900 flex items-center justify-center text-[10px] font-black text-white shadow-sm shrink-0">
                                                        {t.employee?.firstName?.[0] || '?'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 truncate">
                                                            {t.employee?.firstName} {t.employee?.lastName}
                                                        </p>
                                                        {t.employee?.email && (
                                                            <p className="text-[9px] text-slate-400 truncate">
                                                                {t.employee.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-800 truncate max-w-[180px]" title={t.project?.name}>
                                                    {t.project?.name || '—'}
                                                </p>
                                                <p className="text-[10px] text-slate-500 truncate max-w-[180px]" title={t.task?.title}>
                                                    {t.task?.title || (t.taskId ? '(Task unavailable)' : 'General work')}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="font-bold text-slate-900">
                                                    {format(new Date(t.date), 'MMM d, yyyy')}
                                                </p>
                                                {(t.startTime || t.endTime) && (
                                                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Clock size={10} />
                                                        {t.startTime ? format(new Date(t.startTime), 'h:mm a') : '…'}
                                                        {' – '}
                                                        {t.endTime ? format(new Date(t.endTime), 'h:mm a') : '…'}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="font-mono font-black text-slate-900">
                                                    {Number(t.hours).toFixed(2)}h
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {statusBadge(t.status)}
                                                {t.status === 'rejected' && t.rejectionReason && (
                                                    <p
                                                        className="text-[9px] text-rose-500 mt-1 font-medium italic line-clamp-1"
                                                        title={t.rejectionReason}
                                                    >
                                                        {t.rejectionReason}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate" title={t.description}>
                                                {t.description || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setDetailEntry(t)}
                                                    className="h-7 px-2 text-slate-500 hover:text-primary-700"
                                                    title="View details"
                                                >
                                                    <Eye size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <ConfirmDialog
                    isOpen={showApproveConfirm}
                    onClose={() => setShowApproveConfirm(false)}
                    onConfirm={handleApproveConfirm}
                    title="Approve Timesheets"
                    message={`Approve ${actionableSelected.length} submitted timesheet${actionableSelected.length === 1 ? '' : 's'} (${actionableSelected.reduce((a, t) => a + Number(t.hours), 0).toFixed(2)}h total)? This cannot be easily undone.`}
                    type="success"
                    confirmText="Approve"
                    isLoading={processing}
                />

                <Dialog
                    isOpen={showRejectDialog}
                    onClose={() => {
                        if (!processing) {
                            setShowRejectDialog(false);
                            setRejectReason('');
                        }
                    }}
                    title="Reject Timesheets"
                    maxWidth="sm"
                >
                    <div className="space-y-4">
                        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-md">
                            <AlertCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-rose-700">
                                Rejecting {actionableSelected.length} timesheet
                                {actionableSelected.length === 1 ? '' : 's'}. Employees can edit and resubmit drafts after rejection.
                            </p>
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                                Rejection Reason *
                            </label>
                            <textarea
                                className="ent-input w-full min-h-[96px]"
                                placeholder="Explain why these entries are being rejected…"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                disabled={processing}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowRejectDialog(false);
                                    setRejectReason('');
                                }}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRejectConfirm}
                                disabled={processing || !rejectReason.trim()}
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                            >
                                {processing ? <LoadingSpinner size="sm" /> : <XCircle size={14} className="mr-2" />}
                                Confirm Rejection
                            </Button>
                        </div>
                    </div>
                </Dialog>

                <TimesheetDetailModal
                    isOpen={!!detailEntry}
                    onClose={() => setDetailEntry(null)}
                    entry={detailEntry}
                    onUpdated={fetchPendingTimesheets}
                />
            </div>
        </PermissionGuard>
    );
}
