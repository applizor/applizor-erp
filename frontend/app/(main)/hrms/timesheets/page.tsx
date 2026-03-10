'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, List, Filter, Plus, Clock, Search, CheckCircle2, XCircle, Send, CheckSquare, Square } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import BulkTimeLogModal from '@/components/hrms/timesheets/BulkTimeLogModal';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Badge } from '@/components/ui/Badge';

export default function TimesheetsPage() {
    const { success, error: showError } = useToast();
    const { can } = usePermission();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filterProject, setFilterProject] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [projects, setProjects] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

    useEffect(() => {
        fetchTimesheets();
        fetchFilterOptions();
    }, [filterProject, filterEmployee, filterStartDate, filterEndDate, filterStatus]);

    const fetchFilterOptions = async () => {
        try {
            const [projRes, empRes] = await Promise.all([
                api.get('/projects'),
                api.get('/employees')
            ]);
            setProjects(projRes.data || []);
            setEmployees(empRes.data.employees || empRes.data || []);
        } catch (error) {
            console.error('Failed to load filter options');
        }
    };

    const fetchTimesheets = async () => {
        try {
            setLoading(true);
            let url = '/timesheets?';
            if (filterProject) url += `projectId=${filterProject}&`;
            if (filterEmployee) url += `employeeId=${filterEmployee}&`;
            if (filterStartDate) url += `startDate=${filterStartDate}&`;
            if (filterEndDate) url += `endDate=${filterEndDate}&`;
            if (filterStatus) url += `status=${filterStatus}&`;

            const res = await api.get(url);
            setTimesheets(res.data);
        } catch (error) {
            console.error(error);
            showError('Failed to fetch timesheets');
        } finally {
            setLoading(false);
            setSelectedIds([]);
        }
    };

    const handleBulkAction = async (action: 'submit' | 'approve' | 'reject') => {
        if (selectedIds.length === 0) return;
        
        try {
            setIsProcessing(true);
            const endpoint = action === 'submit' ? '/timesheets/submit' : (action === 'approve' ? '/timesheets/approve' : '/timesheets/reject');
            
            const payload: any = { ids: selectedIds };
            if (action === 'reject') {
                const reason = prompt('Please enter rejection reason:');
                if (!reason) {
                    setIsProcessing(false);
                    return;
                }
                payload.reason = reason;
            }

            await api.post(endpoint, payload);
            success(`Timesheets ${action}ed successfully`);
            fetchTimesheets();
        } catch (err: any) {
            showError(err.response?.data?.error || `Failed to ${action} timesheets`);
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === timesheets.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(timesheets.map(t => t.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const totalHours = timesheets.reduce((acc, curr) => acc + Number(curr.hours), 0);

    return (
        <PermissionGuard module="Timesheet" action="read">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Timesheets</h1>
                        <p className="text-slate-500 text-sm mt-1">Track and manage time entries.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Hours</span>
                            <span className="text-xl font-black text-slate-900 leading-none">{totalHours.toFixed(2)}h</span>
                        </div>
                        {selectedIds.length > 0 ? (
                            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200 animate-in zoom-in-95">
                                <span className="text-[10px] font-black uppercase px-3 text-slate-500">{selectedIds.length} Selected</span>
                                {timesheets.filter(t => selectedIds.includes(t.id)).every(t => t.status === 'draft') && (
                                    <Button size="sm" onClick={() => handleBulkAction('submit')} disabled={isProcessing}>
                                        <Send size={14} className="mr-2" /> Submit
                                    </Button>
                                )}
                                {can('Timesheet', 'update') && timesheets.filter(t => selectedIds.includes(t.id)).every(t => t.status === 'submitted') && (
                                    <>
                                        <Button size="sm" onClick={() => handleBulkAction('approve')} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700">
                                            <CheckCircle2 size={14} className="mr-2" /> Approve
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('reject')} disabled={isProcessing} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                                            <XCircle size={14} className="mr-2" /> Reject
                                        </Button>
                                    </>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} disabled={isProcessing}>Cancel</Button>
                            </div>
                        ) : (
                            <Button onClick={() => setIsLogModalOpen(true)}>
                                <Plus size={16} className="mr-2" /> Log Time
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters & View Toggle */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search description..."
                                    className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 w-64"
                                />
                            </div>
                            <Button 
                                variant={showFilters ? 'secondary' : 'ghost'} 
                                onClick={() => setShowFilters(!showFilters)}
                                className={showFilters ? 'bg-primary-50 text-primary-700' : 'text-slate-500'}
                            >
                                <Filter size={14} className="mr-2" /> Filter
                            </Button>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <CalendarIcon size={16} />
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
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
                {/* Content */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : (
                        <div className="ent-table-container">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-4 w-10 text-center">
                                            <button onClick={toggleSelectAll} className="text-slate-400 hover:text-primary-600 transition-colors">
                                                {selectedIds.length === timesheets.length && timesheets.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
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
                                         <tr key={entry.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(entry.id) ? 'bg-primary-50/30' : ''}`}>
                                            <td className="px-4 py-4 text-center">
                                                <button onClick={() => toggleSelect(entry.id)} className={`transition-colors ${selectedIds.includes(entry.id) ? 'text-primary-600' : 'text-slate-300'}`}>
                                                    {selectedIds.includes(entry.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                <div className="flex flex-col">
                                                    <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                                                    {(entry.startTime || entry.endTime) && (
                                                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                                            <Clock size={10} />
                                                            {entry.startTime ? format(new Date(entry.startTime), 'h:mm a') : '...'} - {entry.endTime ? format(new Date(entry.endTime), 'h:mm a') : '...'}
                                                        </span>
                                                    )}
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
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{entry.project?.name}</span>
                                                    <span className="text-xs text-slate-500">{entry.task?.title || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-xs border border-slate-200">
                                                    {Number(entry.hours).toFixed(2)}h
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={
                                                            entry.status === 'approved' ? 'success' :
                                                            entry.status === 'submitted' ? 'warning' :
                                                            entry.status === 'rejected' ? 'danger' : 'secondary'
                                                        } className="text-[10px] px-2 py-0">
                                                            {entry.status}
                                                        </Badge>
                                                        {entry.rejectionReason && (
                                                            <span className="text-[10px] text-rose-500 font-bold italic truncate max-w-[150px]" title={entry.rejectionReason}>
                                                                - {entry.rejectionReason}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-slate-500 text-xs font-medium max-w-xs truncate">
                                                        {entry.description || '-'}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
        </PermissionGuard>
    );
}
