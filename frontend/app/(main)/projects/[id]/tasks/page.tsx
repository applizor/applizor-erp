'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { useParams, useSearchParams } from 'next/navigation';
import {
    Plus, LayoutGrid, Copy, Edit2, Trash2, Link as LinkIcon
} from 'lucide-react';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { TaskFilterBar, DEFAULT_TASK_FILTERS, buildTaskDateQueryParams, TaskBoardFilters } from '@/components/tasks/TaskFilterBar';
import { TaskExportButton } from '@/components/tasks/TaskExportButton';
import { KanbanTaskCard, KanbanColumnEmpty, columnDroppableClass, createKanbanTaskCloneRenderer, KanbanCountBadge } from '@/components/tasks/KanbanTaskCard';
import BulkTimeLogModal from '@/components/hrms/timesheets/BulkTimeLogModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Portal from '@/components/ui/Portal';
import { StrictModeDroppable } from '@/components/ui/StrictModeDroppable';
import { useSocket } from '@/contexts/SocketContext';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface Task {
    id: string;
    title: string;
    description: string;
    status: string; // todo, in-progress, review, done
    type: string; // epic, story, task, bug
    priority: string;
    position: number;
    storyPoints?: number;
    updatedAt?: string;
    dueDate?: string | null;
    createdAt?: string;
    assignee?: { id: string, firstName: string, lastName: string };
    assignees?: { user: { id: string, firstName: string, lastName: string } }[];
    epic?: { id: string, title: string };
    hasUnansweredComment?: boolean;
    _count?: { comments: number, documents: number, subtasks: number };
}

function sortByUpdatedAtDesc(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
    });
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

// Placeholder card shown while a column is still loading its first page
function TaskCardSkeleton() {
    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
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
    );
}

export default function KanbanBoard() {
    const { id: projectId } = useParams();
    const [sprints, setSprints] = useState<any[]>([]);
    const [selectedSprintId, setSelectedSprintId] = useState<string>('all');
    const [filters, setFilters] = useState<TaskBoardFilters>({ ...DEFAULT_TASK_FILTERS });
    const [columns, setColumns] = useState<Record<string, Task[]>>({ todo: [], 'in-progress': [], review: [], done: [] });
    const toast = useToast();
    const { socket } = useSocket();

    // Pagination state per column
    const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
    const [colPagination, setColPagination] = useState<Record<string, { page: number; hasMore: boolean; loading: boolean }>>({
        todo: { page: 1, hasMore: true, loading: false },
        'in-progress': { page: 1, hasMore: true, loading: false },
        review: { page: 1, hasMore: true, loading: false },
        done: { page: 1, hasMore: true, loading: false },
    });
    const PAGE_SIZE = 50;

    // Mirror of `columns` for decision-making inside socket handlers without
    // forcing the effect to re-register listeners on every board change.
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

    // Deep Linking State
    const searchParams = useSearchParams();
    const deepLinkedTaskId = searchParams.get('taskId');

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

    const fetchTaskCounts = useCallback(async () => {
        try {
            const params: string[] = [`projectId=${projectId}`];
            if (selectedSprintId !== 'all') params.push(`sprintId=${selectedSprintId}`);
            if (filters.assigneeId !== 'all') params.push(`assigneeId=${filters.assigneeId}`);
            if (filters.type !== 'all') params.push(`type=${filters.type}`);
            if (filters.priority !== 'all') params.push(`priority=${filters.priority}`);
            if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
            const dateParams = buildTaskDateQueryParams(filters);
            Object.entries(dateParams).forEach(([k, v]) => params.push(`${k}=${encodeURIComponent(v)}`));
            const res = await api.get(`/tasks/counts?${params.join('&')}`);
            setTaskCounts(res.data);
        } catch (error) {
            console.error('Failed to load task counts');
        }
    }, [projectId, selectedSprintId, filters]);

    const fetchColumnTasks = useCallback(async (status: string, page: number = 1, append: boolean = false) => {
        setColPagination(prev => ({ ...prev, [status]: { ...prev[status], loading: true } }));
        try {
            const params: string[] = [
                `projectId=${projectId}`,
                `status=${status}`,
                `page=${page}`,
                `limit=${PAGE_SIZE}`,
            ];
            if (selectedSprintId !== 'all') params.push(`sprintId=${selectedSprintId}`);
            if (filters.assigneeId !== 'all') params.push(`assigneeId=${filters.assigneeId}`);
            if (filters.type !== 'all') params.push(`type=${filters.type}`);
            if (filters.priority !== 'all') params.push(`priority=${filters.priority}`);
            if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
            const dateParams = buildTaskDateQueryParams(filters);
            Object.entries(dateParams).forEach(([k, v]) => params.push(`${k}=${encodeURIComponent(v)}`));

            const res = await api.get(`/tasks?${params.join('&')}`);
            const newTasks = res.data.tasks || [];
            const totalPages = res.data.pagination?.totalPages || 1;

            setColumns(prev => ({
                ...prev,
                [status]: append
                    ? sortByUpdatedAtDesc([...prev[status], ...newTasks])
                    : sortByUpdatedAtDesc(newTasks)
            }));

            setColPagination(prev => ({
                ...prev,
                [status]: { page, hasMore: page < totalPages, loading: false }
            }));
        } catch (error) {
            toast.error('Failed to load tasks');
            setColPagination(prev => ({
                ...prev,
                [status]: { ...prev[status], loading: false, hasMore: false }
            }));
        }
    }, [projectId, selectedSprintId, filters, toast]);

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

    const loadMoreTasks = useCallback((status: string) => {
        const col = colPagination[status];
        if (col.loading || !col.hasMore) return;
        fetchColumnTasks(status, col.page + 1, true);
    }, [colPagination, fetchColumnTasks]);

    // Keep fetchTasks for backwards compat (socket reconciliation, drag-drop revert)
    const fetchTasks = useCallback(async () => {
        fetchAllColumns();
    }, [fetchAllColumns]);

    // Initial Load & Socket
    useEffect(() => {
        if (projectId) {
            fetchAllColumns();
            fetchProjectSettings();
            fetchSprints();
        }
    }, [projectId, fetchAllColumns, fetchProjectSettings, fetchSprints]);

    // Granular socket updates: apply the event payload directly to `columns`
    // instead of refetching the whole board, so the board stays responsive
    // when teammates edit tasks. `fetchAllColumns()` is the reconciliation
    // fallback for payloads we can't apply locally.
    const handleSocketEvent = useCallback((type: string, data: any) => {
        if (!data?.projectId || data.projectId !== projectId) return;
        const validStatus = (s: any): s is keyof typeof COLUMNS => s in COLUMNS;

        if (type === 'TASK_CREATED') {
            if (validStatus(data.status)) {
                const created = { ...data, updatedAt: data.updatedAt || new Date().toISOString() };
                setColumns(prev => ({
                    ...prev,
                    [data.status]: sortByUpdatedAtDesc([created, ...prev[data.status]])
                }));
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
            const patched = { ...data, updatedAt: data.updatedAt || new Date().toISOString() };

            if (srcStatus && validStatus(data.status) && data.status !== srcStatus && COLUMNS[data.status as keyof typeof COLUMNS]) {
                // Task moved columns
                setColumns(prev => {
                    const task = prev[srcStatus]?.find(t => t.id === data.id);
                    if (!task) return prev;
                    return {
                        ...prev,
                        [srcStatus]: prev[srcStatus].filter(t => t.id !== data.id),
                        [data.status]: sortByUpdatedAtDesc([{ ...task, ...patched }, ...prev[data.status as keyof typeof COLUMNS]]),
                    };
                });
                setTaskCounts(prev => ({
                    ...prev,
                    [srcStatus]: Math.max(0, (prev[srcStatus] ?? 0) - 1),
                    [data.status]: (prev[data.status] ?? 0) + 1,
                }));
            } else if (srcStatus) {
                // Update in place (covers partial timesheet payloads too)
                setColumns(prev => ({
                    ...prev,
                    [srcStatus]: sortByUpdatedAtDesc(
                        prev[srcStatus].map(t => t.id === data.id ? { ...t, ...patched } : t)
                    )
                }));
            } else if (validStatus(data.status)) {
                // Not loaded yet — prepend so it appears immediately
                setColumns(prev => ({
                    ...prev,
                    [data.status]: sortByUpdatedAtDesc([patched, ...prev[data.status]])
                }));
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
        // TIMER_UPDATED is intentionally not handled here — task cards don't
        // display timer state, so refetching the board for it is pure waste.
    }, [projectId, fetchAllColumns]);

    useEffect(() => {
        if (!socket || !projectId) return;
        const onConnect = () => socket.emit('join-project', projectId);
        if (socket.connected) onConnect();

        const handlers: Record<string, (data: any) => void> = {
            TASK_CREATED: (data) => handleSocketEvent('TASK_CREATED', data),
            TASK_UPDATED: (data) => handleSocketEvent('TASK_UPDATED', data),
            TASK_DELETED: (data) => handleSocketEvent('TASK_DELETED', data),
            COMMENT_DELETED: (data) => handleSocketEvent('COMMENT_DELETED', data),
        };

        socket.on('connect', onConnect);
        Object.entries(handlers).forEach(([ev, h]) => socket.on(ev, h));

        return () => {
            socket.off('connect', onConnect);
            Object.entries(handlers).forEach(([ev, h]) => socket.off(ev, h));
        };
    }, [socket, projectId, handleSocketEvent]);

    // Close menu on scroll or click outside
    useEffect(() => {
        const closeMenu = () => setActiveMenuId(null);
        window.addEventListener('click', closeMenu);
        return () => {
            window.removeEventListener('click', closeMenu);
        };
    }, []);

    // Handle Deep Linking
    useEffect(() => {
        if (deepLinkedTaskId && deepLinkedTaskId !== 'undefined' && deepLinkedTaskId !== 'null') {
            setSelectedTaskId(deepLinkedTaskId);
            setIsDetailOpen(true);
        }
    }, [deepLinkedTaskId]);

    // Filters are applied server-side via fetchColumnTasks deps — no separate client filter pass needed.

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
        if (!can('tasks', 'edit')) {
            toast.error("You don't have permission to move this task");
            return;
        }

        const startCol = Array.from(columns[source.droppableId] || []);
        const finishCol = source.droppableId === destination.droppableId
            ? startCol
            : Array.from(columns[destination.droppableId] || []);

        const [moved] = startCol.splice(source.index, 1);
        if (!moved || moved.id !== draggableId) {
            fetchTasks();
            return;
        }

        const newStatus = destination.droppableId;
        const updatedMoved = { ...moved, status: newStatus };
        finishCol.splice(destination.index, 0, updatedMoved);

        const newCols = { ...columns };
        newCols[source.droppableId] = startCol;
        if (source.droppableId !== destination.droppableId) {
            newCols[destination.droppableId] = finishCol;
            setTaskCounts(prev => ({
                ...prev,
                [source.droppableId]: Math.max(0, (prev[source.droppableId] ?? 0) - 1),
                [destination.droppableId]: (prev[destination.droppableId] ?? 0) + 1,
            }));
        }
        setColumns(newCols);

        try {
            const finishColForPos = finishCol.filter(t => t.id !== draggableId) as Task[];
            const newPosition = calculatePosition(finishColForPos, destination.index);
            await api.put(`/tasks/${draggableId}`, { status: newStatus, position: newPosition });
        } catch (error: any) {
            const status = error?.response?.status;
            toast.error(status === 403
                ? "You don't have permission to move this task"
                : 'Failed to update task');
            fetchTasks();
        }
    }, [columns, calculatePosition, fetchTasks, toast, can]);

    const openTask = useCallback((taskId: string) => {
        setSelectedTaskId(taskId);
        setIsDetailOpen(true);
        setActiveMenuId(null);
        const newUrl = `${window.location.pathname}?taskId=${taskId}`;
        window.history.replaceState(null, '', newUrl);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsDetailOpen(false);
        setSelectedTaskId(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('taskId');
        window.history.replaceState(null, '', url.toString());
    }, []);

    // Listen for back button
    useEffect(() => {
        const handlePopState = () => {
            if (isDetailOpen) {
                setIsDetailOpen(false);
                setSelectedTaskId(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isDetailOpen]);

    const toggleSelectAll = useCallback(() => {
        const allLoaded = Object.values(columns).flat().map(t => t.id);
        setSelectedTaskIds(prev => prev.length === allLoaded.length ? [] : allLoaded);
    }, [columns]);

    const handleBulkStatusUpdate = useCallback(async (newStatus: string) => {
        try {
            await api.put('/tasks/bulk-update', { taskIds: selectedTaskIds, status: newStatus });
            toast.success('Tasks updated successfully');
            setSelectedTaskIds([]);
            setIsBulkStatusModalOpen(false);
            fetchTasks();
        } catch (error) {
            toast.error('Failed to update tasks');
        }
    }, [selectedTaskIds, fetchTasks, toast]);

    const toggleTaskSelection = useCallback((taskId: string) => {
        setSelectedTaskIds(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
    }, []);

    const handleDeleteTask = useCallback(async () => {
        if (!taskToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/tasks/${taskToDelete.id}`);
            toast.success('Task deleted');
            fetchTasks();
            setTaskToDelete(null);
        } catch (error) {
            toast.error('Failed to delete task');
        } finally {
            setIsDeleting(false);
        }
    }, [taskToDelete, fetchTasks, toast]);

    const handleDuplicateTask = useCallback(async (task: Task) => {
        try {
            const { id, _count, ...rest } = task as any;
            const assigneeIds = [rest.assignee?.id, ...(rest.assignees?.map((a: any) => a.user?.id) || [])].filter(Boolean);
            await api.post('/tasks', {
                ...rest,
                title: `${rest.title} (Copy)`,
                projectId,
                assigneeIds: [...new Set(assigneeIds)]
            });
            toast.success('Task duplicated');
            fetchTasks();
            setActiveMenuId(null);
        } catch (error) {
            toast.error('Failed to duplicate task');
        }
    }, [projectId, fetchTasks, toast]);

    const handleCopyLink = useCallback((taskId: string) => {
        const url = `${window.location.origin}${window.location.pathname}?taskId=${taskId}`;
        navigator.clipboard.writeText(url);
        toast.success('Task link copied!');
        setActiveMenuId(null);
    }, [toast]);

    const handleMenuToggle = useCallback((e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setActiveMenuId(prev => (prev === taskId ? null : taskId));
        setMenuPosition({ top: rect.bottom + 5, left: rect.right - 160 }); // Align right
    }, []);

    const handleQuickLog = useCallback((task: Task) => {
        setQuickLogTask(task);
        setIsBulkLogOpen(true);
    }, []);

    // Stable clone renderer — identity must not change mid-drag (janky remounts)
    const renderTaskClone = useMemo(
        () => createKanbanTaskCloneRenderer(
            (id) => Object.values(columnsRef.current).flat().find(t => t.id === id)
        ),
        []
    );

    const [isBoardDragging, setIsBoardDragging] = useState(false);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3 px-1">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <CustomSelect
                        value={selectedSprintId}
                        onChange={(val) => setSelectedSprintId(val)}
                        options={[
                            { label: 'Select Sprint', value: 'all' },
                            ...sprints.map(s => ({
                                label: `${s.name} (${s.status})`,
                                value: s.id
                            }))
                        ]}
                        placeholder="Select Sprint"
                        className="w-full md:w-64"
                        portal={false}
                        leftIcon={<LayoutGrid size={14} className="text-slate-400" />}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <TaskExportButton
                        context={{
                            projectId: projectId as string,
                            sprintId: selectedSprintId,
                            filters,
                            members: project?.members || [],
                            includeProjectColumn: false,
                        }}
                    />
                    {can('tasks', 'create') && (
                        <button
                            onClick={() => openTask('new')}
                            className="btn-primary flex items-center gap-2 text-[10px] whitespace-nowrap"
                        >
                            <Plus size={14} /> New Issue
                        </button>
                    )}
                </div>
            </div>

            <TaskFilterBar
                filters={filters}
                members={project?.members || []}
                onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
                onClearFilters={() => setFilters({ ...DEFAULT_TASK_FILTERS })}
            />

            {/* Bulk Actions Bar */}
            {selectedTaskIds.length > 0 && can('tasks', 'edit') && (
                <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 shadow-xl rounded-lg px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
                    <span className="text-xs font-bold text-slate-700">{selectedTaskIds.length} tasks selected</span>
                    <button
                        onClick={() => setIsBulkStatusModalOpen(true)}
                        className="btn-primary text-[10px]"
                    >
                        Update Status
                    </button>
                    <button
                        onClick={() => setSelectedTaskIds([])}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-900"
                    >
                        Clear
                    </button>
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
                                    <button
                                        key={status}
                                        onClick={() => handleBulkStatusUpdate(status)}
                                        className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 rounded transition-colors"
                                    >
                                        {(COLUMNS as any)[status].title}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setIsBulkStatusModalOpen(false)}
                                className="w-full mt-4 text-xs font-bold text-slate-500"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Board Area */}
            <DragDropContext
                onDragStart={() => setIsBoardDragging(true)}
                onDragEnd={(result) => {
                    setIsBoardDragging(false);
                    onDragEnd(result);
                }}
            >
                <div className={`kanban-board flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar ${isBoardDragging ? 'is-dragging-board' : ''}`}>
                    {Object.entries(COLUMNS).map(([colId, colDef]: [string, any]) => (
                        <div key={colId} className="kanban-column flex-shrink-0 w-80 flex flex-col h-full rounded-xl bg-slate-50/50 border border-slate-200/60">
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
                                    <KanbanCountBadge count={taskCounts[colId] ?? columns[colId]?.length ?? 0} />
                                </div>
                            </div>

                            {/* Droppable Area */}
                            <StrictModeDroppable
                                droppableId={colId}
                                isDropDisabled={!can('tasks', 'edit')}
                                renderClone={renderTaskClone}
                            >
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={columnDroppableClass(snapshot.isDraggingOver)}
                                    >
                                        {columns[colId]?.map((task: Task, index: number) => (
                                            <KanbanTaskCard
                                                key={task.id}
                                                task={task}
                                                index={index}
                                                isSelected={selectedTaskIds.includes(task.id)}
                                                isMenuOpen={activeMenuId === task.id}
                                                isDragDisabled={!can('tasks', 'edit')}
                                                onSelect={toggleTaskSelection}
                                                onOpen={openTask}
                                                onMenuToggle={handleMenuToggle}
                                                onQuickLog={handleQuickLog}
                                            />
                                        ))}
                                        {columns[colId]?.length === 0 && !colPagination[colId]?.loading && (
                                            <KanbanColumnEmpty isDraggingOver={snapshot.isDraggingOver} />
                                        )}
                                        {colPagination[colId]?.loading && columns[colId]?.length === 0 && (
                                            <>
                                                <TaskCardSkeleton />
                                                <TaskCardSkeleton />
                                                <TaskCardSkeleton />
                                            </>
                                        )}
                                        <LoadMoreTrigger colId={colId} loadMore={loadMoreTasks} pagination={colPagination} />
                                        {provided.placeholder}
                                    </div>
                                )}
                            </StrictModeDroppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {isDetailOpen && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    projectId={projectId as string}
                    onClose={handleCloseModal}
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
                    taskId: quickLogTask?.id,
                    taskTitle: quickLogTask?.title
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
                            <button
                                onClick={() => openTask(activeMenuId)}
                                className="w-full text-left px-3 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                                <Edit2 size={12} className="text-sky-500" /> Edit Detail
                            </button>
                            <button
                                onClick={() => {
                                    const task = Object.values(columns).flat().find(t => t.id === activeMenuId);
                                    if (task) handleDuplicateTask(task);
                                }}
                                className="w-full text-left px-3 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                                <Copy size={12} className="text-violet-500" /> Duplicate
                            </button>
                            <button
                                onClick={() => handleCopyLink(activeMenuId)}
                                className="w-full text-left px-3 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                                <LinkIcon size={12} className="text-emerald-500" /> Copy Link
                            </button>
                            <div className="h-[1px] bg-slate-50 my-1" />
                            <button
                                onClick={() => {
                                    const allTasks = Object.values(columns).flat();
                                    const task = allTasks.find(t => t.id === activeMenuId);
                                    if (task) {
                                        setTaskToDelete(task);
                                        setActiveMenuId(null);
                                    }
                                }}
                                className="w-full text-left px-3 py-2 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                            >
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
