'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { TaskBoardFilters, buildTaskDateQueryParams } from '@/components/tasks/TaskFilterBar';

const OPEN_STATUSES = 'todo,in-progress,review';
const ALL_BOARD_STATUSES = 'todo,in-progress,review,done';
const EXPORT_LIMIT = 1000;

export interface TaskExportContext {
    projectId?: string;
    sprintId?: string;
    filters: TaskBoardFilters;
    /** Members used to resolve assignee name for filename / toast */
    members?: any[];
    /** Include Project column (global board) */
    includeProjectColumn?: boolean;
}

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'all';
}

function resolveAssigneeLabel(assigneeId: string, members: any[]): string | null {
    if (!assigneeId || assigneeId === 'all' || assigneeId === 'unassigned') return null;
    for (const m of members) {
        const emp = m?.employee || m;
        const userId = emp?.userId || emp?.id;
        if (userId === assigneeId) {
            const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
            return name || null;
        }
    }
    return null;
}

function formatAssignees(task: any): string {
    const names = new Set<string>();
    if (task.assignee) {
        names.add(`${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim());
    }
    for (const a of task.assignees || []) {
        if (a?.user) {
            names.add(`${a.user.firstName || ''} ${a.user.lastName || ''}`.trim());
        }
    }
    return [...names].filter(Boolean).join('; ') || 'Unassigned';
}

function escapeCsv(v: string | number): string {
    return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function downloadCsvBlob(filename: string, lines: string[]) {
    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function fmtDate(d: string | null | undefined): string {
    if (!d) return '';
    try {
        return format(new Date(d), 'yyyy-MM-dd');
    } catch {
        return '';
    }
}

interface TaskExportButtonProps {
    context: TaskExportContext;
    className?: string;
}

export function TaskExportButton({ context, className }: TaskExportButtonProps) {
    const toast = useToast();
    const [open, setOpen] = useState(false);
    const [includeDone, setIncludeDone] = useState(false);
    const [exporting, setExporting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const handleExport = async () => {
        setExporting(true);
        setOpen(false);
        try {
            const { projectId, sprintId, filters, members = [], includeProjectColumn } = context;
            const statuses = includeDone ? ALL_BOARD_STATUSES : OPEN_STATUSES;
            const params = new URLSearchParams();
            params.set('limit', String(EXPORT_LIMIT));
            params.set('page', '1');
            params.set('status', statuses);
            if (projectId && projectId !== 'all') params.set('projectId', projectId);
            if (sprintId && sprintId !== 'all') params.set('sprintId', sprintId);
            if (filters.assigneeId !== 'all') params.set('assigneeId', filters.assigneeId);
            if (filters.type !== 'all') params.set('type', filters.type);
            if (filters.priority !== 'all') params.set('priority', filters.priority);
            if (filters.search) params.set('search', filters.search);
            const dateParams = buildTaskDateQueryParams(filters);
            Object.entries(dateParams).forEach(([k, v]) => params.set(k, v));

            const { data } = await api.get(`/tasks?${params.toString()}`);
            const tasks: any[] = data.tasks || [];
            const total = data.pagination?.totalTasks ?? tasks.length;

            let assigneeName = resolveAssigneeLabel(filters.assigneeId, members);
            if (!assigneeName && filters.assigneeId !== 'all' && filters.assigneeId !== 'unassigned' && tasks.length > 0) {
                const sample = tasks[0];
                if (sample.assignee?.id === filters.assigneeId) {
                    assigneeName = `${sample.assignee.firstName || ''} ${sample.assignee.lastName || ''}`.trim() || null;
                } else {
                    const match = (sample.assignees || []).find((a: any) => a?.user?.id === filters.assigneeId);
                    if (match?.user) {
                        assigneeName = `${match.user.firstName || ''} ${match.user.lastName || ''}`.trim() || null;
                    }
                }
            }
            const pendingCount = includeDone
                ? tasks.filter(t => t.status !== 'done').length
                : tasks.length;

            if (tasks.length === 0) {
                toast.info('No tasks match the current filters to export.');
                return;
            }

            const dateStr = format(new Date(), 'yyyy-MM-dd');
            const nameSlug = assigneeName
                ? slugify(assigneeName)
                : filters.assigneeId === 'unassigned'
                    ? 'unassigned'
                    : 'all';
            const prefix = includeDone ? 'tasks' : 'pending-tasks';
            const filename = `${prefix}-${nameSlug}-${dateStr}.csv`;

            const headers = [
                'Title',
                'Status',
                'Priority',
                'Type',
                'Assignee(s)',
                'Due date',
                'Updated',
                ...(includeProjectColumn ? ['Project'] : []),
                'Sprint',
            ];

            const summary =
                assigneeName
                    ? includeDone
                        ? `# ${tasks.length} tasks for ${assigneeName} (${pendingCount} pending)`
                        : `# ${pendingCount} pending tasks for ${assigneeName}`
                    : filters.assigneeId === 'unassigned'
                        ? `# ${pendingCount} pending unassigned tasks`
                        : includeDone
                            ? `# ${tasks.length} tasks (${pendingCount} pending)`
                            : `# ${pendingCount} pending tasks`;

            const rows = tasks.map(t => {
                const cols = [
                    t.title || '',
                    t.status || '',
                    t.priority || '',
                    t.type || '',
                    formatAssignees(t),
                    fmtDate(t.dueDate),
                    fmtDate(t.updatedAt),
                ];
                if (includeProjectColumn) cols.push(t.project?.name || '');
                cols.push(t.sprint?.name || '');
                return cols.map(escapeCsv).join(',');
            });

            downloadCsvBlob(filename, [
                summary,
                headers.map(escapeCsv).join(','),
                ...rows,
            ]);

            if (total > EXPORT_LIMIT) {
                toast.success(
                    `Exported ${tasks.length} of ${total} matching tasks (cap ${EXPORT_LIMIT}).` +
                    (assigneeName ? ` ${pendingCount} pending for ${assigneeName}.` : '')
                );
            } else if (assigneeName) {
                toast.success(`${pendingCount} pending tasks for ${assigneeName} — exported to ${filename}`);
            } else {
                toast.success(`Exported ${tasks.length} tasks to ${filename}`);
            }
        } catch (err) {
            console.error('Task export failed', err);
            toast.error('Failed to export tasks');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className={`relative ${className || ''}`} ref={menuRef}>
            <button
                type="button"
                disabled={exporting}
                onClick={() => setOpen(o => !o)}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-md flex items-center gap-2 transition-all whitespace-nowrap disabled:opacity-50"
            >
                <Download size={14} />
                {exporting ? 'Exporting…' : 'Export'}
                <ChevronDown size={12} className="text-slate-400" />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-white border border-slate-200 shadow-xl rounded-lg p-3 animate-in fade-in zoom-in-95 duration-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        Export filtered tasks
                    </p>
                    <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                        Defaults to open statuses (To Do, In Progress, Review). Respects current filters.
                    </p>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer mb-3">
                        <input
                            type="checkbox"
                            checked={includeDone}
                            onChange={(e) => setIncludeDone(e.target.checked)}
                            className="rounded border-slate-300"
                        />
                        Include Done
                    </label>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="btn-primary w-full text-[10px] flex items-center justify-center gap-2"
                    >
                        <Download size={12} />
                        Download CSV
                    </button>
                </div>
            )}
        </div>
    );
}
