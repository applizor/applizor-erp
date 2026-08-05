'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import BulkTimeLogModal from './BulkTimeLogModal';
import { useSocket } from '@/contexts/SocketContext';

interface TaskTimesheetListProps {
    taskId: string;
    projectId?: string;
    taskTitle?: string;
}

export default function TaskTimesheetList({ taskId, projectId, taskTitle }: TaskTimesheetListProps) {
    const { success, error } = useToast();
    const [loading, setLoading] = useState(true);
    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const { socket } = useSocket();

    useEffect(() => {
        fetchTimesheets();
    }, [taskId]);

    useEffect(() => {
        if (!socket) return;
        const onUpdate = (data: any) => {
            if (data.id === taskId) fetchTimesheets();
        };
        socket.on('TASK_UPDATED', onUpdate);
        return () => {
            socket.off('TASK_UPDATED', onUpdate);
        };
    }, [socket, taskId]);

    const fetchTimesheets = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/timesheets?taskId=${taskId}&limit=100&sort=date`);
            setTimesheets(res.data?.data || res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        try {
            await api.delete(`/timesheets/${id}`);
            success('Entry deleted');
            fetchTimesheets();
        } catch (err) {
            error('Failed to delete entry');
        }
    };

    const totalHours = timesheets.reduce((acc, curr) => acc + Number(curr.hours), 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Work Log</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Total: {totalHours.toFixed(2)} hours</p>
                </div>
                <Button
                    variant="outline"
                    className="h-7 text-[10px] uppercase font-bold"
                    onClick={() => setIsLogModalOpen(true)}
                >
                    <Plus size={12} className="mr-1" /> Log Time
                </Button>
            </div>

            {loading ? (
                <div className="py-4 text-center"><LoadingSpinner size="sm" /></div>
            ) : timesheets.length === 0 ? (
                <div className="text-center py-6 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    <Clock size={20} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400">No time logged for this task yet.</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {timesheets.map((entry) => (
                        <div
                            key={entry.id}
                            className="group flex items-start justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-primary-200 transition-all shadow-sm"
                        >
                            <div className="flex gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                                    {entry.employee?.firstName?.[0]}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-700">
                                            {format(new Date(entry.date), 'MMM d, yyyy')}
                                        </span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded">
                                            {Number(entry.hours).toFixed(2)}h
                                        </span>
                                        {entry.status && entry.status !== 'draft' && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                {entry.status}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 leading-snug break-words">
                                        {entry.description || <span className="italic opacity-50">No description</span>}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        by {entry.employee?.firstName} {entry.employee?.lastName}
                                        {entry.createdAt && (
                                            <> · {format(new Date(entry.createdAt), 'h:mm a')}</>
                                        )}
                                    </p>
                                </div>
                            </div>
                            {(entry.status === 'draft' || entry.status === 'rejected') && (
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all shrink-0"
                                    title="Delete entry"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <BulkTimeLogModal
                open={isLogModalOpen}
                onClose={() => {
                    setIsLogModalOpen(false);
                    fetchTimesheets();
                }}
                defaultEntry={{ projectId, taskId, taskTitle }}
            />
        </div>
    );
}
