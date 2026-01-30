'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ReviewDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReview: (status: 'approved' | 'rejected', remarks?: string) => Promise<void>;
    documentName: string;
}

export const ReviewDocumentModal: React.FC<ReviewDocumentModalProps> = ({
    isOpen,
    onClose,
    onReview,
    documentName
}) => {
    const [remarks, setRemarks] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [actionType, setActionType] = useState<'initial' | 'rejecting'>('initial');

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            await onReview('approved');
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        if (!remarks.trim()) return;
        setIsLoading(true);
        try {
            await onReview('rejected', remarks);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setRemarks('');
        setActionType('initial');
        setIsLoading(false);
    };

    // Reset on open/close
    React.useEffect(() => {
        if (isOpen) reset();
    }, [isOpen]);

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Review Document" maxWidth="md">
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Document</p>
                    <p className="text-sm font-semibold text-slate-900">{documentName}</p>
                </div>

                {actionType === 'initial' ? (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleApprove}
                            disabled={isLoading}
                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-200 transition-all group"
                        >
                            <div className="p-3 bg-white rounded-full text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                                <CheckCircle size={28} />
                            </div>
                            <span className="font-bold text-emerald-700">Approve Document</span>
                        </button>

                        <button
                            onClick={() => setActionType('rejecting')}
                            disabled={isLoading}
                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-rose-100 bg-rose-50 hover:bg-rose-100 hover:border-rose-200 transition-all group"
                        >
                            <div className="p-3 bg-white rounded-full text-rose-600 shadow-sm group-hover:scale-110 transition-transform">
                                <XCircle size={28} />
                            </div>
                            <span className="font-bold text-rose-700">Reject Document</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-3 p-3 bg-rose-50 text-rose-800 rounded-md border border-rose-100 text-sm">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p>You are about to reject this document. Please provide a reason for the employee.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Rejection Reason <span className="text-rose-500">*</span></label>
                            <Textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="e.g., Signature missing on page 2, incorrect details..."
                                className="min-h-[100px]"
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={() => setActionType('initial')} disabled={isLoading}>
                                Back
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleReject}
                                disabled={!remarks.trim() || isLoading}
                                isLoading={isLoading}
                            >
                                Confirm Rejection
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Dialog>
    );
};
