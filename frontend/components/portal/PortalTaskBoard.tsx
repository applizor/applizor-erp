import React from 'react';
import { MoreHorizontal, MessageSquare, Paperclip, CheckCircle2, ListTodo, Circle, PlayCircle, Plus } from 'lucide-react';

interface PortalTaskBoardProps {
    tasks: any[];
    onTaskClick: (task: any) => void;
}

export default function PortalTaskBoard({ tasks, onTaskClick }: PortalTaskBoardProps) {
    const columns = [
        {
            id: 'todo',
            title: 'To Do',
            icon: Circle,
            color: 'text-slate-500',
            bg: 'bg-slate-50',
            border: 'border-slate-200'
        },
        {
            id: 'in-progress',
            title: 'In Progress',
            icon: PlayCircle,
            color: 'text-blue-600',
            bg: 'bg-blue-50/50',
            border: 'border-blue-200'
        },
        {
            id: 'done',
            title: 'Completed',
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50/50',
            border: 'border-emerald-200'
        }
    ];

    const getTasksByStatus = (status: string) => {
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
                    <div key={col.id} className="flex flex-col h-full bg-slate-50/50 rounded-xl border border-slate-200/60 overflow-hidden">
                        {/* Column Header */}
                        <div className={`px-4 py-3 border-b flex justify-between items-center bg-white ${col.border}`}>
                            <div className="flex items-center gap-2">
                                <col.icon size={14} className={col.color} />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                    {col.title}
                                </h3>
                            </div>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] font-black text-slate-500">
                                {colTasks.length}
                            </span>
                        </div>

                        {/* Task List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                            {colTasks.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                                    <div className={`w-12 h-12 rounded-full ${col.bg} flex items-center justify-center mb-3`}>
                                        <col.icon size={20} className={col.color} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No tasks</p>
                                </div>
                            )}

                            {colTasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => onTaskClick(task)}
                                    className="group bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-300 cursor-pointer transition-all duration-200 relative overflow-hidden"
                                >
                                    {/* Types & Priority Tags */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-1.5 flex-wrap">
                                            {task.type === 'bug' && (
                                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider border border-rose-100">
                                                    BUG
                                                </span>
                                            )}
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${task.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                task.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    'bg-slate-50 text-slate-500 border-slate-100'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h4 className="text-xs font-bold text-slate-800 leading-relaxed mb-3 group-hover:text-primary-700 transition-colors line-clamp-2">
                                        {task.title}
                                    </h4>

                                    {/* Footer Meta */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-2">
                                        <span className="text-[9px] font-mono text-slate-400">
                                            #{task.id.split('-')[0].toUpperCase()}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            {(task._count?.comments > 0 || task.comments?.length > 0) && (
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 group-hover:text-primary-500 transition-colors">
                                                    <MessageSquare size={10} />
                                                    <span>{task._count?.comments || task.comments?.length}</span>
                                                </div>
                                            )}

                                            {task.assignee ? (
                                                <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 border border-primary-200 flex items-center justify-center text-[8px] font-black uppercase shadow-sm" title={`Assigned to ${task.assignee.firstName}`}>
                                                    {task.assignee.firstName[0]}
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-300 border border-slate-200 flex items-center justify-center">
                                                    <UserIcon size={10} />
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

function UserIcon({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}
