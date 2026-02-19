import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, Target, Type } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import Portal from '@/components/ui/Portal';

interface SprintEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    sprint: {
        id: string;
        name: string;
        goal?: string | null;
        startDate?: string | null;
        endDate?: string | null;
    } | null;
    onUpdate: () => void;
}

export default function SprintEditModal({ isOpen, onClose, sprint, onUpdate }: SprintEditModalProps) {
    const { register, handleSubmit, reset, setValue } = useForm();
    const toast = useToast();

    useEffect(() => {
        if (sprint) {
            setValue('name', sprint.name);
            setValue('goal', sprint.goal || '');
            setValue('startDate', sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '');
            setValue('endDate', sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '');
        }
    }, [sprint, setValue]);

    const onSubmit = async (data: any) => {
        if (!sprint) return;
        try {
            await api.put(`/projects/sprints/${sprint.id}`, {
                name: data.name,
                goal: data.goal,
                startDate: data.startDate || null,
                endDate: data.endDate || null
            });
            toast.success('Sprint updated');
            onUpdate();
            onClose();
        } catch (error) {
            toast.error('Failed to update sprint');
        }
    };

    if (!isOpen || !sprint) return null;

    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                    <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            Edit Sprint
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                        {/* Name */}
                        <div className="ent-form-group">
                            <label className="ent-label flex items-center gap-2 mb-1.5">
                                <Type size={12} /> Sprint Name
                            </label>
                            <input
                                {...register('name', { required: true })}
                                className="ent-input w-full"
                                placeholder="e.g. Sprint 24"
                            />
                        </div>

                        {/* Goal */}
                        <div className="ent-form-group">
                            <label className="ent-label flex items-center gap-2 mb-1.5">
                                <Target size={12} /> Sprint Goal
                            </label>
                            <textarea
                                {...register('goal')}
                                className="ent-input w-full min-h-[80px]"
                                placeholder="What is the main objective of this sprint?"
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="ent-form-group">
                                <label className="ent-label flex items-center gap-2 mb-1.5">
                                    <Calendar size={12} /> Start Date
                                </label>
                                <input
                                    type="date"
                                    {...register('startDate')}
                                    className="ent-input w-full"
                                />
                            </div>
                            <div className="ent-form-group">
                                <label className="ent-label flex items-center gap-2 mb-1.5">
                                    <Calendar size={12} /> End Date
                                </label>
                                <input
                                    type="date"
                                    {...register('endDate')}
                                    className="ent-input w-full"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 uppercase tracking-wide transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Portal>
    );
}
