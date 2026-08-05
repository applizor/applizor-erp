'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { Clock, CalendarDays, User, Briefcase, FileText, AlertCircle, Loader2, Pencil } from 'lucide-react';

interface TimesheetDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: any;
    onUpdated?: () => void;
}

export default function TimesheetDetailModal({ isOpen, onClose, entry, onUpdated }: TimesheetDetailModalProps) {
    const { getScope, can } = usePermission();
    const { success, error: showError } = useToast();
    const canSeeBillable = getScope('Timesheet', 'update') === 'all' || getScope('Timesheet', 'read') === 'all';
    const canEdit =
        !!entry &&
        can('Timesheet', 'update') &&
        (entry.status === 'draft' || entry.status === 'rejected' || getScope('Timesheet', 'update') === 'all');

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hours, setHours] = useState('');
    const [description, setDescription] = useState('');
    const [isBillable, setIsBillable] = useState(true);
    const [date, setDate] = useState('');

    useEffect(() => {
        if (entry) {
            setHours(String(Number(entry.hours)));
            setDescription(entry.description || '');
            setIsBillable(entry.isBillable !== false);
            setDate(entry.date ? format(new Date(entry.date), 'yyyy-MM-dd') : '');
            setEditing(false);
        }
    }, [entry]);

    if (!entry) return null;

    const statusVariant = entry.status === 'approved' ? 'success' :
        entry.status === 'rejected' ? 'destructive' : 'secondary';

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload: any = {
                hours: Number(hours),
                description,
                date,
            };
            if (getScope('Timesheet', 'update') === 'all') {
                payload.isBillable = isBillable;
            }
            await api.patch(`/timesheets/${entry.id}`, payload);
            success('Timesheet updated');
            setEditing(false);
            onUpdated?.();
            onClose();
        } catch (err: any) {
            showError(err.response?.data?.error || 'Failed to update timesheet');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Timesheet Details" maxWidth="lg">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <CalendarDays size={14} />
                            Date & Time
                        </div>
                        <div>
                            {editing ? (
                                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
                            ) : (
                                <>
                                    <p className="text-sm font-bold text-slate-900">
                                        {format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}
                                    </p>
                                    {(entry.startTime || entry.endTime) && (
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <Clock size={12} />
                                            {entry.startTime ? format(new Date(entry.startTime), 'h:mm a') : '...'}
                                            {' - '}
                                            {entry.endTime ? format(new Date(entry.endTime), 'h:mm a') : '...'}
                                        </p>
                                    )}
                                    {entry.createdAt && (
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Logged {format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <Clock size={14} />
                            Hours
                        </div>
                        {editing ? (
                            <div className="relative max-w-[120px]">
                                <Input
                                    type="number"
                                    step="0.25"
                                    min="0.25"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    className="h-9 pr-7 font-bold"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">h</span>
                            </div>
                        ) : (
                            <p className="text-2xl font-black text-slate-900">
                                {Number(entry.hours).toFixed(2)}h
                            </p>
                        )}
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <User size={14} />
                            Employee
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                            {entry.employee?.firstName} {entry.employee?.lastName}
                        </p>
                        {entry.employee?.email && (
                            <p className="text-xs text-slate-500">{entry.employee.email}</p>
                        )}
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <Briefcase size={14} />
                            Project / Task
                        </div>
                        <p className="text-sm font-bold text-slate-900 break-words">
                            {entry.project?.name || 'No Project'}
                        </p>
                        <p className="text-xs text-slate-500 break-words whitespace-normal">
                            {entry.task?.title || (entry.taskId ? '(Task unavailable)' : 'General work')}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <FileText size={14} />
                        Description
                    </div>
                    {editing ? (
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none min-h-[80px]"
                            placeholder="What did you work on?"
                        />
                    ) : (
                        <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                            {entry.description || 'No description'}
                        </p>
                    )}
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        Status
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={statusVariant} className="text-xs px-3 py-1 capitalize">
                            {entry.status}
                        </Badge>
                        {/* Billable badge: managers only — employees are not shown this concept */}
                        {canSeeBillable && (
                            editing && getScope('Timesheet', 'update') === 'all' ? (
                                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isBillable}
                                        onChange={(e) => setIsBillable(e.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600"
                                    />
                                    Billable
                                </label>
                            ) : (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    entry.isBillable !== false
                                        ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                        : 'text-slate-500 bg-slate-100 border-slate-200'
                                }`}>
                                    {entry.isBillable !== false ? 'Billable' : 'Non-billable'}
                                </span>
                            )
                        )}
                    </div>
                    {entry.rejectionReason && (
                        <div className="mt-2 p-3 bg-rose-50 rounded-lg border border-rose-200">
                            <div className="flex items-start gap-2">
                                <AlertCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Rejection Reason</p>
                                    <p className="text-sm text-rose-600 mt-0.5">{entry.rejectionReason}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {entry.approvedAt && (
                        <p className="text-xs text-slate-500 mt-1">
                            {entry.status === 'rejected' ? 'Rejected' : 'Approved'} on {format(new Date(entry.approvedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-4 gap-3">
                    <p className="text-[10px] text-slate-400">
                        Created: {entry.createdAt ? format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a') : '—'}
                        {entry.updatedAt && ` • Updated: ${format(new Date(entry.updatedAt), 'MMM d, yyyy h:mm a')}`}
                        {entry.submittedAt && ` • Submitted: ${format(new Date(entry.submittedAt), 'MMM d, yyyy h:mm a')}`}
                    </p>
                    <div className="flex gap-2 shrink-0">
                        {canEdit && !editing && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
                                <Pencil size={12} className="mr-1.5" /> Edit
                            </Button>
                        )}
                        {editing && (
                            <>
                                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button type="button" size="sm" onClick={handleSave} disabled={saving || !hours || Number(hours) <= 0}>
                                    {saving && <Loader2 size={12} className="mr-1.5 animate-spin" />}
                                    Save
                                </Button>
                            </>
                        )}
                        {!editing && (
                            <Button type="button" variant="outline" size="sm" onClick={onClose}>Close</Button>
                        )}
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
