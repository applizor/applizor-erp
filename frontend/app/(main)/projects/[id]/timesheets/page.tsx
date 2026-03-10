'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { Clock, Filter, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useSocket } from '@/contexts/SocketContext';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function ProjectTimesheetPage({ params }: { params: { id: string } }) {
    const { error: showError } = useToast();
    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const totalHours = timesheets.reduce((acc, curr) => acc + Number(curr.hours), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Timesheets</h2>
                    <p className="text-xs text-slate-500">Track time spent on this project</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm mr-2 block">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Hours</span>
                        <span className="text-xl font-black text-slate-900">{totalHours.toFixed(2)}h</span>
                    </div>
                    <Button 
                        variant={showFilters ? 'secondary' : 'ghost'} 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`bg-white border shadow-sm ${showFilters ? 'bg-primary-50 text-primary-700 border-primary-200' : 'text-slate-500 border-slate-200'}`}
                    >
                        <Filter size={14} className="mr-2" /> Filters
                    </Button>
                </div>
            </div>

            {showFilters && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
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
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="ent-table-container">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Task</th>
                                <th className="px-4 py-3">Hours</th>
                                <th className="px-4 py-3">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center">
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : timesheets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                                        <Clock size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>No time entries found for this project.</p>
                                    </td>
                                </tr>
                            ) : (
                                timesheets.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-700">
                                            <div className="flex flex-col">
                                                <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                                                {(entry.startTime || entry.endTime) && (
                                                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Clock size={10} />
                                                        {entry.startTime ? format(new Date(entry.startTime), 'h:mm a') : '...'} - {entry.endTime ? format(new Date(entry.endTime), 'h:mm a') : '...'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {entry.employee?.firstName?.[0]}
                                            </div>
                                            {entry.employee?.firstName} {entry.employee?.lastName}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {entry.task?.title || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary" className="font-mono">
                                                {Number(entry.hours).toFixed(2)}h
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={entry.description}>
                                            {entry.description || '-'}
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
