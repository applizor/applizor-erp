'use client';

import React from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Filter, X, Users, Tag, AlertCircle } from 'lucide-react';

interface TaskFilterBarProps {
    filters: {
        assigneeId: string;
        type: string;
        priority: string;
        search: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
    members: any[];
}

export function TaskFilterBar({ filters, onFilterChange, onClearFilters, members }: TaskFilterBarProps) {
    const hasActiveFilters = filters.assigneeId !== 'all' || filters.type !== 'all' || filters.priority !== 'all' || filters.search !== '';

    const assigneeOptions = [
        { label: 'Assignee: All', value: 'all' },
        { label: 'Unassigned', value: 'unassigned' },
        ...members.map(m => ({
            label: `${m.employee.firstName} ${m.employee.lastName}`,
            value: m.employee.userId
        }))
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

    return (
        <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
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
            </div>

            {hasActiveFilters && (
                <button
                    onClick={onClearFilters}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-md flex items-center gap-2 transition-all whitespace-nowrap"
                >
                    <X size={14} />
                    Reset
                </button>
            )}
        </div>
    );
}
