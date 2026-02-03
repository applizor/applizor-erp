'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import {
    Plus, MoreVertical, Paperclip, MessageSquare, Bug, Bookmark, Layout, CheckSquare,
    Filter, LayoutGrid, Users, Calendar, Clock
} from 'lucide-react';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import BulkTimeLogModal from '@/components/hrms/timesheets/BulkTimeLogModal';
import { useSocket } from '@/contexts/SocketContext';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { CustomSelect } from '@/components/ui/CustomSelect';

// Types
interface Task {
    id: string;
    title: string;
    description: string;
    status: string; // todo, in-progress, review, done
    type: string; // epic, story, task, bug
    priority: string;
    storyPoints?: number;
    assignee?: { id: string, firstName: string, lastName: string };
    epic?: { id: string, title: string };
    _count?: { comments: number, documents: number };
}

const COLUMNS = {
    'todo': { title: 'To Do', color: 'bg-slate-100 border-slate-200 text-slate-700' },
    'in-progress': { title: 'In Progress', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    'review': { title: 'Review', color: 'bg-purple-50 border-purple-200 text-purple-700' },
    'done': { title: 'Done', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
};

export default function KanbanBoard() {
    const { id: projectId } = useParams();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [sprints, setSprints] = useState<any[]>([]);
    const [selectedSprintId, setSelectedSprintId] = useState<string>('all');
    const [filters, setFilters] = useState({ assignee: '', type: '', search: '' });
    const [columns, setColumns] = useState<any>({ todo: [], 'in-progress': [], review: [], done: [] });
    const toast = useToast();
    const { socket } = useSocket();

    // Modal States
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isBulkLogOpen, setIsBulkLogOpen] = useState(false);
    const [quickLogTask, setQuickLogTask] = useState<any>(null);

    // Permissions
    const [project, setProject] = useState<any>(null);
    const { can } = useProjectPermissions(project);

    const fetchProjectSettings = useCallback(async () => {
        try {
            const res = await api.get(`/projects/${projectId}`);
            setProject(res.data);
        } catch (error) {
            console.error('Failed to load project settings');
        }
    }, [projectId]);

    const fetchSprints = useCallback(async () => {
        try {
            const res = await api.get(`/projects/${projectId}/sprints`);
            setSprints(res.data);
            const active = res.data.find((s: any) => s.status === 'active');
            if (active && selectedSprintId === 'all') {
                setSelectedSprintId(active.id);
            }
        } catch (error) {
            console.error('Failed to load sprints');
        }
    }, [projectId, selectedSprintId]);

    const fetchTasks = useCallback(async () => {
        try {
            const sprintQuery = selectedSprintId !== 'all' ? `&sprintId=${selectedSprintId}` : '';
            const res = await api.get(`/tasks?projectId=${projectId}${sprintQuery}`);
            setTasks(res.data);
        } catch (error) {
            toast.error('Failed to load tasks');
        }
    }, [projectId, selectedSprintId, toast]);

    // Initial Load & Socket
    useEffect(() => {
        if (projectId) {
            fetchTasks();
            fetchProjectSettings();
            fetchSprints();
        }
    }, [projectId, fetchTasks, fetchProjectSettings, fetchSprints]);

    useEffect(() => {
        if (!socket || !projectId) return;
        const onConnect = () => socket.emit('join-project', projectId);
        if (socket.connected) onConnect();

        socket.on('connect', onConnect);
        const refresh = (data: any) => {
            if (data.projectId === projectId) fetchTasks();
        };

        socket.on('TASK_CREATED', refresh);
        socket.on('TASK_UPDATED', refresh);
        socket.on('TASK_DELETED', refresh);

        return () => {
            socket.off('connect', onConnect);
            socket.off('TASK_CREATED', refresh);
            socket.off('TASK_UPDATED', refresh);
            socket.off('TASK_DELETED', refresh);
        };
    }, [socket, projectId, fetchTasks]);

    // Derived State: Distribute tasks into columns based on filters
    useEffect(() => {
        const filtered = tasks.filter(t => {
            const matchAssignee = filters.assignee ? t.assignee?.id === filters.assignee : true;
            const matchType = filters.type ? t.type === filters.type : true;
            const matchSearch = filters.search ? t.title.toLowerCase().includes(filters.search.toLowerCase()) : true;
            return matchAssignee && matchType && matchSearch;
        });

        const newCols: any = { todo: [], 'in-progress': [], review: [], done: [] };
        filtered.forEach(task => {
            if (newCols[task.status]) newCols[task.status].push(task);
            else newCols['todo'].push(task);
        });
        setColumns(newCols);
    }, [tasks, filters]);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const startCol = columns[source.droppableId];
        const finishCol = columns[destination.droppableId];
        const newStatus = destination.droppableId;

        if (source.droppableId === destination.droppableId) {
            // Reorder same column
            const newTasks = Array.from(startCol);
            const [moved] = newTasks.splice(source.index, 1);
            newTasks.splice(destination.index, 0, moved);
            setColumns({ ...columns, [source.droppableId]: newTasks });
        } else {
            // Move across columns
            const startTasks = Array.from(startCol);
            const finishTasks = Array.from(finishCol);
            const [moved] = startTasks.splice(source.index, 1);

            // Optimistic update
            const updatedTask = { ...moved as any, status: newStatus };
            finishTasks.splice(destination.index, 0, updatedTask);

            setColumns({
                ...columns,
                [source.droppableId]: startTasks,
                [destination.droppableId]: finishTasks
            });

            try {
                await api.put(`/tasks/${draggableId}`, { status: newStatus });
            } catch (error) {
                toast.error('Failed to update status');
                fetchTasks(); // Revert
            }
        }
    };

    const openTask = (taskId: string) => {
        setSelectedTaskId(taskId);
        setIsDetailOpen(true);
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in">
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-1">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                        <LayoutGrid size={14} className="text-slate-400" />
                        <select
                            value={selectedSprintId}
                            onChange={(e) => setSelectedSprintId(e.target.value)}
                            className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-700 focus:ring-0 cursor-pointer outline-none"
                        >
                            <option value="all">All Issues</option>
                            {sprints.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-6 w-[1px] bg-slate-200 mx-1" />

                    <div className="relative">
                        <input
                            placeholder="Filter tasks..."
                            className="bg-white pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold w-48 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                        <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {can('tasks', 'create') && (
                    <button
                        onClick={() => openTask('new')}
                        className="btn-primary flex items-center gap-2 text-[10px]"
                    >
                        <Plus size={14} /> New Issue
                    </button>
                )}
            </div>

            {/* Board Area */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {Object.entries(COLUMNS).map(([colId, colDef]: [string, any]) => (
                        <div key={colId} className="flex-shrink-0 w-80 flex flex-col h-full rounded-xl bg-slate-50/50 border border-slate-200/60">
                            {/* Column Header */}
                            <div className={`p-4 border-b ${colDef.color.split(' ').filter((c: string) => c.startsWith('border')).join(' ')} flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-t-xl`}>
                                <div className="flex items-center gap-2">
                                    <h3 className={`font-black text-[11px] uppercase tracking-widest ${colDef.color.split(' ').filter((c: string) => c.startsWith('text')).join(' ')}`}>
                                        {colDef.title}
                                    </h3>
                                    <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-black">
                                        {columns[colId]?.length || 0}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    {/* Action buttons could go here */}
                                </div>
                            </div>

                            {/* Droppable Area */}
                            <Droppable droppableId={colId}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-primary-50/30' : ''}`}
                                    >
                                        {columns[colId]?.map((task: Task, index: number) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => openTask(task.id)}
                                                        className={`bg-white p-4 rounded-lg border border-slate-200 shadow-sm group cursor-pointer hover:border-primary-300 transition-all ${snapshot.isDragging ? 'rotate-1 shadow-xl ring-2 ring-primary-500/20 z-50' : 'hover:shadow-md'}`}
                                                    >
                                                        {/* Task Tags & ID */}
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex gap-1.5 flex-wrap">
                                                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${task.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                        task.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                                            'bg-slate-50 text-slate-500 border-slate-100'
                                                                    }`}>
                                                                    {task.priority}
                                                                </span>
                                                                {task.epic && (
                                                                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-indigo-50 text-indigo-600 border-indigo-100 max-w-[100px] truncate">
                                                                        {task.epic.title}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <MoreVertical size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-600" />
                                                        </div>

                                                        {/* Content */}
                                                        <h4 className="text-xs font-bold text-slate-800 mb-2 leading-relaxed">
                                                            {task.title}
                                                        </h4>

                                                        {/* Footer */}
                                                        <div className="flex items-center justify-between mt-4 border-t border-slate-50 pt-3">
                                                            <div className="flex items-center gap-2">
                                                                <div title={task.type}>
                                                                    {task.type === 'bug' ? <Bug size={14} className="text-rose-500" /> :
                                                                        task.type === 'story' ? <Bookmark size={14} className="text-emerald-500" /> :
                                                                            task.type === 'epic' ? <Layout size={14} className="text-purple-600" /> :
                                                                                <CheckSquare size={14} className="text-blue-500" />}
                                                                </div>
                                                                {task.storyPoints ? (
                                                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-black">{task.storyPoints}</span>
                                                                ) : null}
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                {(task._count?.comments || 0) > 0 && (
                                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                                        <MessageSquare size={12} /> {task._count?.comments}
                                                                    </div>
                                                                )}

                                                                <div className="flex -space-x-2">
                                                                    {task.assignee ? (
                                                                        <div title={`${task.assignee.firstName} ${task.assignee.lastName}`} className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black border-2 border-white uppercase shadow-sm">
                                                                            {task.assignee.firstName[0]}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-300 flex items-center justify-center border-2 border-white shadow-sm">
                                                                            <Users size={12} />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setQuickLogTask(task);
                                                                        setIsBulkLogOpen(true);
                                                                    }}
                                                                    className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-colors"
                                                                >
                                                                    <Clock size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {isDetailOpen && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    projectId={projectId as string}
                    onClose={() => setIsDetailOpen(false)}
                    onUpdate={fetchTasks}
                />
            )}

            <BulkTimeLogModal
                open={isBulkLogOpen}
                onClose={() => {
                    setIsBulkLogOpen(false);
                    setQuickLogTask(null);
                    fetchTasks();
                }}
                defaultEntry={{
                    projectId: projectId as string,
                    taskId: quickLogTask?.id
                }}
            />
        </div>
    );
}
