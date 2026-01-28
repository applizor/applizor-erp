'use client';

import React from 'react';
import { MoreHorizontal, MessageSquare, Paperclip, CheckCircle2 } from 'lucide-react';

interface PortalTaskBoardProps {
    tasks: any[];
    onTaskClick: (task: any) => void;
}

export default function PortalTaskBoard({ tasks, onTaskClick }: PortalTaskBoardProps) {
    const columns = [
        { id: 'todo', title: 'To Do', color: 'bg-slate-100', dot: 'bg-slate-400' },
        { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50', dot: 'bg-blue-500' },
        { id: 'done', title: 'Completed', color: 'bg-emerald-50', dot: 'bg-emerald-500' }
    ];

    const getTasksByStatus = (status: string) => {
        // Map various internal statuses to these 3 buckets
        if (status === 'todo') return tasks.filter(t => ['todo', 'backlog'].includes(t.status));
        if (status === 'in-progress') return tasks.filter(t => ['in-progress', 'review'].includes(t.status));
        if (status === 'done') return tasks.filter(t => ['done', 'cancelled'].includes(t.status));
        return [];
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
            {columns.map(col => {
                const colTasks = getTasksByStatus(col.id);
                return (
                    <div key={col.id} className="flex flex-col h-full">
                        {/* Column Header */}
                        <div className={`p-4 rounded-t-xl border-t-4 border-t-transparent ${col.id === 'done' ? 'border-t-emerald-500 bg-emerald-50/50' : col.id === 'in-progress' ? 'border-t-blue-500 bg-blue-50/50' : 'bg-slate-50'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                                    {col.title}
                                </h3>
                                <span className="bg-white px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 border border-slate-100">
                                    {colTasks.length}
                                </span>
                            </div>
                        </div>

                        {/* Task List */}
                        <div className="flex-1 bg-slate-50/30 border-x border-b border-slate-100 rounded-b-xl p-3 overflow-y-auto space-y-3">
                            {colTasks.length === 0 && (
                                <div className="h-24 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-lg">
                                    No Tasks
                                </div>
                            )}
                            {colTasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => onTaskClick(task)}
                                    className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200 cursor-pointer transition-all"
                                >
                                    {/* Types & Priority Tags */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-1.5">
                                            {task.type === 'bug' && <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider border border-rose-100">BUG</span>}
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${task.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    task.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                        'bg-slate-50 text-slate-500 border-slate-100'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h4 className="text-sm font-bold text-slate-800 leading-snug mb-3 group-hover:text-primary-700 transition-colors">
                                        {task.title}
                                    </h4>

                                    {/* Footer Meta */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                        <span className="text-[10px] font-mono text-slate-400">#{task.id.split('-')[0].toUpperCase()}</span>

                                        <div className="flex items-center gap-3">
                                            {(task._count?.comments > 0 || task.comments?.length > 0) && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-primary-500">
                                                    <MessageSquare size={12} />
                                                    <span>{task._count?.comments || task.comments?.length}</span>
                                                </div>
                                            )}
                                            {(task._count?.documents > 0 || task.documents?.length > 0) && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                    <Paperclip size={12} />
                                                    <span>{task._count?.documents || task.documents?.length}</span>
                                                </div>
                                            )}
                                            {task.assignee ? (
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center text-[8px] font-black uppercase" title={`Assigned to ${task.assignee.firstName}`}>
                                                    {task.assignee.firstName[0]}
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-300 border border-slate-200 flex items-center justify-center">
                                                    <span className="text-[10px] shadow-sm">?</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
