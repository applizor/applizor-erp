'use client';

import { MessageSquare, CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import { DragDropContext, Draggable, DropResult } from '@hello-pangea/dnd';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StrictModeDroppable } from '@/components/ui/StrictModeDroppable';
import { priorityBadgeClass, columnDroppableClass } from '@/components/tasks/KanbanTaskCard';

const COLUMNS = [
    { id: 'todo', title: 'To Do', icon: Circle, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
    { id: 'in-progress', title: 'In Progress', icon: PlayCircle, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-200' },
    { id: 'done', title: 'Completed', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-200' }
];

interface PortalTaskBoardProps {
    tasks: any[];
    onTaskClick: (task: any) => void;
}

export default function PortalTaskBoard({ tasks: initialTasks, onTaskClick }: PortalTaskBoardProps) {
    const [tasks, setTasks] = useState<any[]>(initialTasks);
    const toast = useToast();
    const dragMovedRef = useRef(false);

    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const calculatePosition = useCallback((items: any[], index: number) => {
        if (items.length === 0) return 0;
        if (index === 0) return (items[0]?.position ?? 0) - 1024;
        if (index >= items.length) return (items[items.length - 1]?.position ?? 0) + 1024;
        const prev = items[index - 1]?.position ?? 0;
        const next = items[index]?.position ?? 0;
        return (prev + next) / 2;
    }, []);

    const onDragEnd = useCallback(async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const movedTask = tasks.find(t => t.id === draggableId);
        if (!movedTask) return;

        const newStatus = destination.droppableId;
        const updatedTask = { ...movedTask, status: newStatus };

        const destinationColTasks = tasks
            .filter(t => {
                if (t.id === draggableId) return false;
                if (newStatus === 'todo') return ['todo', 'backlog'].includes(t.status);
                if (newStatus === 'in-progress') return ['in-progress', 'review'].includes(t.status);
                if (newStatus === 'done') return ['done', 'cancelled'].includes(t.status);
                return false;
            })
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        const newPosition = calculatePosition(destinationColTasks, destination.index);
        updatedTask.position = newPosition;

        setTasks(prev => prev.map(t => (t.id === draggableId ? updatedTask : t)));

        try {
            await api.put(`/portal/tasks/${draggableId}`, { status: newStatus, position: newPosition });
        } catch (error: any) {
            const status = error?.response?.status;
            toast.error(status === 403
                ? "You don't have permission to move this task"
                : 'Failed to update task position');
            setTasks(initialTasks);
        }
    }, [tasks, initialTasks, calculatePosition, toast]);

    const groupedTasks = useMemo(() => {
        const groups: Record<string, any[]> = { todo: [], 'in-progress': [], done: [] };
        tasks.forEach(task => {
            if (['todo', 'backlog'].includes(task.status)) groups.todo.push(task);
            else if (['in-progress', 'review'].includes(task.status)) groups['in-progress'].push(task);
            else if (['done', 'cancelled'].includes(task.status)) groups.done.push(task);
        });
        Object.values(groups).forEach(group => group.sort((a, b) => (a.position || 0) - (b.position || 0)));
        return groups;
    }, [tasks]);

    return (
        <DragDropContext
            onDragStart={() => { dragMovedRef.current = true; }}
            onDragEnd={(result) => {
                onDragEnd(result);
            }}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
                {COLUMNS.map(col => {
                    const colTasks = groupedTasks[col.id] || [];
                    return (
                        <div key={col.id} className="flex flex-col h-full bg-slate-50/50 rounded-xl border border-slate-200/60 overflow-hidden">
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

                            <StrictModeDroppable droppableId={col.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={columnDroppableClass(snapshot.isDraggingOver)}
                                    >
                                        {colTasks.length === 0 && (
                                            <div className="flex flex-col items-center justify-center text-center p-6 opacity-60">
                                                <div className={`w-12 h-12 rounded-full ${col.bg} flex items-center justify-center mb-3`}>
                                                    <col.icon size={20} className={col.color} />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {snapshot.isDraggingOver ? 'Drop here' : 'No tasks'}
                                                </p>
                                            </div>
                                        )}

                                        {colTasks.map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={provided.draggableProps.style}
                                                        onClick={() => {
                                                            if (dragMovedRef.current) {
                                                                dragMovedRef.current = false;
                                                                return;
                                                            }
                                                            onTaskClick(task);
                                                        }}
                                                        className={[
                                                            'group bg-white p-3.5 rounded-lg border shadow-sm select-none relative overflow-hidden',
                                                            snapshot.isDragging
                                                                ? 'shadow-xl ring-2 ring-primary-500/25 z-50 opacity-95 cursor-grabbing'
                                                                : 'border-slate-200 cursor-grab hover:shadow-md hover:border-primary-300',
                                                        ].join(' ')}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex gap-1.5 flex-wrap">
                                                                {task.type === 'bug' && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider border border-rose-100">
                                                                        BUG
                                                                    </span>
                                                                )}
                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${priorityBadgeClass(task.priority)}`}>
                                                                    {task.priority}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <h4 className="text-xs font-bold text-slate-800 leading-relaxed mb-3 line-clamp-2">
                                                            {task.title}
                                                        </h4>

                                                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-50 mt-2">
                                                            <span className="text-[9px] font-mono text-slate-400">
                                                                #{String(task.id).split('-')[0].toUpperCase()}
                                                            </span>

                                                            <div className="flex items-center gap-2">
                                                                {(task._count?.comments > 0 || task.comments?.length > 0) && (
                                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
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
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </StrictModeDroppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
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
