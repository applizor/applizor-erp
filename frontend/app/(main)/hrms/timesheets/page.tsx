'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, List, Filter, Plus, Clock, Search } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import BulkTimeLogModal from '@/components/hrms/timesheets/BulkTimeLogModal';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useToast } from '@/hooks/useToast';

export default function TimesheetsPage() {
    const { success, error: showError } = useToast();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);

    useEffect(() => {
        fetchTimesheets();
    }, []);

    const fetchTimesheets = async () => {
        try {
            setLoading(true);
            const res = await api.get('/timesheets');
            setTimesheets(res.data);
        } catch (error) {
            console.error(error);
            showError('Failed to fetch timesheets');
        } finally {
            setLoading(false);
        }
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
                        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Hours</span>
                            <span className="text-xl font-black text-slate-900 leading-none">{totalHours.toFixed(2)}h</span>
                        </div>
                        <Button onClick={() => setIsLogModalOpen(true)}>
                            <Plus size={16} className="mr-2" /> Log Time
                        </Button>
                    </div>
                </div>

                {/* Filters & View Toggle */}
                {/* ... existing filters ... */}
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
                        <Button variant="ghost" className="text-slate-500">
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

                {/* Content */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Project / Task</th>
                                        <th className="px-6 py-4">Hours</th>
                                        <th className="px-6 py-4">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {timesheets.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                {format(new Date(entry.date), 'MMM d, yyyy')}
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
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-xs border border-slate-200">
                                                    {Number(entry.hours).toFixed(2)}h
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                                                {entry.description || '-'}
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
