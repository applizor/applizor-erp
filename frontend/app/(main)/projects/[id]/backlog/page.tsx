'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import {
    Plus, ChevronDown, ChevronRight, MoreVertical,
    Calendar, Target, Play, CheckCircle2,
    Bug, Bookmark, Layout, CheckSquare, Layers, Trash2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';

interface Task {
    id: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    storyPoints: number;
    sprintId: string | null;
    epic?: { title: string };
    assignee?: { firstName: string, lastName: string };
}

interface Sprint {
    id: string;
    name: string;
    goal: string | null;
    status: string; // future, active, completed
    startDate: string | null;
    endDate: string | null;
    tasks: Task[];
}

export default function BacklogPage() {
    const { id: projectId } = useParams();
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [creatingIn, setCreatingIn] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const toast = useToast();

    const fetchData = useCallback(async () => {
        if (!projectId) return;

        try {
            setLoading(true);
            console.log('Fetching backlog data for project:', projectId);
            const [sprintsRes, tasksRes] = await Promise.all([
                api.get(`/projects/${projectId}/sprints`),
                api.get(`/tasks?projectId=${projectId}`)
            ]);

            const allTasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
            const sprintsData = (Array.isArray(sprintsRes.data) ? sprintsRes.data : []).map((s: any) => ({
                ...s,
                tasks: allTasks.filter((t: any) => t.sprintId === s.id)
            }));

            setSprints(sprintsData);
            setBacklogTasks(allTasks.filter((t: any) => !t.sprintId));
        } catch (error: any) {
            console.error('Backlog load error:', error);
            toast.error(error.response?.data?.message || 'Failed to load backlog data');
        } finally {
            setLoading(false);
        }
    }, [projectId, toast]);

    useEffect(() => {
        if (projectId) fetchData();
    }, [projectId, fetchData]);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const newSprintId = destination.droppableId === 'backlog' ? null : destination.droppableId;

        try {
            await api.put(`/tasks/${draggableId}`, { sprintId: newSprintId });
            fetchData();
        } catch (error) {
            toast.error('Failed to move task');
        }
    };

    const createSprint = async () => {
        try {
            const name = `Sprint ${sprints.length + 1}`;
            await api.post(`/projects/${projectId}/sprints`, { name });
            toast.success('Sprint created');
            fetchData();
        } catch (error) {
            toast.error('Failed to create sprint');
        }
    };

    const deleteSprint = async (sprintId: string) => {
        if (!confirm('Are you sure you want to delete this sprint? Tasks will be moved to backlog.')) return;
        try {
            await api.delete(`/projects/sprints/${sprintId}`);
            toast.success('Sprint deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete sprint');
        }
    };

    const updateSprintStatus = async (sprintId: string, status: string) => {
        try {
            await api.put(`/projects/sprints/${sprintId}`, { status });
            toast.success(`Sprint ${status}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update sprint status');
        }
    };

    const openTaskDetail = (taskId: string) => {
        setSelectedTask(taskId);
        setIsTaskModalOpen(true);
    };

    const handleQuickCreate = async (e: React.KeyboardEvent, sprintId: string | null) => {
        if (e.key === 'Enter' && newTaskTitle.trim()) {
            try {
                await api.post('/tasks', {
                    projectId,
                    title: newTaskTitle,
                    sprintId,
                    type: 'task',
                    status: 'todo'
                });
                setNewTaskTitle('');
                setCreatingIn(null);
                fetchData();
                toast.success('Task created');
            } catch (error) {
                toast.error('Failed to create task');
            }
        }
        if (e.key === 'Escape') {
            setCreatingIn(null);
            setNewTaskTitle('');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Backlog...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Backlog</h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Plan your sprints and manage your backlog</p>
                </div>
                <button
                    onClick={createSprint}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                >
                    <Plus size={14} /> Create Sprint
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="space-y-6">
                    {/* Sprints */}
                    {sprints.map(sprint => (
                        <div key={sprint.id} className="ent-card overflow-hidden">
                            <div className="bg-gray-50/80 p-4 flex justify-between items-center border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <ChevronDown size={16} className="text-gray-400" />
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">{sprint.name}</h3>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-0.5 bg-gray-100 rounded">
                                        {sprint.tasks.length} Issues
                                    </span>
                                    {sprint.status === 'active' && (
                                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase tracking-widest">Active</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => updateSprintStatus(sprint.id, sprint.status === 'active' ? 'completed' : 'active')}
                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded transition-all flex items-center gap-2 ${sprint.status === 'active' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                                    >
                                        {sprint.status === 'active' ? <CheckCircle2 size={12} /> : <Play size={12} />}
                                        {sprint.status === 'active' ? 'Complete' : 'Start'}
                                    </button>
                                    <button
                                        onClick={() => deleteSprint(sprint.id)}
                                        className="text-gray-400 hover:text-rose-600 p-1"
                                        title="Delete Sprint"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <Droppable droppableId={sprint.id}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="min-h-[40px] divide-y divide-gray-50"
                                    >
                                        {sprint.tasks.map((task, index) => (
                                            <TaskItem key={task.id} task={task} index={index} onClick={() => openTaskDetail(task.id)} />
                                        ))}
                                        {sprint.tasks.length === 0 && (
                                            <p className="p-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Plan your sprint by dragging issues here</p>
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                            <div className="p-2 border-t border-gray-50 bg-gray-50/10">
                                {creatingIn === sprint.id ? (
                                    <input
                                        autoFocus
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        onKeyDown={(e) => handleQuickCreate(e, sprint.id)}
                                        placeholder="What needs to be done?"
                                        className="w-full text-[12px] font-bold text-gray-900 border border-indigo-200 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-100 focus:outline-none shadow-sm"
                                    />
                                ) : (
                                    <button
                                        onClick={() => setCreatingIn(sprint.id)}
                                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-400 hover:text-gray-900 hover:bg-white rounded transition-all flex items-center gap-2"
                                    >
                                        <Plus size={14} /> Create Issue
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Backlog Section */}
                    <div className="mt-12">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <Layers size={16} className="text-gray-400" />
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Backlog</h3>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                {backlogTasks.length} Issues
                            </span>
                        </div>

                        <div className="ent-card overflow-hidden">
                            <Droppable droppableId="backlog">
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="min-h-[100px] divide-y divide-gray-50"
                                    >
                                        {backlogTasks.map((task, index) => (
                                            <TaskItem key={task.id} task={task} index={index} onClick={() => openTaskDetail(task.id)} />
                                        ))}
                                        {backlogTasks.length === 0 && (
                                            <p className="p-8 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Your backlog is clear! 🎉</p>
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                            <div className="p-2 border-t border-gray-50 bg-gray-50/10">
                                {creatingIn === 'backlog' ? (
                                    <input
                                        autoFocus
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        onKeyDown={(e) => handleQuickCreate(e, null)}
                                        placeholder="What needs to be done?"
                                        className="w-full text-[12px] font-bold text-gray-900 border border-indigo-200 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-100 focus:outline-none shadow-sm"
                                    />
                                ) : (
                                    <button
                                        onClick={() => setCreatingIn('backlog')}
                                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-400 hover:text-gray-900 hover:bg-white rounded transition-all flex items-center gap-2"
                                    >
                                        <Plus size={14} /> Create Issue
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DragDropContext>

            {isTaskModalOpen && selectedTask && projectId && (
                <TaskDetailModal
                    taskId={selectedTask}
                    projectId={projectId as string}
                    onClose={() => setIsTaskModalOpen(false)}
                    onUpdate={() => {
                        fetchData();
                        setIsTaskModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}

function TaskItem({ task, index, onClick }: { task: Task, index: number, onClick: () => void }) {
    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={onClick}
                    className={`
                        flex items-center gap-4 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer
                        ${snapshot.isDragging ? 'bg-white shadow-xl ring-1 ring-gray-900/5 rotate-1' : ''}
                    `}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Type Icon */}
                        <div className="flex-shrink-0">
                            {task.type === 'bug' ? <Bug size={14} className="text-rose-500" /> :
                                task.type === 'story' ? <Bookmark size={14} className="text-emerald-500" /> :
                                    task.type === 'epic' ? <Layout size={14} className="text-purple-600" /> :
                                        <CheckSquare size={14} className="text-blue-500" />}
                        </div>

                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest select-none">APP-{index + 100}</span>
                                <h4 className="text-[12px] font-bold text-gray-900 truncate">{task.title}</h4>
                            </div>
                            {task.epic && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-purple-600">
                                    {task.epic.title}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0">
                        {/* Status */}
                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${task.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            task.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                'bg-gray-50 text-gray-500 border-gray-100'
                            }`}>
                            {task.status}
                        </div>

                        {/* Story Points */}
                        {task.storyPoints > 0 && (
                            <div className="w-5 h-5 flex items-center justify-center bg-gray-100 text-gray-600 rounded text-[9px] font-black">
                                {task.storyPoints}
                            </div>
                        )}

                        {/* Assignee */}
                        <div className="w-6 h-6 rounded bg-gray-900 text-white flex items-center justify-center text-[9px] font-black uppercase border-2 border-white shadow-sm">
                            {task.assignee?.firstName?.[0] || '?'}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
