'use client';

import { format } from 'date-fns';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Clock, CalendarDays, User, Briefcase, FileText, AlertCircle } from 'lucide-react';

interface TimesheetDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: any;
}

export default function TimesheetDetailModal({ isOpen, onClose, entry }: TimesheetDetailModalProps) {
    if (!entry) return null;

    const statusVariant = entry.status === 'approved' ? 'success' :
        entry.status === 'rejected' ? 'destructive' : 'secondary';

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
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <Clock size={14} />
                            Hours
                        </div>
                        <p className="text-2xl font-black text-slate-900">
                            {Number(entry.hours).toFixed(2)}h
                        </p>
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
                        <p className="text-sm font-bold text-slate-900">
                            {entry.project?.name || 'No Project'}
                        </p>
                        {entry.task?.title && (
                            <p className="text-xs text-slate-500">{entry.task.title}</p>
                        )}
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <FileText size={14} />
                        Description
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                        {entry.description || 'No description'}
                    </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        Status
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={statusVariant} className="text-xs px-3 py-1">
                            {entry.status}
                        </Badge>
                        {entry.isBillable && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Billable
                            </span>
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

                <div className="flex justify-end border-t border-slate-200 pt-4">
                    <p className="text-[10px] text-slate-400">
                        Created: {format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}
                        {entry.submittedAt && ` • Submitted: ${format(new Date(entry.submittedAt), 'MMM d, yyyy h:mm a')}`}
                    </p>
                </div>
            </div>
        </Dialog>
    );
}
