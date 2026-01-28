'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import { Plus, MoreVertical, Paperclip, MessageSquare, Bug, Bookmark, Layout, CheckSquare } from 'lucide-react';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import BulkTimeLogModal from '@/components/timesheets/BulkTimeLogModal';
import { Clock as ClockIcon } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

// Types
interface Task {
    id: string;
    title: string;
    description: string;
    status: string; // todo, in-progress, review, done
    type: string; // epic, story, task, bug
    priority: string;
    storyPoints?: number;
    assignee?: { firstName: string, lastName: string };
    epic?: { id: string, title: string };
    _count?: { comments: number, documents: number };
}

const COLUMNS = {
    'todo': { title: 'To Do', color: 'bg-gray-100 border-gray-200' },
    'in-progress': { title: 'In Progress', color: 'bg-blue-50 border-blue-200' },
    'review': { title: 'Review', color: 'bg-purple-50 border-purple-200' },
    'done': { title: 'Done', color: 'bg-green-50 border-green-200' },
};

import { useProjectPermissions } from '@/hooks/useProjectPermissions';

// ... (other imports)

export default function KanbanBoard() {
    const { id: projectId } = useParams();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [sprints, setSprints] = useState<any[]>([]);
    const [selectedSprintId, setSelectedSprintId] = useState<string>('all');
    const [columns, setColumns] = useState<any>({ todo: [], 'in-progress': [], review: [], done: [] });
    const toast = useToast();
    const { socket } = useSocket();
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isBulkLogOpen, setIsBulkLogOpen] = useState(false);
    const [quickLogTask, setQuickLogTask] = useState<any>(null);
    const [project, setProject] = useState<any>(null); // Need project for permissions
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

            // Set active sprint as default if nothing selected yet
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
            const data = res.data;
            setTasks(data);
            distributeTasks(data);
        } catch (error) {
            toast.error('Failed to load tasks');
        }
    }, [projectId, selectedSprintId, toast]);

    useEffect(() => {
        if (projectId) {
            fetchTasks();
            fetchProjectSettings();
            fetchSprints();
        }
    }, [projectId, fetchTasks, fetchProjectSettings, fetchSprints]);

    useEffect(() => {
        if (!socket || !projectId) return;

        const onConnect = () => {
            console.log('Socket connected/reconnected, joining project room:', projectId);
            socket.emit('join-project', projectId);
        };

        // Join immediately if already connected
        if (socket.connected) {
            onConnect();
        }

        socket.on('connect', onConnect);
        socket.on('TASK_CREATED', (data) => {
            if (data.projectId === projectId) fetchTasks();
        });
        socket.on('TASK_UPDATED', (data) => {
            if (data.projectId === projectId) fetchTasks();
        });
        socket.on('TASK_DELETED', (data) => {
            if (data.projectId === projectId) fetchTasks();
        });

        return () => {
            socket.off('connect', onConnect);
            socket.off('TASK_CREATED');
            socket.off('TASK_UPDATED');
            socket.off('TASK_DELETED');
        };
    }, [socket, projectId, fetchTasks]);

    const distributeTasks = (taskList: Task[]) => {
        const newCols: any = { todo: [], 'in-progress': [], review: [], done: [] };
        taskList.forEach(task => {
            if (newCols[task.status]) {
                newCols[task.status].push(task);
            } else {
                newCols['todo'].push(task); // Fallback
            }
        });
        setColumns(newCols);
    };

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Optimistic Update
        const startCol = columns[source.droppableId];
        const finishCol = columns[destination.droppableId];

        if (source.droppableId === destination.droppableId) {
            // Reorder in same column (if we stored order, currently purely optimistic visual)
            const newTasks = Array.from(startCol);
            const [moved] = newTasks.splice(source.index, 1);
            newTasks.splice(destination.index, 0, moved);
            setColumns((prev: any) => ({ ...prev, [source.droppableId]: newTasks }));
        } else {
            // Move across columns
            const startTasks = Array.from(startCol);
            const finishTasks = Array.from(finishCol);
            const [moved] = startTasks.splice(source.index, 1);

            // Update status internally
            const updatedTask = { ...(moved as any), status: destination.droppableId };
            finishTasks.splice(destination.index, 0, updatedTask);

            setColumns((prev: Record<string, Task[]>) => ({
                ...prev,
                [source.droppableId]: startTasks,
                [destination.droppableId]: finishTasks
            }));

            // API Call
            try {
                await api.put(`/tasks/${draggableId}`, { status: destination.droppableId });
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
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-1">
                <h2 className="text-xl font-bold text-slate-800">Board</h2>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedSprintId}
                        onChange={(e) => setSelectedSprintId(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    >
                        <option value="all">All Issues</option>
                        {sprints.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                        ))}
                    </select>
                    {/* Add Task Button */}
                    {can('tasks', 'create') && (
                        <button
                            onClick={() => openTask('new')}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
                        >
                            <Plus size={16} />
                            Create Issue
                        </button>
                    )}
                </div>
            </div>

            {/* Board */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
                    {Object.entries(COLUMNS).map(([colId, colDef]: [string, any]) => (
                        <div key={colId} className={`flex-shrink-0 w-80 flex flex-col rounded-xl bg-gray-50/50 border border-gray-100`}>
                            {/* Column Header */}
                            <div className={`p-3 border-b ${colDef.color.split(' ')[1]} flex justify-between items-center sticky top-0 bg-inherit rounded-t-xl z-10`}>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${colId === 'done' ? 'bg-green-500' : colId === 'review' ? 'bg-purple-500' : colId === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                    <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">{colDef.title}</h3>
                                    <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {columns[colId]?.length || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Droppable Area */}
                            <Droppable droppableId={colId}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 p-2 space-y-2 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}
                                    >
                                        {columns[colId]?.map((task: Task, index: number) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => openTask(task.id)}
                                                        className={`bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer ${snapshot.isDragging ? 'rotate-2 shadow-lg ring-2 ring-indigo-500/20' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${task.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                                                                task.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                                                                    'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                {task.priority}
                                                            </span>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100">
                                                                    <MoreVertical size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Epic Label */}
                                                        {task.epic && (
                                                            <div className="mb-2">
                                                                <span className="text-[8px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 truncate inline-block max-w-full">
                                                                    {task.epic.title}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <h4 className="text-[13px] font-bold text-slate-800 mb-3 leading-snug line-clamp-2">
                                                            {task.title}
                                                        </h4>

                                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                                            <div className="flex items-center gap-2">
                                                                {/* Type Indicator */}
                                                                <div title={task.type} className="flex items-center">
                                                                    {task.type === 'bug' ? <Bug size={14} className="text-rose-500" /> :
                                                                        task.type === 'story' ? <Bookmark size={14} className="text-emerald-500" /> :
                                                                            task.type === 'epic' ? <Layout size={14} className="text-purple-600" /> :
                                                                                <CheckSquare size={14} className="text-blue-500" />}
                                                                </div>

                                                                {/* Story Points */}
                                                                {task.storyPoints !== undefined && task.storyPoints > 0 && (
                                                                    <span className="w-5 h-5 flex items-center justify-center bg-slate-100 text-slate-600 rounded-full text-[9px] font-black">
                                                                        {task.storyPoints}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-3 text-slate-400">
                                                                {(task._count?.documents || 0) > 0 && (
                                                                    <div className="flex items-center gap-1 text-[10px]">
                                                                        <Paperclip size={12} />
                                                                        <span>{task._count?.documents}</span>
                                                                    </div>
                                                                )}
                                                                {(task._count?.comments || 0) > 0 && (
                                                                    <div className="flex items-center gap-1 text-[10px]">
                                                                        <MessageSquare size={12} />
                                                                        <span>{task._count?.comments}</span>
                                                                    </div>
                                                                )}

                                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold border-2 border-white ring-1 ring-slate-100">
                                                                    {task.assignee?.firstName?.[0] || '?'}
                                                                </div>
                                                            </div>

                                                            {/* Quick Actions */}
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setQuickLogTask(task);
                                                                        setIsBulkLogOpen(true);
                                                                    }}
                                                                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all"
                                                                    title="Quick Log Time"
                                                                >
                                                                    <ClockIcon size={14} />
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

            {/* Modal Placeholder */}
            {/* Task Detail Modal */}
            {isDetailOpen && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    projectId={projectId as string}
                    onClose={() => setIsDetailOpen(false)}
                    onUpdate={() => {
                        fetchTasks();
                        // fetchProjectSettings(); // Optional: if tasks affect project stats
                    }}
                />
            )}

            {/* Quick Log Modal */}
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
