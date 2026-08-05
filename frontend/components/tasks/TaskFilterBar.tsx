'use client';

import React from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Filter, X, Users, Tag, AlertCircle, Calendar } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';

export type TaskDatePreset = 'all' | 'updated_today' | 'updated_7d' | 'updated_30d' | 'due_overdue' | 'due_7d' | 'custom';

export interface TaskBoardFilters {
    assigneeId: string;
    type: string;
    priority: string;
    search: string;
    datePreset: TaskDatePreset;
    dateFrom: string;
    dateTo: string;
}

export const DEFAULT_TASK_FILTERS: TaskBoardFilters = {
    assigneeId: 'all',
    type: 'all',
    priority: 'all',
    search: '',
    datePreset: 'all',
    dateFrom: '',
    dateTo: '',
};

/** Build updatedFrom/updatedTo/dueFrom/dueTo query params from filter bar state. */
export function buildTaskDateQueryParams(filters: Pick<TaskBoardFilters, 'datePreset' | 'dateFrom' | 'dateTo'>): Record<string, string> {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const params: Record<string, string> = {};

    switch (filters.datePreset) {
        case 'updated_today':
            params.updatedFrom = todayStr;
            params.updatedTo = todayStr;
            break;
        case 'updated_7d':
            params.updatedFrom = format(subDays(today, 7), 'yyyy-MM-dd');
            params.updatedTo = todayStr;
            break;
        case 'updated_30d':
            params.updatedFrom = format(subDays(today, 30), 'yyyy-MM-dd');
            params.updatedTo = todayStr;
            break;
        case 'due_overdue':
            params.dueTo = format(subDays(today, 1), 'yyyy-MM-dd');
            break;
        case 'due_7d':
            params.dueFrom = todayStr;
            params.dueTo = format(addDays(today, 7), 'yyyy-MM-dd');
            break;
        case 'custom':
            if (filters.dateFrom) params.updatedFrom = filters.dateFrom;
            if (filters.dateTo) params.updatedTo = filters.dateTo;
            break;
        default:
            break;
    }
    return params;
}

interface TaskFilterBarProps {
    filters: TaskBoardFilters;
    onFilterChange: (key: keyof TaskBoardFilters, value: string) => void;
    onClearFilters: () => void;
    members: any[];
}

export function TaskFilterBar({ filters, onFilterChange, onClearFilters, members }: TaskFilterBarProps) {
    const hasActiveFilters =
        filters.assigneeId !== 'all' ||
        filters.type !== 'all' ||
        filters.priority !== 'all' ||
        filters.search !== '' ||
        filters.datePreset !== 'all' ||
        !!filters.dateFrom ||
        !!filters.dateTo;

    const assigneeOptions = [
        { label: 'Assignee: All', value: 'all' },
        { label: 'Unassigned', value: 'unassigned' },
        ...members.filter(Boolean).map(m => {
            const emp = m.employee || m;
            const firstName = emp.firstName || '';
            const lastName = emp.lastName || '';
            const userId = emp.userId || '';
            return {
                label: `${firstName} ${lastName}`.trim() || 'Unknown Member',
                value: userId
            };
        })
    ];

    const typeOptions = [
        { label: 'Type: All', value: 'all' },
        { label: 'Task', value: 'task' },
        { label: 'Bug', value: 'bug' },
        { label: 'Story', value: 'story' },
        { label: 'Epic', value: 'epic' }
    ];

    const priorityOptions = [
        { label: 'Priority: All', value: 'all' },
        { label: 'Urgent', value: 'urgent' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' }
    ];

    const dateOptions = [
        { label: 'Date: All', value: 'all' },
        { label: 'Updated today', value: 'updated_today' },
        { label: 'Updated last 7 days', value: 'updated_7d' },
        { label: 'Updated last 30 days', value: 'updated_30d' },
        { label: 'Due overdue', value: 'due_overdue' },
        { label: 'Due next 7 days', value: 'due_7d' },
        { label: 'Custom updated range', value: 'custom' },
    ];

    return (
        <div className="flex flex-col gap-3 mb-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 w-full">
                    {/* Search */}
                    <div className="relative">
                        <input
                            placeholder="Search tasks..."
                            className="ent-input w-full pl-9"
                            value={filters.search}
                            onChange={(e) => onFilterChange('search', e.target.value)}
                        />
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* Assignee */}
                    <CustomSelect
                        value={filters.assigneeId}
                        onChange={(val) => onFilterChange('assigneeId', val)}
                        options={assigneeOptions}
                        placeholder="Assignee: All"
                        className="w-full"
                        leftIcon={<Users size={14} className="text-slate-400" />}
                    />

                    {/* Type */}
                    <CustomSelect
                        value={filters.type}
                        onChange={(val) => onFilterChange('type', val)}
                        options={typeOptions}
                        placeholder="Type: All"
                        className="w-full"
                        leftIcon={<Tag size={14} className="text-slate-400" />}
                    />

                    {/* Priority */}
                    <CustomSelect
                        value={filters.priority}
                        onChange={(val) => onFilterChange('priority', val)}
                        options={priorityOptions}
                        placeholder="Priority: All"
                        className="w-full"
                        leftIcon={<AlertCircle size={14} className="text-slate-400" />}
                    />

                    {/* Date */}
                    <CustomSelect
                        value={filters.datePreset}
                        onChange={(val) => onFilterChange('datePreset', val)}
                        options={dateOptions}
                        placeholder="Date: All"
                        className="w-full"
                        leftIcon={<Calendar size={14} className="text-slate-400" />}
                    />
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-md flex items-center gap-2 transition-all whitespace-nowrap self-start md:self-auto"
                    >
                        <X size={14} />
                        Reset
                    </button>
                )}
            </div>

            {filters.datePreset === 'custom' && (
                <div className="flex flex-wrap items-center gap-3 pl-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Updated</span>
                    <input
                        type="date"
                        className="ent-input w-auto text-xs"
                        value={filters.dateFrom}
                        onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                        aria-label="Updated from"
                    />
                    <span className="text-[10px] font-bold text-slate-400">to</span>
                    <input
                        type="date"
                        className="ent-input w-auto text-xs"
                        value={filters.dateTo}
                        onChange={(e) => onFilterChange('dateTo', e.target.value)}
                        aria-label="Updated to"
                    />
                </div>
            )}
        </div>
    );
}
