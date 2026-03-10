'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { Clock, Filter, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useSocket } from '@/contexts/SocketContext';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { usePermission } from '@/hooks/usePermission';

export default function ProjectTimesheetPage({ params }: { params: { id: string } }) {
    const { error: showError, success: showSuccess } = useToast();
    const { can } = usePermission();
    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);

    const { socket } = useSocket();

    useEffect(() => {
        fetchTimesheets();
        fetchEmployees();
    }, [params.id, filterEmployee, filterStartDate, filterEndDate]);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data.employees || res.data || []);
        } catch (error) {
            console.error('Failed to load employees', error);
        }
    };

    useEffect(() => {
        if (!socket) return;
        socket.on('TASK_UPDATED', (data: any) => {
            // Refresh if update is in this project
            if (data.projectId === params.id) {
                fetchTimesheets();
            }
        });
        return () => {
            socket.off('TASK_UPDATED');
        };
    }, [socket, params.id]);

    const fetchTimesheets = async () => {
        try {
            setLoading(true);
            let url = `/timesheets?projectId=${params.id}`;
            if (filterEmployee) url += `&employeeId=${filterEmployee}`;
            if (filterStartDate) url += `&startDate=${filterStartDate}`;
            if (filterEndDate) url += `&endDate=${filterEndDate}`;

            const res = await api.get(url);
            setTimesheets(res.data);
        } catch (error) {
            console.error(error);
            showError('Failed to load timesheets');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            setProcessing(id);
            await api.post('/timesheets/approve', { ids: [id] });
            showSuccess('Timesheet approved');
            fetchTimesheets();
        } catch (error) {
            showError('Failed to approve timesheet');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            setProcessing(id);
            await api.post('/timesheets/reject', { ids: [id], reason });
            showSuccess('Timesheet rejected');
            fetchTimesheets();
        } catch (error) {
            showError('Failed to reject timesheet');
        } finally {
            setProcessing(null);
        }
    };

    const totalHours = timesheets
        .filter(t => t.status === 'approved')
        .reduce((acc, curr) => acc + Number(curr.hours), 0);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 capitalize">Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50 capitalize">Rejected</Badge>;
            case 'pending':
                return <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50 capitalize">Pending</Badge>;
            default:
                return <Badge className="bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-50 capitalize">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Timesheets</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Track and approve work hours for this project</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white px-4 py-2 rounded-md border border-slate-200 shadow-sm flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Approved Hours</span>
                        <span className="text-lg font-black text-emerald-600">{totalHours.toFixed(2)}h</span>
                    </div>
                    <Button 
                        variant={showFilters ? 'secondary' : 'ghost'} 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`rounded-md h-10 px-4 text-[10px] font-black uppercase tracking-widest border transition-all ${showFilters ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                    >
                        <Filter size={14} className="mr-2" /> Filters
                    </Button>
                </div>
            </div>

            {showFilters && (
                <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Employee</label>
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
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Start Date</label>
                        <input 
                            type="date" 
                            className="ent-input w-full" 
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">End Date</label>
                        <input 
                            type="date" 
                            className="ent-input w-full" 
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                <div className="ent-table-container">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500">
                            <tr>
                                <th className="px-5 py-4">Date & Time</th>
                                <th className="px-5 py-4">Employee</th>
                                <th className="px-5 py-4">Task</th>
                                <th className="px-5 py-4">Hours</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Description</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <LoadingSpinner />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Loading entries...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : timesheets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                                        <Clock size={40} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No time entries found</p>
                                    </td>
                                </tr>
                            ) : (
                                timesheets.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                                                {(entry.startTime || entry.endTime) && (
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                                                        <Clock size={10} className="text-slate-400" />
                                                        {entry.startTime ? format(new Date(entry.startTime), 'h:mm a') : '...'} - {entry.endTime ? format(new Date(entry.endTime), 'h:mm a') : '...'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-md bg-primary-900 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                                                    {entry.employee?.firstName?.[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{entry.employee?.firstName} {entry.employee?.lastName}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">ID: {entry.employee?.id.slice(0, 8)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">{entry.task?.title || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge variant="secondary" className="font-black bg-slate-100 text-slate-700 border-none px-2 py-0.5 rounded text-[10px]">
                                                {Number(entry.hours).toFixed(2)}h
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4">
                                            {getStatusBadge(entry.status)}
                                            {entry.status === 'rejected' && entry.rejectionReason && (
                                                <p className="text-[9px] text-rose-500 mt-1 font-bold italic line-clamp-1" title={entry.rejectionReason}>
                                                    "{entry.rejectionReason}"
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 max-w-xs truncate font-medium" title={entry.description}>
                                            {entry.description || '-'}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            {entry.status === 'pending' && can('Timesheet', 'update') && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(entry.id)}
                                                        disabled={!!processing}
                                                        className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-md"
                                                        title="Approve"
                                                    >
                                                        {processing === entry.id ? <LoadingSpinner size="sm" /> : <CheckCircle size={14} />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleReject(entry.id)}
                                                        disabled={!!processing}
                                                        className="h-7 px-2.5 bg-rose-600 hover:bg-rose-700 text-white border-none rounded-md"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={14} />
                                                    </Button>
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
        </div>
    );
}
