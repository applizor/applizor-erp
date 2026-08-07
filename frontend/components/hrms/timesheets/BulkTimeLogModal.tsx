'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { CustomSelect } from '@/components/ui/CustomSelect';
import api from '@/lib/api';
import { Loader2, Plus, Trash2, Clock, Calculator, Briefcase, ListTodo } from 'lucide-react';

interface BulkTimeLogModalProps {
    open: boolean;
    onClose: () => void;
    defaultEntry?: {
        projectId?: string;
        taskId?: string;
        taskTitle?: string;
        hours?: string | number;
    };
}

/**
 * Billable visibility:
 * Shown only when Timesheet update scope is `all` (company-wide managers/admins).
 * Regular employees (owned-only create) never see the control — entries default to
 * the project's `isBillable` (schema default true).
 */
export default function BulkTimeLogModal({ open, onClose, defaultEntry }: BulkTimeLogModalProps) {
    const { success, error: showError } = useToast();
    const { getScope } = usePermission();
    const canManageBillable = getScope('Timesheet', 'update') === 'all';

    const [submitting, setSubmitting] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);

    const lockedTaskId = defaultEntry?.taskId || '';
    const isTaskLocked = Boolean(lockedTaskId);
    const isProjectLocked = isTaskLocked && Boolean(defaultEntry?.projectId);

    const projectBillableDefault = (projectId: string) => {
        const p = projects.find((x) => x.id === projectId);
        return p?.isBillable !== false;
    };

    const { register, control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
        defaultValues: {
            projectId: defaultEntry?.projectId || '',
            date: new Date().toISOString().split('T')[0],
            entries: [
                { taskId: defaultEntry?.taskId || '', hours: defaultEntry?.hours || '', description: '', billable: true }
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'entries'
    });

    const selectedProjectId = watch('projectId');
    const watchedEntries = watch('entries');

    useEffect(() => {
        if (open) {
            fetchProjects();
            const initialBillable = true;
            reset({
                projectId: defaultEntry?.projectId || '',
                date: new Date().toISOString().split('T')[0],
                entries: [
                    {
                        taskId: defaultEntry?.taskId || '',
                        hours: defaultEntry?.hours || '',
                        description: '',
                        billable: initialBillable,
                    }
                ]
            });
        }
    }, [open, defaultEntry?.projectId, defaultEntry?.taskId, defaultEntry?.hours, defaultEntry?.taskTitle, reset]);

    // When project changes / loads, sync billable default from project.isBillable
    useEffect(() => {
        if (!selectedProjectId || projects.length === 0) return;
        const def = projectBillableDefault(selectedProjectId);
        watchedEntries?.forEach((_, index) => {
            // Only auto-set for employees (hidden control) or when manager hasn't customized —
            // always sync on project change so defaults follow project setting
            setValue(`entries.${index}.billable`, def);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally sync on project/projects change only
    }, [selectedProjectId, projects]);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects?limit=500');
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.projects || []);
            setProjects(list);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (selectedProjectId && !isTaskLocked) {
            fetchTasks(selectedProjectId);
        } else if (!selectedProjectId) {
            setTasks([]);
        }
    }, [selectedProjectId, isTaskLocked]);

    const fetchTasks = async (projectId: string) => {
        try {
            const res = await api.get(`/tasks?projectId=${projectId}&limit=500`);
            setTasks(res.data?.tasks || res.data?.data || res.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const lockedTaskLabel = useMemo(() => {
        if (!lockedTaskId) return '';
        return (
            defaultEntry?.taskTitle ||
            tasks.find((t) => t.id === lockedTaskId)?.title ||
            'Current task'
        );
    }, [lockedTaskId, defaultEntry?.taskTitle, tasks]);

    const lockedProjectLabel = useMemo(() => {
        if (!isProjectLocked || !defaultEntry?.projectId) return '';
        return projects.find((p) => p.id === defaultEntry.projectId)?.name || 'Current project';
    }, [isProjectLocked, defaultEntry?.projectId, projects]);

    const onSubmit = async (data: any) => {
        try {
            setSubmitting(true);
            const projectDefault = projectBillableDefault(data.projectId);
            const payload = {
                projectId: data.projectId,
                date: data.date,
                entries: data.entries.map((e: any) => {
                    // Managers may override; employees always get project default (UI hidden)
                    const isBillable = canManageBillable ? !!e.billable : projectDefault;
                    return {
                        taskId: isTaskLocked ? lockedTaskId : (e.taskId || null),
                        hours: Number(e.hours),
                        description: e.description || '',
                        billable: isBillable,
                        isBillable,
                    };
                })
            };

            await api.post('/timesheets/bulk', payload);

            success('Time entries logged successfully');
            onClose();
        } catch (err: any) {
            console.error(err);
            showError(err.response?.data?.error || 'Failed to log time');
        } finally {
            setSubmitting(false);
        }
    };

    const totalHours = watchedEntries?.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0) || 0;

    const headerCols = isTaskLocked
        ? (canManageBillable
            ? 'md:grid-cols-[7rem_5.5rem_minmax(0,1fr)_2rem]'
            : 'md:grid-cols-[7rem_minmax(0,1fr)_2rem]')
        : (canManageBillable
            ? 'md:grid-cols-[minmax(0,1.4fr)_7rem_5.5rem_minmax(0,1fr)_2rem]'
            : 'md:grid-cols-[minmax(0,1.4fr)_7rem_minmax(0,1fr)_2rem]');

    return (
        <Dialog isOpen={open} onClose={onClose} title="Daily Bulk Time Log" maxWidth="4xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {isTaskLocked && (
                    <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-3.5 space-y-2.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-600/80">
                            Logging against task
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {isProjectLocked && (
                                <span className="inline-flex items-start gap-1.5 max-w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                                    <Briefcase size={12} className="mt-0.5 shrink-0 text-slate-400" />
                                    <span className="break-words leading-snug">{lockedProjectLabel}</span>
                                </span>
                            )}
                            <span
                                className="inline-flex items-start gap-1.5 max-w-full rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm"
                                title={lockedTaskLabel}
                            >
                                <ListTodo size={12} className="mt-0.5 shrink-0 text-primary-600" />
                                <span className="break-words whitespace-normal leading-snug">{lockedTaskLabel}</span>
                            </span>
                        </div>
                        <input type="hidden" {...register('projectId', { required: true })} />
                    </div>
                )}

                <div className={`grid grid-cols-1 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 ${isTaskLocked ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
                    {!isTaskLocked && (
                        <div className="space-y-1.5">
                            <Label htmlFor="projectId" className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                Project
                            </Label>
                            <Controller
                                control={control}
                                name="projectId"
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <CustomSelect
                                        value={field.value}
                                        onChange={(val) => field.onChange(val)}
                                        options={[
                                            { label: 'Select Project', value: '' },
                                            ...projects.map(p => ({ label: p.name, value: p.id }))
                                        ]}
                                        placeholder="Select Project"
                                        className={`w-full ${errors.projectId ? 'border-red-500' : ''}`}
                                    />
                                )}
                            />
                        </div>
                    )}

                    <div className={`space-y-1.5 ${isTaskLocked ? 'max-w-xs' : ''}`}>
                        <Label htmlFor="date" className="text-[10px] uppercase font-black tracking-widest text-slate-400">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            {...register('date', { required: true })}
                            className={errors.date ? 'border-red-500' : ''}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between px-0.5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Clock size={14} /> Time Entries
                        </h3>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-800 rounded-full border border-primary-100">
                            <Calculator size={12} className="text-primary-600" />
                            <span className="text-[10px] font-black uppercase tracking-wide">
                                Total {totalHours.toFixed(2)}h
                            </span>
                        </div>
                    </div>

                    <div className={`hidden md:grid gap-3 px-3 text-[9px] font-black uppercase tracking-widest text-slate-400 ${headerCols}`}>
                        {!isTaskLocked && <span>Task</span>}
                        <span>Hours</span>
                        {canManageBillable && <span>Billable</span>}
                        <span>Description</span>
                        <span />
                    </div>

                    <div className="space-y-2 max-h-[min(42vh,360px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className={`group grid grid-cols-1 gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-primary-200 transition-all items-start ${headerCols}`}
                            >
                                {!isTaskLocked && (
                                    <div className="space-y-1 min-w-0">
                                        <Label className="md:hidden text-[9px] uppercase font-black text-slate-400">Task</Label>
                                        <Controller
                                            control={control}
                                            name={`entries.${index}.taskId`}
                                            render={({ field: f }) => (
                                                <CustomSelect
                                                    value={f.value}
                                                    onChange={(val) => f.onChange(val)}
                                                    disabled={!selectedProjectId}
                                                    options={[
                                                        { label: 'General Work (No Task)', value: '' },
                                                        ...tasks.map(t => ({ label: t.title, value: t.id }))
                                                    ]}
                                                    placeholder="General Work (No Task)"
                                                    className="w-full"
                                                />
                                            )}
                                        />
                                    </div>
                                )}
                                {isTaskLocked && (
                                    <input type="hidden" {...register(`entries.${index}.taskId` as const)} />
                                )}

                                <div className="space-y-1">
                                    <Label className="md:hidden text-[9px] uppercase font-black text-slate-400">Hours</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.25"
                                            min="0.25"
                                            placeholder="0.00"
                                            className="h-10 pr-8 text-sm font-semibold tabular-nums"
                                            {...register(`entries.${index}.hours` as const, {
                                                required: true,
                                                min: 0.0001,
                                                valueAsNumber: true,
                                            })}
                                        />
                                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            h
                                        </span>
                                    </div>
                                </div>

                                {canManageBillable ? (
                                    <div className="space-y-1">
                                        <Label className="md:hidden text-[9px] uppercase font-black text-slate-400">Billable</Label>
                                        <label
                                            htmlFor={`billable-${index}`}
                                            className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-2.5 cursor-pointer hover:border-slate-300 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                id={`billable-${index}`}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                {...register(`entries.${index}.billable` as const)}
                                            />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                                Yes
                                            </span>
                                        </label>
                                    </div>
                                ) : (
                                    <input type="hidden" {...register(`entries.${index}.billable` as const)} />
                                )}

                                <div className="space-y-1 min-w-0">
                                    <Label className="md:hidden text-[9px] uppercase font-black text-slate-400">Description</Label>
                                    <Input
                                        placeholder="What did you work on?"
                                        className="h-10"
                                        {...register(`entries.${index}.description` as const)}
                                    />
                                </div>

                                <div className="flex items-center justify-end md:pt-0 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                        className="flex h-10 w-8 items-center justify-center rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-0 disabled:pointer-events-none"
                                        aria-label="Remove entry"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({
                            taskId: isTaskLocked ? lockedTaskId : '',
                            hours: '',
                            description: '',
                            billable: selectedProjectId ? projectBillableDefault(selectedProjectId) : true,
                        })}
                        className="w-full border-dashed border-2 border-slate-200 hover:border-primary-300 hover:bg-primary-50/40 h-10 text-slate-500 text-xs font-bold uppercase tracking-wider"
                    >
                        <Plus size={14} className="mr-2" /> Add Entry Row
                    </Button>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={onClose} className="min-w-[96px]">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={submitting || totalHours <= 0} className="min-w-[150px]">
                        {submitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Clock className="mr-2 h-4 w-4" />
                        )}
                        Log {fields.length} {fields.length === 1 ? 'Entry' : 'Entries'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
