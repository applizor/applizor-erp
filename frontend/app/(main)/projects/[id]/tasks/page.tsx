
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ProjectTasks({ params }: { params: { id: string } }) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real implementation this would fetch tasks.
        // For now, we simulate standard empty state or use passed down stats if we were lifting state.
        // Assuming we'd fetch from /projects/:id/tasks eventually.
        setLoading(false);
    }, []);

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Task Execution</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Tickets & Assignments</p>
                </div>
                <button className="btn-primary flex items-center gap-2 py-1.5 px-3">
                    <Plus size={12} /> <span className="text-[10px]">New Task</span>
                </button>
            </div>

            {/* Kanban Board Placeholder (Enterprise Style) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column: Todo */}
                <div className="ent-card p-0 bg-gray-50 flex flex-col h-[500px]">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-lg">
                        <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400" /> To Do
                        </span>
                        <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-1.5 rounded">0</span>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto flex flex-col items-center justify-center text-gray-400 gap-2">
                        <CheckCircle className="w-8 h-8 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-50">No Tasks</span>
                    </div>
                </div>

                {/* Column: In Progress */}
                <div className="ent-card p-0 bg-gray-50 flex flex-col h-[500px]">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-lg">
                        <span className="text-[9px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" /> In Progress
                        </span>
                        <span className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-1.5 rounded">0</span>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto flex flex-col items-center justify-center text-gray-400 gap-2">
                        <Clock className="w-8 h-8 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-50">No Active Tasks</span>
                    </div>
                </div>

                {/* Column: Done */}
                <div className="ent-card p-0 bg-gray-50 flex flex-col h-[500px]">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-lg">
                        <span className="text-[9px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
                        </span>
                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-1.5 rounded">0</span>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto flex flex-col items-center justify-center text-gray-400 gap-2">
                        <CheckCircle className="w-8 h-8 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-50">All Clear</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
