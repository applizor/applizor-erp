'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
} from 'date-fns';
import {
    Calendar as CalendarIcon,
    List,
    Filter,
    Plus,
    Clock,
    Search,
    CheckCircle2,
    XCircle,
    Send,
    CheckSquare,
    Square,
    X,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Download,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import BulkTimeLogModal from '@/components/hrms/timesheets/BulkTimeLogModal';
import TimesheetDetailModal from '@/components/hrms/timesheets/TimesheetDetailModal';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';

function statusBadgeVariant(status: string): 'success' | 'destructive' | 'secondary' {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'destructive';
    return 'secondary';
}

export default function TimesheetsPage() {
    const { success, error: showError } = useToast();
    const { can, getScope } = usePermission();
    const canSeeBillable = getScope('Timesheet', 'read') === 'all' || getScope('Timesheet', 'update') === 'all';
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const [detailEntry, setDetailEntry] = useState<any>(null);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const [showFilters, setShowFilters] = useState(false);
    const [filterSearch, setFilterSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [projects, setProjects] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(filterSearch.trim()), 300);
        return () => clearTimeout(t);
    }, [filterSearch]);

    useEffect(() => {
        setPage(1);
    }, [filterProject, filterEmployee, filterStartDate, filterEndDate, filterStatus, debouncedSearch]);

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            const [projRes, empRes] = await Promise.all([
                api.get('/projects'),
                api.get('/employees')
            ]);
            const projList = Array.isArray(projRes.data) ? projRes.data : (projRes.data?.data || projRes.data?.projects || []);
            setProjects(projList);
            setEmployees(empRes.data.employees || empRes.data?.data || empRes.data || []);
        } catch {
            console.error('Failed to load filter options');
        }
    };

    const fetchTimesheets = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', viewMode === 'calendar' ? '500' : '50');
            params.set('sort', 'date');
            if (filterProject) params.set('projectId', filterProject);
            if (filterEmployee) params.set('employeeId', filterEmployee);
            if (filterStartDate) params.set('startDate', filterStartDate);
            if (filterEndDate) params.set('endDate', filterEndDate);
            if (filterStatus) params.set('status', filterStatus);
            if (debouncedSearch) params.set('search', debouncedSearch);

            // For calendar, scope to visible month when no explicit date range
            if (viewMode === 'calendar' && !filterStartDate && !filterEndDate) {
                params.set('startDate', format(startOfMonth(calendarMonth), 'yyyy-MM-dd'));
                params.set('endDate', format(endOfMonth(calendarMonth), 'yyyy-MM-dd'));
            }

            const res = await api.get(`/timesheets?${params.toString()}`);
            setTimesheets(res.data?.data || res.data || []);
            if (res.data?.pagination) {
                setPagination(res.data.pagination);
            } else {
                const list = res.data?.data || res.data || [];
                setPagination({ total: list.length, page: 1, limit: list.length || 50, totalPages: 1 });
            }
        } catch (error) {
            console.error(error);
            showError('Failed to fetch timesheets');
        } finally {
            setLoading(false);
            setSelectedIds([]);
        }
    }, [
        page,
        viewMode,
        filterProject,
        filterEmployee,
        filterStartDate,
        filterEndDate,
        filterStatus,
        debouncedSearch,
        calendarMonth,
        showError,
    ]);

    useEffect(() => {
        fetchTimesheets();
    }, [fetchTimesheets]);

    const handleBulkAction = async (action: 'submit' | 'approve' | 'reject') => {
        if (selectedIds.length === 0) return;
        if (action === 'reject') {
            setShowRejectDialog(true);
            return;
        }
        await executeBulkAction(action);
    };

    const executeBulkAction = async (action: 'submit' | 'approve' | 'reject', reason?: string) => {
        try {
            setIsProcessing(true);
            const endpoint =
                action === 'submit'
                    ? '/timesheets/submit'
                    : action === 'approve'
                      ? '/timesheets/approve'
                      : '/timesheets/reject';

            const payload: any = { ids: selectedIds };
            if (action === 'reject' && reason) payload.reason = reason;

            await api.post(endpoint, payload);
            success(`Timesheets ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'submitted'} successfully`);
            fetchTimesheets();
        } catch (err: any) {
            showError(err.response?.data?.error || `Failed to ${action} timesheets`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectConfirm = () => {
        if (!rejectReason.trim()) {
            showError('Rejection reason is required');
            return;
        }
        executeBulkAction('reject', rejectReason);
        setShowRejectDialog(false);
        setRejectReason('');
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === timesheets.length) setSelectedIds([]);
        else setSelectedIds(timesheets.map(t => t.id));
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
    };

    const totalHours = timesheets.reduce((acc, curr) => acc + Number(curr.hours), 0);

    const hasActiveFilters = !!(
        filterSearch || filterProject || filterEmployee || filterStartDate || filterEndDate || filterStatus
    );

    const clearFilters = () => {
        setFilterSearch('');
        setDebouncedSearch('');
        setFilterProject('');
        setFilterEmployee('');
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterStatus('');
        setPage(1);
    };

    const exportToCSV = async () => {
        try {
            const params = new URLSearchParams();
            params.set('limit', '500');
            params.set('page', '1');
            if (filterProject) params.set('projectId', filterProject);
            if (filterEmployee) params.set('employeeId', filterEmployee);
            if (filterStartDate) params.set('startDate', filterStartDate);
            if (filterEndDate) params.set('endDate', filterEndDate);
            if (filterStatus) params.set('status', filterStatus);
            if (debouncedSearch) params.set('search', debouncedSearch);

            const res = await api.get(`/timesheets?${params.toString()}`);
            const rowsData = res.data?.data || res.data || [];
            if (rowsData.length === 0) {
                showError('No timesheets to export');
                return;
            }

            const headers = [
                'Date',
                'Created At',
                'Updated At',
                'Employee Name',
                'Employee Email',
                'Project',
                'Task',
                'Hours',
                'Status',
                'Description',
                'Billable',
                'Start Time',
                'End Time',
            ];
            const rows = rowsData.map((t: any) => [
                format(new Date(t.date), 'yyyy-MM-dd'),
                t.createdAt ? format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm') : '',
                t.updatedAt ? format(new Date(t.updatedAt), 'yyyy-MM-dd HH:mm') : '',
                `${t.employee?.firstName || ''} ${t.employee?.lastName || ''}`.trim(),
                t.employee?.email || '',
                t.project?.name || 'No Project',
                t.task?.title || (t.taskId ? '(Task unavailable)' : ''),
                Number(t.hours).toFixed(2),
                t.status || 'draft',
                (t.description || '').replace(/"/g, '""'),
                t.isBillable ? 'Yes' : 'No',
                t.startTime ? format(new Date(t.startTime), 'HH:mm') : '',
                t.endTime ? format(new Date(t.endTime), 'HH:mm') : '',
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map((row: string[]) => row.map(val => `"${String(val)}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `timesheets_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            success(`Exported ${rowsData.length} timesheet(s)`);
        } catch {
            showError('Failed to export timesheets');
        }
    };

    const calendarDays = useMemo(() => {
        const start = startOfMonth(calendarMonth);
        const end = endOfMonth(calendarMonth);
        return eachDayOfInterval({ start, end });
    }, [calendarMonth]);

    const hoursByDay = useMemo(() => {
        const map = new Map<string, { hours: number; count: number }>();
        for (const t of timesheets) {
            const key = format(new Date(t.date), 'yyyy-MM-dd');
            const prev = map.get(key) || { hours: 0, count: 0 };
            map.set(key, { hours: prev.hours + Number(t.hours), count: prev.count + 1 });
        }
        return map;
    }, [timesheets]);

    const selectedEntries = timesheets.filter(t => selectedIds.includes(t.id));
    const allDraft = selectedEntries.length > 0 && selectedEntries.every(t => t.status === 'draft');
    const allSubmitted = selectedEntries.length > 0 && selectedEntries.every(t => t.status === 'submitted');

    return (
        <PermissionGuard module="Timesheet" action="read">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Timesheets</h1>
                        <p className="text-slate-500 text-sm mt-1">Track and manage time entries.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {viewMode === 'list' ? 'Page Hours' : 'Period Hours'}
                            </span>
                            <span className="text-xl font-black text-slate-900 leading-none">{totalHours.toFixed(2)}h</span>
                        </div>
                        {selectedIds.length > 0 ? (
                            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200 animate-in zoom-in-95">
                                <span className="text-[10px] font-black uppercase px-3 text-slate-500">
                                    {selectedIds.length} Selected
                                </span>
                                {allDraft && (
                                    <Button size="sm" onClick={() => handleBulkAction('submit')} disabled={isProcessing}>
                                        <Send size={14} className="mr-2" /> Submit
                                    </Button>
                                )}
                                {can('Timesheet', 'update') && allSubmitted && (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() => handleBulkAction('approve')}
                                            disabled={isProcessing}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <CheckCircle2 size={14} className="mr-2" /> Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleBulkAction('reject')}
                                            disabled={isProcessing}
                                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                        >
                                            <XCircle size={14} className="mr-2" /> Reject
                                        </Button>
                                    </>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} disabled={isProcessing}>
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={exportToCSV}>
                                    <Download size={14} className="mr-2" /> Export CSV
                                </Button>
                                <Button onClick={() => setIsLogModalOpen(true)}>
                                    <Plus size={16} className="mr-2" /> Log Time
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search description, employee, project, task..."
                                    value={filterSearch}
                                    onChange={(e) => setFilterSearch(e.target.value)}
                                    className="pl-9 pr-8 py-2 bg-slate-50 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 w-72 max-w-full"
                                />
                                {filterSearch && (
                                    <button
                                        onClick={() => setFilterSearch('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <Button
                                variant={showFilters ? 'secondary' : 'ghost'}
                                onClick={() => setShowFilters(!showFilters)}
                                className={showFilters ? 'bg-primary-50 text-primary-700' : 'text-slate-500'}
                            >
                                <Filter size={14} className="mr-2" /> Filter
                                {hasActiveFilters && (
                                    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[9px] font-black text-white">
                                        !
                                    </span>
                                )}
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                                    Clear
                                </Button>
                            )}
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg self-end sm:self-auto">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="List view"
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Calendar view"
                            >
                                <CalendarIcon size={16} />
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="ent-label block mb-1">Project</label>
                                <CustomSelect
                                    options={[
                                        { value: '', label: 'All Projects' },
                                        ...projects.map(p => ({ value: p.id, label: p.name }))
                                    ]}
                                    value={filterProject}
                                    onChange={setFilterProject}
                                    placeholder="Select Project"
                                />
                            </div>
                            <div>
                                <label className="ent-label block mb-1">Employee</label>
                                <CustomSelect
                                    options={[
                                        { value: '', label: 'All Employees' },
                                        ...employees.map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))
                                    ]}
                                    value={filterEmployee}
                                    onChange={setFilterEmployee}
                                    placeholder="Select Employee"
                                />
                            </div>
                            <div>
                                <label className="ent-label block mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="ent-input w-full"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="ent-label block mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="ent-input w-full"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="ent-label block mb-1">Status</label>
                                <CustomSelect
                                    options={[
                                        { value: '', label: 'All Status' },
                                        { value: 'draft', label: 'Draft' },
                                        { value: 'submitted', label: 'Submitted' },
                                        { value: 'approved', label: 'Approved' },
                                        { value: 'rejected', label: 'Rejected' },
                                    ]}
                                    value={filterStatus}
                                    onChange={setFilterStatus}
                                    placeholder="Filter Status"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                        </div>
                    ) : viewMode === 'calendar' ? (
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(m => subMonths(m, 1))}>
                                    <ChevronLeft size={16} />
                                </Button>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
                                    {format(calendarMonth, 'MMMM yyyy')}
                                </h3>
                                <Button variant="ghost" size="sm" onClick={() => setCalendarMonth(m => addMonths(m, 1))}>
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="py-1">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1.5">
                                {Array.from({ length: startOfMonth(calendarMonth).getDay() }).map((_, i) => (
                                    <div key={`pad-${i}`} className="min-h-[72px] rounded-lg bg-slate-50/40" />
                                ))}
                                {calendarDays.map(day => {
                                    const key = format(day, 'yyyy-MM-dd');
                                    const dayData = hoursByDay.get(key);
                                    const isToday = isSameDay(day, new Date());
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => {
                                                if (!dayData) return;
                                                setFilterStartDate(key);
                                                setFilterEndDate(key);
                                                setShowFilters(true);
                                                setViewMode('list');
                                            }}
                                            className={`min-h-[72px] rounded-lg border p-2 text-left transition-all ${
                                                dayData
                                                    ? 'border-primary-200 bg-primary-50/50 hover:bg-primary-50'
                                                    : 'border-slate-100 bg-white hover:bg-slate-50'
                                            } ${isToday ? 'ring-2 ring-primary-500/30' : ''}`}
                                        >
                                            <div className={`text-xs font-bold ${isSameMonth(day, calendarMonth) ? 'text-slate-700' : 'text-slate-300'}`}>
                                                {format(day, 'd')}
                                            </div>
                                            {dayData && (
                                                <div className="mt-1.5 space-y-0.5">
                                                    <div className="text-[11px] font-black text-primary-800 tabular-nums">
                                                        {dayData.hours.toFixed(1)}h
                                                    </div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase">
                                                        {dayData.count} entr{dayData.count === 1 ? 'y' : 'ies'}
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {timesheets.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    No entries this month. Adjust filters or log time.
                                </div>
                            )}
                        </div>
                    ) : timesheets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <Clock size={48} className="mb-4 text-slate-300" />
                            <p className="text-lg font-bold text-slate-500">No timesheets found</p>
                            <p className="text-sm mt-1">
                                {hasActiveFilters
                                    ? 'Try adjusting your filters or search term.'
                                    : 'Click "Log Time" to create your first entry.'}
                            </p>
                            {hasActiveFilters && (
                                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="ent-table-container">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-4 w-10 text-center">
                                                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-primary-600 transition-colors">
                                                    {selectedIds.length === timesheets.length && timesheets.length > 0
                                                        ? <CheckSquare size={16} />
                                                        : <Square size={16} />}
                                                </button>
                                            </th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Employee</th>
                                            <th className="px-6 py-4">Project / Task</th>
                                            <th className="px-6 py-4 text-center">Hours</th>
                                            <th className="px-6 py-4">Status / Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {timesheets.map((entry) => (
                                            <tr
                                                key={entry.id}
                                                className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedIds.includes(entry.id) ? 'bg-primary-50/30' : ''}`}
                                                onClick={() => setDetailEntry(entry)}
                                            >
                                                <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => toggleSelect(entry.id)}
                                                        className={`transition-colors ${selectedIds.includes(entry.id) ? 'text-primary-600' : 'text-slate-300'}`}
                                                    >
                                                        {selectedIds.includes(entry.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-700">
                                                    <div className="flex flex-col">
                                                        <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                                                        {(entry.startTime || entry.endTime) ? (
                                                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                                                <Clock size={10} />
                                                                {entry.startTime ? format(new Date(entry.startTime), 'h:mm a') : '…'}
                                                                {' – '}
                                                                {entry.endTime ? format(new Date(entry.endTime), 'h:mm a') : '…'}
                                                            </span>
                                                        ) : entry.createdAt ? (
                                                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                                Logged {format(new Date(entry.createdAt), 'MMM d, h:mm a')}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                                            {entry.employee?.firstName?.[0]}
                                                        </div>
                                                        <span className="font-medium text-slate-600">
                                                            {entry.employee?.firstName} {entry.employee?.lastName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col max-w-xs">
                                                        <span className="font-bold text-slate-800 truncate" title={entry.project?.name}>
                                                            {entry.project?.name || 'No Project'}
                                                        </span>
                                                        <span
                                                            className="text-xs text-slate-500 line-clamp-2 break-words"
                                                            title={entry.task?.title || undefined}
                                                        >
                                                            {entry.task?.title
                                                                || (entry.taskId ? '(Task unavailable)' : 'General work')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="inline-flex flex-col items-center gap-1">
                                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-xs border border-slate-200">
                                                            {Number(entry.hours).toFixed(2)}h
                                                        </span>
                                                        {canSeeBillable && entry.isBillable === false && (
                                                            <span className="text-[9px] font-bold uppercase text-slate-400">Non-billable</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant={statusBadgeVariant(entry.status)}
                                                                className={`text-[10px] px-2 py-0 capitalize ${
                                                                    entry.status === 'submitted'
                                                                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                                                                        : ''
                                                                }`}
                                                            >
                                                                {entry.status}
                                                            </Badge>
                                                            {entry.rejectionReason && (
                                                                <span className="text-[10px] text-rose-500 font-bold italic truncate max-w-[150px]" title={entry.rejectionReason}>
                                                                    — {entry.rejectionReason}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-slate-500 text-xs font-medium max-w-xs truncate" title={entry.description || undefined}>
                                                            {entry.description || '—'}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                                    <span className="text-xs text-slate-500 font-medium">
                                        Showing {(pagination.page - 1) * pagination.limit + 1}–
                                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-xs font-bold text-slate-600">
                                            {pagination.page} / {pagination.totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= pagination.totalPages}
                                            onClick={() => setPage(p => p + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <BulkTimeLogModal
                open={isLogModalOpen}
                onClose={() => {
                    setIsLogModalOpen(false);
                    fetchTimesheets();
                }}
            />

            <TimesheetDetailModal
                isOpen={!!detailEntry}
                onClose={() => setDetailEntry(null)}
                entry={detailEntry}
                onUpdated={() => {
                    setDetailEntry(null);
                    fetchTimesheets();
                }}
            />

            <Dialog
                isOpen={showRejectDialog}
                onClose={() => { setShowRejectDialog(false); setRejectReason(''); }}
                title="Reject Timesheets"
                maxWidth="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg border border-rose-200">
                        <AlertCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-rose-700">
                            You are about to reject <strong>{selectedIds.length}</strong> timesheet(s). Please provide a reason.
                        </p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                            Rejection Reason *
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter the reason for rejection..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none"
                            rows={4}
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => { setShowRejectDialog(false); setRejectReason(''); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRejectConfirm}
                            disabled={!rejectReason.trim() || isProcessing}
                            isLoading={isProcessing}
                            className="bg-rose-600 hover:bg-rose-700"
                        >
                            <XCircle size={14} className="mr-2" /> Reject Timesheets
                        </Button>
                    </div>
                </div>
            </Dialog>
        </PermissionGuard>
    );
}
