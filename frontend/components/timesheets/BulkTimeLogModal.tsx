'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/useToast';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import api from '@/lib/api';
import { Loader2, Plus, Trash2, Clock, Calculator } from 'lucide-react';

interface BulkTimeLogModalProps {
    open: boolean;
    onClose: () => void;
    defaultEntry?: {
        projectId?: string;
        taskId?: string;
        hours?: string | number;
    };
}

export default function BulkTimeLogModal({ open, onClose, defaultEntry }: BulkTimeLogModalProps) {
    const { success, error: showError } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);

    const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
        defaultValues: {
            projectId: defaultEntry?.projectId || '',
            date: new Date().toISOString().split('T')[0],
            entries: [
                { taskId: defaultEntry?.taskId || '', hours: defaultEntry?.hours || '', description: '' }
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
            reset({
                projectId: defaultEntry?.projectId || '',
                date: new Date().toISOString().split('T')[0],
                entries: [
                    { taskId: defaultEntry?.taskId || '', hours: defaultEntry?.hours || '', description: '' }
                ]
            });
        }
    }, [open, defaultEntry]);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (selectedProjectId) {
            fetchTasks(selectedProjectId);
        } else {
            setTasks([]);
        }
    }, [selectedProjectId]);

    const fetchTasks = async (projectId: string) => {
        try {
            const res = await api.get(`/tasks?projectId=${projectId}`);
            setTasks(res.data?.tasks || res.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            setSubmitting(true);
            const payload = {
                projectId: data.projectId,
                date: data.date,
                entries: data.entries.map((e: any) => ({
                    ...e,
                    hours: Number(e.hours)
                }))
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

    return (
        <Dialog isOpen={open} onClose={onClose} title="Daily Bulk Time Log" maxWidth="2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Header Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="space-y-1.5">
                        <Label htmlFor="projectId" className="text-[10px] uppercase font-black tracking-widest text-slate-400">Project Selection</Label>
                        <Select
                            id="projectId"
                            {...register('projectId', { required: true })}
                            className={errors.projectId ? 'border-red-500' : ''}
                        >
                            <option value="">Select Project</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="date" className="text-[10px] uppercase font-black tracking-widest text-slate-400">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            {...register('date', { required: true })}
                            className={errors.date ? 'border-red-500' : ''}
                        />
                    </div>
                </div>

                {/* Dynamic Entries List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Clock size={14} /> Time Entries
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                            <Calculator size={12} />
                            <span className="text-[10px] font-black uppercase">Total: {totalHours.toFixed(2)}h</span>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {fields.map((field, index) => (
                            <div key={field.id} className="relative p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 transition-all group">
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    disabled={fields.length === 1}
                                    className="absolute -top-2 -right-2 p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all disabled:hidden"
                                >
                                    <Trash2 size={12} />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-4 space-y-1.5">
                                        <Label className="text-[9px] uppercase font-black text-slate-400">Task</Label>
                                        <Select
                                            {...register(`entries.${index}.taskId` as const)}
                                            disabled={!selectedProjectId}
                                        >
                                            <option value="">General Work (No Task)</option>
                                            {tasks.map((t) => (
                                                <option key={t.id} value={t.id}>{t.title}</option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className="md:col-span-2 space-y-1.5">
                                        <Label className="text-[9px] uppercase font-black text-slate-400">Hours</Label>
                                        <Input
                                            type="number"
                                            step="0.25"
                                            placeholder="0.0"
                                            {...register(`entries.${index}.hours` as const, { required: true, min: 0.1 })}
                                        />
                                    </div>

                                    <div className="md:col-span-6 space-y-1.5">
                                        <Label className="text-[9px] uppercase font-black text-slate-400">Work Description</Label>
                                        <Input
                                            placeholder="e.g. Developed feature X..."
                                            {...register(`entries.${index}.description` as const)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ taskId: '', hours: '', description: '' })}
                        className="w-full border-dashed border-2 hover:border-indigo-300 hover:bg-indigo-50/50 h-12 text-slate-500"
                    >
                        <Plus size={16} className="mr-2" /> Add Entry Row
                    </Button>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={submitting} className="min-w-[140px]">
                        {submitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Clock className="mr-2 h-4 w-4" />
                        )}
                        Log {watchedEntries.length} {watchedEntries.length === 1 ? 'Entry' : 'Entries'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
