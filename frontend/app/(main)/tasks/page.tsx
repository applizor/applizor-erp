'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import {
    Plus, MoreVertical, MessageSquare, Bug, Bookmark, Layout, CheckSquare,
    LayoutGrid, Users, Clock, Copy, Edit2, Trash2, Link as LinkIcon, ListTree, Briefcase
} from 'lucide-react';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { TaskFilterBar } from '@/components/tasks/TaskFilterBar';
import BulkTimeLogModal from '@/components/hrms/timesheets/BulkTimeLogModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Portal from '@/components/ui/Portal';
import { useSocket } from '@/contexts/SocketContext';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface Task {
    id: string;
    projectId: string;
    title: string;
    description: string;
    status: string;
    type: string;
    priority: string;
    position: number;
    storyPoints?: number;
    project?: { id: string, name: string };
    assignee?: { id: string, firstName: string, lastName: string };
    assignees?: { user: { id: string, firstName: string, lastName: string } }[];
    epic?: { id: string, title: string };
    hasUnansweredComment?: boolean;
    _count?: { comments: number, documents: number, subtasks: number };
}

// Load More Trigger with IntersectionObserver for infinite scroll
function LoadMoreTrigger({ colId, loadMore, pagination }: { colId: string; loadMore: (status: string) => void; pagination: any }) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !pagination[colId]?.hasMore || pagination[colId]?.loading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore(colId);
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [colId, loadMore, pagination[colId]?.hasMore, pagination[colId]?.loading]);

    if (!pagination[colId]?.hasMore && !pagination[colId]?.loading) return null;

    return (
        <div ref={sentinelRef} className="py-3 text-center">
            {pagination[colId]?.loading && (
                <div className="flex items-center justify-center gap-2 text-slate-400">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Loading...</span>
                </div>
            )}
        </div>
    );
}

const COLUMNS = {
    'todo': { title: 'To Do', color: 'bg-slate-100 border-slate-200 text-slate-700' },
    'in-progress': { title: 'In Progress', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    'review': { title: 'Review', color: 'bg-purple-50 border-purple-200 text-purple-700' },
    'done': { title: 'Done', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
};

const PAGE_SIZE = 50;

export default function GlobalTasksPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [sprints, setSprints] = useState<any[]>([]);
    const [selectedSprintId, setSelectedSprintId] = useState<string>('all');
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [filters, setFilters] = useState({ assigneeId: 'all', type: 'all', priority: 'all', search: '' });
    const [columns, setColumns] = useState<Record<string, Task[]>>({ todo: [], 'in-progress': [], review: [], done: [] });
    const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
    const [colPagination, setColPagination] = useState<Record<string, { page: number; hasMore: boolean; loading: boolean }>>({
        todo: { page: 1, hasMore: true, loading: false },
        'in-progress': { page: 1, hasMore: true, loading: false },
        review: { page: 1, hasMore: true, loading: false },
        done: { page: 1, hasMore: true, loading: false },
    });
    const toast = useToast();
    const { socket } = useSocket();

    // Mirror of `columns` for decision-making inside socket handlers
    const columnsRef = useRef(columns);
    useEffect(() => { columnsRef.current = columns; }, [columns]);

    // Modal States
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isBulkLogOpen, setIsBulkLogOpen] = useState(false);
    const [quickLogTask, setQuickLogTask] = useState<any>(null);

    // Dropdown & Action States
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);

    // Fetch projects
    const fetchProjects = useCallback(async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data || []);
        } catch (error) {
            console.error('Failed to load projects list', error);
        }
    }, []);

    // Fetch project details when selectedProjectId changes
    useEffect(() => {
        const fetchProjectDetails = async () => {
            if (selectedProjectId && selectedProjectId !== 'all') {
                try {
                    const [projRes, sprintsRes] = await Promise.all([
                        api.get(`/projects/${selectedProjectId}`),
                        api.get(`/projects/${selectedProjectId}/sprints`)
                    ]);
                    setSprints(sprintsRes.data || []);
                    if (projRes.data?.members) {
                        setProjectMembers(projRes.data.members
                            .filter((m: any) => m && m.employee)
                            .map((m: any) => ({
                                id: m.employeeId,
                                userId: m.employee.userId,
                                firstName: m.employee.firstName,
                                lastName: m.employee.lastName
                            })));
                    } else {
                        setProjectMembers([]);
                    }
                } catch (error) {
                    console.error('Failed to load project details', error);
                }
            } else {
                setSprints([]);
                setProjectMembers([]);
                setSelectedSprintId('all');
            }
        };
        fetchProjectDetails();
    }, [selectedProjectId]);

    // Build the base query string for task fetches
    const buildBaseUrl = useCallback(() => {
        let url = '/tasks?limit=' + PAGE_SIZE;
        if (selectedProjectId !== 'all') url += `&projectId=${selectedProjectId}`;
        if (selectedSprintId !== 'all') url += `&sprintId=${selectedSprintId}`;
        return url;
    }, [selectedProjectId, selectedSprintId]);

    // Fetch tasks for a single column (same pattern as project board)
    const fetchColumnTasks = useCallback(async (status: string, page: number = 1, append: boolean = false) => {
        setColPagination(prev => ({ ...prev, [status]: { ...prev[status], loading: true } }));
        try {
            const url = `${buildBaseUrl()}&status=${status}&page=${page}`;
            const res = await api.get(url);
            const newTasks = res.data.tasks || [];
            const totalPages = res.data.pagination?.totalPages || 1;

            setColumns(prev => ({
                ...prev,
                [status]: append ? [...prev[status], ...newTasks] : newTasks
            }));

            setColPagination(prev => ({
                ...prev,
                [status]: { page, hasMore: page < totalPages, loading: false }
            }));
        } catch (error) {
            toast.error('Failed to load tasks');
            setColPagination(prev => ({ ...prev, [status]: { ...prev[status], loading: false } }));
        }
    }, [buildBaseUrl, toast]);

    // Fetch task counts
    const fetchTaskCounts = useCallback(async () => {
        try {
            let url = '/tasks/counts';
            const params: string[] = [];
            if (selectedProjectId !== 'all') params.push(`projectId=${selectedProjectId}`);
            if (selectedSprintId !== 'all') params.push(`sprintId=${selectedSprintId}`);
            if (params.length) url += '?' + params.join('&');
            const res = await api.get(url);
            setTaskCounts(res.data);
        } catch (error) {
            console.error('Failed to load task counts', error);
        }
    }, [selectedProjectId, selectedSprintId]);

    // Fetch all columns (full board refresh)
    const fetchAllColumns = useCallback(async () => {
        const statuses = ['todo', 'in-progress', 'review', 'done'];
        setColPagination(prev => {
            const reset: any = {};
            statuses.forEach(s => { reset[s] = { page: 1, hasMore: true, loading: false }; });
            return reset;
        });
        await Promise.all(statuses.map(s => fetchColumnTasks(s, 1, false)));
        fetchTaskCounts();
    }, [fetchColumnTasks, fetchTaskCounts]);

    // Load more (infinite scroll)
    const loadMoreTasks = useCallback((status: string) => {
        const col = colPagination[status];
        if (col.loading || !col.hasMore) return;
        fetchColumnTasks(status, col.page + 1, true);
    }, [colPagination, fetchColumnTasks]);

    // Initial Load
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        fetchAllColumns();
    }, [fetchAllColumns]);

    // Socket — granular updates (same as project board)
    const handleSocketEvent = useCallback((type: string, data: any) => {
        const validStatus = (s: any): s is keyof typeof COLUMNS => s in COLUMNS;

        if (type === 'TASK_CREATED') {
            if (validStatus(data.status)) {
                setColumns(prev => ({ ...prev, [data.status]: [data, ...prev[data.status]] }));
                setTaskCounts(prev => ({ ...prev, [data.status]: (prev[data.status] ?? 0) + 1 }));
            } else {
                fetchAllColumns();
            }
            return;
        }

        if (type === 'TASK_UPDATED') {
            if (!data.id) { fetchAllColumns(); return; }
            const current = columnsRef.current;
            const srcStatus = Object.keys(COLUMNS).find(col => current[col]?.some(t => t.id === data.id));

            if (srcStatus && validStatus(data.status) && data.status !== srcStatus && COLUMNS[data.status as keyof typeof COLUMNS]) {
                setColumns(prev => {
                    const task = prev[srcStatus]?.find(t => t.id === data.id);
                    if (!task) return prev;
                    return {
                        ...prev,
                        [srcStatus]: prev[srcStatus].filter(t => t.id !== data.id),
                        [data.status]: [{ ...task, ...data }, ...prev[data.status]],
                    };
                });
                setTaskCounts(prev => ({
                    ...prev,
                    [srcStatus]: Math.max(0, (prev[srcStatus] ?? 0) - 1),
                    [data.status]: (prev[data.status] ?? 0) + 1,
                }));
            } else if (srcStatus) {
                setColumns(prev => ({ ...prev, [srcStatus]: prev[srcStatus].map(t => t.id === data.id ? { ...t, ...data } : t) }));
            } else if (validStatus(data.status)) {
                setColumns(prev => ({ ...prev, [data.status]: [data, ...prev[data.status]] }));
                setTaskCounts(prev => ({ ...prev, [data.status]: (prev[data.status] ?? 0) + 1 }));
            }
            return;
        }

        if (type === 'TASK_DELETED') {
            if (!data.id) { fetchAllColumns(); return; }
            const current = columnsRef.current;
            const col = Object.keys(COLUMNS).find(c => current[c]?.some(t => t.id === data.id));
            if (col) {
                setColumns(prev => ({ ...prev, [col]: prev[col].filter(t => t.id !== data.id) }));
                setTaskCounts(prev => ({ ...prev, [col]: Math.max(0, (prev[col] ?? 0) - 1) }));
            }
            return;
        }

        if (type === 'COMMENT_DELETED') {
            if (!data.taskId) { fetchAllColumns(); return; }
            setColumns(prev => {
                const next: Record<string, Task[]> = { ...prev };
                for (const col of Object.keys(COLUMNS)) {
                    next[col] = next[col].map(t => t.id === data.taskId
                        ? { ...t, _count: t._count ? { ...t._count, comments: Math.max(0, (t._count.comments ?? 0) - 1) } : t._count }
                        : t);
                }
                return next;
            });
        }
    }, [fetchAllColumns]);

    useEffect(() => {
        if (!socket) return;
        const handlers: Record<string, (data: any) => void> = {
            TASK_CREATED: (data) => handleSocketEvent('TASK_CREATED', data),
            TASK_UPDATED: (data) => handleSocketEvent('TASK_UPDATED', data),
            TASK_DELETED: (data) => handleSocketEvent('TASK_DELETED', data),
            COMMENT_DELETED: (data) => handleSocketEvent('COMMENT_DELETED', data),
        };
        Object.entries(handlers).forEach(([ev, h]) => socket.on(ev, h));
        return () => {
            Object.entries(handlers).forEach(([ev, h]) => socket.off(ev, h));
        };
    }, [socket, handleSocketEvent]);

    // Close menu on click outside
    useEffect(() => {
        const closeMenu = () => setActiveMenuId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const calculatePosition = useCallback((items: Task[], index: number) => {
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

        const startCol = Array.from(columns[source.droppableId]);
        const finishCol = source.droppableId === destination.droppableId ? startCol : Array.from(columns[destination.droppableId]);

        const [moved] = startCol.splice(source.index, 1);
        const newStatus = destination.droppableId;
        const updatedMoved = { ...(moved as any), status: newStatus };

        finishCol.splice(destination.index, 0, updatedMoved);

        const newCols = { ...columns };
        newCols[source.droppableId] = startCol;
        if (source.droppableId !== destination.droppableId) {
            newCols[destination.droppableId] = finishCol;
        }
        setColumns(newCols);

        try {
            const finishColForPos = finishCol.filter(t => t.id !== draggableId) as Task[];
            const newPosition = calculatePosition(finishColForPos, destination.index);
            await api.put(`/tasks/${draggableId}`, { status: newStatus, position: newPosition });
        } catch (error) {
            toast.error('Failed to update task');
            fetchAllColumns();
        }
    }, [columns, calculatePosition, fetchAllColumns, toast]);

    const openTask = useCallback((taskId: string) => {
        setSelectedTaskId(taskId);
        setIsDetailOpen(true);
        setActiveMenuId(null);
    }, []);

    const handleBulkStatusUpdate = useCallback(async (newStatus: string) => {
        try {
            await api.put('/tasks/bulk-update', { taskIds: selectedTaskIds, status: newStatus });
            toast.success('Tasks updated successfully');
            setSelectedTaskIds([]);
            setIsBulkStatusModalOpen(false);
            fetchAllColumns();
        } catch (error) {
            toast.error('Failed to update tasks');
        }
    }, [selectedTaskIds, fetchAllColumns, toast]);

    const toggleTaskSelection = useCallback((taskId: string) => {
        setSelectedTaskIds(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
    }, []);

    const handleDeleteTask = useCallback(async () => {
        if (!taskToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/tasks/${taskToDelete.id}`);
            toast.success('Task deleted');
            fetchAllColumns();
            setTaskToDelete(null);
        } catch (error) {
            toast.error('Failed to delete task');
        } finally {
            setIsDeleting(false);
        }
    }, [taskToDelete, fetchAllColumns, toast]);

    const handleDuplicateTask = useCallback(async (task: Task) => {
        try {
            const { id, _count, ...rest } = task as any;
            const assigneeIds = [rest.assignee?.id, ...(rest.assignees?.map((a: any) => a.user?.id) || [])].filter(Boolean);
            await api.post('/tasks', {
                ...rest,
                title: `${rest.title} (Copy)`,
                projectId: task.projectId,
                assigneeIds: [...new Set(assigneeIds)]
            });
            toast.success('Task duplicated');
            fetchAllColumns();
            setActiveMenuId(null);
        } catch (error) {
            toast.error('Failed to duplicate task');
        }
    }, [fetchAllColumns, toast]);

    const handleCopyLink = useCallback((taskId: string, targetProjectId: string) => {
        const url = `${window.location.origin}/projects/${targetProjectId}/tasks?taskId=${taskId}`;
        navigator.clipboard.writeText(url);
        toast.success('Task link copied!');
        setActiveMenuId(null);
    }, [toast]);

    const handleMenuToggle = useCallback((e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setActiveMenuId(prev => (prev === taskId ? null : taskId));
        setMenuPosition({ top: rect.bottom + 5, left: rect.right - 160 });
    }, []);

    const handleQuickLog = useCallback((task: Task) => {
        setQuickLogTask(task);
        setIsBulkLogOpen(true);
    }, []);

    const allLoadedTasks = Object.values(columns).flat();

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in space-y-4">

            {/* Header */}
            <div className="px-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    Global Tasks Board
                    <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] tracking-widest font-bold">
                        {Object.values(taskCounts).reduce((a, b) => a + b, 0) || allLoadedTasks.length}
                    </span>
                </h1>
                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">
                    Manage and view tasks across all projects and ad-hoc containers
                </p>
            </div>

            {/* Project & Sprint selection */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    <CustomSelect
                        value={selectedProjectId}
                        onChange={(val) => {
                            setSelectedProjectId(val);
                            setSelectedSprintId('all');
                        }}
                        options={[
                            { label: 'All Projects', value: 'all' },
                            ...projects.map(p => ({ label: p.name, value: p.id }))
                        ]}
                        placeholder="Filter by Project"
                        className="w-full md:w-64"
                        portal={false}
                        leftIcon={<Briefcase size={14} className="text-slate-400" />}
                    />

                    {selectedProjectId !== 'all' && sprints.length > 0 && (
                        <CustomSelect
                            value={selectedSprintId}
                            onChange={(val) => setSelectedSprintId(val)}
                            options={[
                                { label: 'All Sprints', value: 'all' },
                                ...sprints.map(s => ({ label: `${s.name} (${s.status})`, value: s.id }))
                            ]}
                            placeholder="Filter by Sprint"
                            className="w-full md:w-64 animate-in fade-in duration-300"
                            portal={false}
                            leftIcon={<LayoutGrid size={14} className="text-slate-400" />}
                        />
                    )}
                </div>

                <button
                    onClick={() => openTask('new')}
                    className="btn-primary flex items-center gap-2 text-[10px] whitespace-nowrap"
                >
                    <Plus size={14} /> New Task
                </button>
            </div>

            {/* Filters */}
            <TaskFilterBar
                filters={filters}
                members={projectMembers}
                onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
                onClearFilters={() => setFilters({ assigneeId: 'all', type: 'all', priority: 'all', search: '' })}
            />

            {/* Bulk Actions Bar */}
            {selectedTaskIds.length > 0 && (
                <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 shadow-xl rounded-lg px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
                    <span className="text-xs font-bold text-slate-700">{selectedTaskIds.length} tasks selected</span>
                    <button onClick={() => setIsBulkStatusModalOpen(true)} className="btn-primary text-[10px]">Update Status</button>
                    <button onClick={() => setSelectedTaskIds([])} className="text-[10px] font-bold text-slate-500 hover:text-slate-900">Clear</button>
                </div>
            )}

            {/* Status Selection Modal */}
            {isBulkStatusModalOpen && (
                <Portal>
                    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center animate-fade-in">
                        <div className="bg-white p-6 rounded-lg w-80 shadow-2xl scale-95 animate-in fade-in zoom-in duration-150">
                            <h2 className="text-sm font-black mb-4">Update Status</h2>
                            <div className="space-y-2">
                                {Object.keys(COLUMNS).map(status => (
                                    <button key={status} onClick={() => handleBulkStatusUpdate(status)}
                                        className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 rounded transition-colors">
                                        {(COLUMNS as any)[status].title}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setIsBulkStatusModalOpen(false)} className="w-full mt-4 text-xs font-bold text-slate-500">Cancel</button>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Board Area — column-wise API calls like project board */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {Object.entries(COLUMNS).map(([colId, colDef]: [string, any]) => (
                        <div key={colId} className="flex-shrink-0 w-80 flex flex-col h-full rounded-xl bg-slate-50/50 border border-slate-200/60">
                            {/* Column Header */}
                            <div className={`p-4 border-b ${colDef.color.split(' ').filter((c: string) => c.startsWith('border')).join(' ')} flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-t-xl`}>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="cursor-pointer"
                                        checked={columns[colId].length > 0 && columns[colId].every(t => selectedTaskIds.includes(t.id))}
                                        onChange={(e) => {
                                            const taskIdsInCol = columns[colId].map(t => t.id);
                                            if (e.target.checked) {
                                                setSelectedTaskIds(prev => Array.from(new Set([...prev, ...taskIdsInCol])));
                                            } else {
                                                setSelectedTaskIds(prev => prev.filter(id => !taskIdsInCol.includes(id)));
                                            }
                                        }}
                                    />
                                    <h3 className={`font-black text-[11px] uppercase tracking-widest ${colDef.color.split(' ').filter((c: string) => c.startsWith('text')).join(' ')}`}>
                                        {colDef.title}
                                    </h3>
                                    <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-black">
                                        {taskCounts[colId] ?? columns[colId]?.length ?? 0}
                                    </span>
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
                                                        className={`bg-white p-4 rounded-lg border shadow-sm group cursor-pointer ${task.hasUnansweredComment ? 'border-amber-400 ring-2 ring-amber-400/20 animate-pulse-subtle' : 'border-slate-200'} ${snapshot.isDragging ? 'rotate-1 shadow-xl ring-2 ring-primary-500/20 z-50 transition-none' : 'transition-all duration-200 hover:border-primary-300 hover:shadow-md active:scale-[0.985]'}`}
                                                    >
                                                        {/* Project Tag */}
                                                        {selectedProjectId === 'all' && task.project && (
                                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 truncate">
                                                                {task.project.name}
                                                            </div>
                                                        )}

                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex gap-1.5 flex-wrap items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedTaskIds.includes(task.id)}
                                                                    onChange={(e) => { e.stopPropagation(); toggleTaskSelection(task.id); }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="mr-2 cursor-pointer"
                                                                />
                                                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${task.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                    task.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                                        'bg-slate-50 text-slate-500 border-slate-100'
                                                                    }`}>
                                                                    {task.priority}
                                                                </span>
                                                                {task.hasUnansweredComment && (
                                                                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-500 text-white border-amber-600 animate-pulse">
                                                                        Client Message
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <button
                                                                onClick={(e) => handleMenuToggle(e, task.id)}
                                                                className={`p-1 rounded transition-all ${activeMenuId === task.id ? 'bg-slate-100 text-slate-900' : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-600'}`}
                                                            >
                                                                <MoreVertical size={14} />
                                                            </button>
                                                        </div>

                                                        <h4 className="text-xs font-bold text-slate-800 mb-2 leading-relaxed">
                                                            {task.title}
                                                        </h4>

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
                                                                {(task._count?.subtasks || 0) > 0 && (
                                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400" title="Subtasks">
                                                                        <ListTree size={12} /> {task._count?.subtasks}
                                                                    </div>
                                                                )}
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
                                                                    onClick={(e) => { e.stopPropagation(); handleQuickLog(task); }}
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

                                        {/* Skeleton while loading */}
                                        {colPagination[colId]?.loading && columns[colId]?.length === 0 && (
                                            <>
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="h-4 w-16 shimmer rounded" />
                                                            <div className="h-4 w-4 shimmer rounded" />
                                                        </div>
                                                        <div className="h-3 w-3/4 shimmer rounded mb-2" />
                                                        <div className="h-3 w-1/2 shimmer rounded mb-4" />
                                                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                                            <div className="h-4 w-4 shimmer rounded-full" />
                                                            <div className="h-6 w-6 shimmer rounded-md" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* Infinite scroll trigger */}
                                        <LoadMoreTrigger colId={colId} loadMore={loadMoreTasks} pagination={colPagination} />

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
                    projectId={selectedProjectId !== 'all' ? selectedProjectId : allLoadedTasks.find(t => t.id === selectedTaskId)?.projectId}
                    onClose={() => setIsDetailOpen(false)}
                    onUpdate={fetchAllColumns}
                />
            )}

            <BulkTimeLogModal
                open={isBulkLogOpen}
                onClose={() => {
                    setIsBulkLogOpen(false);
                    setQuickLogTask(null);
                    fetchAllColumns();
                }}
                defaultEntry={{
                    projectId: quickLogTask?.projectId,
                    taskId: quickLogTask?.id
                }}
            />

            {/* Dropdown Menu Portal */}
            {activeMenuId && (
                <Portal>
                    <div
                        className="fixed z-[9999] bg-white rounded-md shadow-2xl border border-slate-100 w-40 overflow-hidden animate-in fade-in zoom-in duration-75"
                        style={{ top: menuPosition.top, left: menuPosition.left }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="py-1">
                            <button onClick={() => openTask(activeMenuId)}
                                className="w-full text-left px-3 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                                <Edit2 size={12} className="text-sky-500" /> Edit Detail
                            </button>
                            <button
                                onClick={() => {
                                    const task = allLoadedTasks.find(t => t.id === activeMenuId);
                                    if (task) handleDuplicateTask(task);
                                }}
                                className="w-full text-left px-3 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                                <Copy size={12} className="text-violet-500" /> Duplicate
                            </button>
                            <button
                                onClick={() => {
                                    const task = allLoadedTasks.find(t => t.id === activeMenuId);
                                    if (task) handleCopyLink(activeMenuId, task.projectId);
                                }}
                                className="w-full text-left px-3 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                                <LinkIcon size={12} className="text-emerald-500" /> Copy Link
                            </button>
                            <div className="h-[1px] bg-slate-50 my-1" />
                            <button
                                onClick={() => {
                                    const task = allLoadedTasks.find(t => t.id === activeMenuId);
                                    if (task) {
                                        setTaskToDelete(task);
                                        setActiveMenuId(null);
                                    }
                                }}
                                className="w-full text-left px-3 py-2 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 flex items-center gap-2 transition-colors">
                                <Trash2 size={12} /> Delete Issue
                            </button>
                        </div>
                    </div>
                </Portal>
            )}

            <ConfirmDialog
                isOpen={!!taskToDelete}
                onClose={() => setTaskToDelete(null)}
                onConfirm={handleDeleteTask}
                title="Delete Issue"
                message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete Issue"
                cancelText="Cancel"
                type="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
