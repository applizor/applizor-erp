'use client';

import React, { useState, useEffect } from 'react';
import { X, Paperclip, Send, Clock, CheckCircle2, User, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import Portal from '@/components/ui/Portal';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { useSocket } from '@/contexts/SocketContext';

interface PortalTaskDetailModalProps {
    taskId: string;
    onClose: () => void;
    onUpdate: () => void;
}

export default function PortalTaskDetailModal({ taskId, onClose, onUpdate }: PortalTaskDetailModalProps) {
    const [task, setTask] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();
    const { socket } = useSocket();

    useEffect(() => {
        if (taskId) {
            fetchTaskDetails();
            fetchComments();
            fetchHistory();
        }
    }, [taskId]);

    useEffect(() => {
        if (!socket || !taskId) return;

        socket.on('TASK_UPDATED', (data) => {
            if (data.id === taskId) {
                fetchTaskDetails();
                fetchHistory();
            }
        });
        socket.on('COMMENT_ADDED', (data) => {
            if (data.taskId === taskId) fetchComments();
        });

        return () => {
            socket.off('TASK_UPDATED');
            socket.off('COMMENT_ADDED');
        };
    }, [socket, taskId]);

    const fetchTaskDetails = async () => {
        try {
            // Reusing the same endpoint, backend might need adjustment to secure it or use a specific portal endpoint
            // Current "getPortalTasks" only lists. We need "getPortalTaskDetails"
            // For now, let's assume we can fetch via the portal route or general route if secured.
            // Since we need to be careful with security, let's stick to what we know is safe:
            // We might need to add a specific endpoint for detail: router.get('/portal/tasks/:id')
            // Temporarily using the public-ish one if avail, or we just filter from list? No, explicit fetch is better.
            // Let's assume we have `api.get('/portal/tasks?projectId=...')` but for single ID?
            // Actually, the plan implied we'd use a specific endpoint or re-use.
            // Let's assume `GET /portal/tasks` returns list, we might need to filter or better add `GET /portal/tasks/:id` to backend.
            // Wait, looking at routes: `router.get('/tasks', authenticateClient, ...)` is the list.
            // I should add a detail route to backend to be proper? 
            // OR I can use the existing `GET /tasks/:id` IF I add client auth middleware support to it?
            // BETTER: Add `GET /portal/tasks/:id` to `portal.routes.ts`.

            // NOTE: I will add the route in the next step. For now, I'll code the frontend to call it.
            // Wait, if I use the standard `GET /tasks/:id` it checks for `req.user`. Clients utilize `req.client`.
            // So `GET /portal/tasks/:id` is strictly required. I will add it.

            // Temporary Workaround until route exists: simpler to just use what we have? 
            // No, I'll write the code expecting the route to exist.
            const res = await api.get(`/portal/tasks/${taskId}`);
            setTask(res.data);
        } catch (error) {
            console.error(error);
            // toast.error('Failed to load details');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await api.get(`/portal/tasks/${taskId}/comments`);
            setComments(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/portal/tasks/${taskId}/history`);
            setHistory(res.data);
        } catch (error) { console.error(error); }
    };

    const postComment = async () => {
        if (!newComment.trim()) return;
        try {
            await api.post(`/portal/tasks/${taskId}/comments`, { content: newComment });
            setNewComment('');
            fetchComments();
        } catch (error) {
            toast.error('Failed to post comment');
        }
    };


    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleReviewAction = async (action: 'approve' | 'reject') => {
        if (action === 'reject' && !isRejecting) {
            setIsRejecting(true);
            return;
        }

        if (action === 'reject' && !rejectionReason.trim()) {
            toast.error('Please provide a reason for the changes requested.');
            return;
        }

        try {
            await api.put(`/portal/tasks/${taskId}/status`, {
                action,
                reason: action === 'reject' ? rejectionReason : undefined
            });
            toast.success(action === 'approve' ? 'Task Approved!' : 'Changes Requested');
            setIsRejecting(false);
            setRejectionReason('');
            fetchTaskDetails();
            onUpdate();
            if (action === 'approve') onClose();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    if (!task && isLoading) return null;

    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex justify-center items-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col md:flex-row overflow-hidden animate-zoom-in">

                    {/* Close Button Mobile */}
                    <button
                        onClick={onClose}
                        className="md:hidden absolute top-4 right-4 p-2 bg-white rounded-full shadow-md z-10"
                    >
                        <X size={20} />
                    </button>

                    {/* Left: Content */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                        <div className="flex-1 overflow-y-auto p-8 relative">

                            {/* Header */}
                            <div className="mb-8 pr-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${task?.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                                        task?.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                            task?.status === 'review' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {task?.status?.replace('-', ' ') || 'To Do'}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        {task?.priority} Priority
                                    </span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                                    {task?.title}
                                </h2>
                                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                                    <span>Created {new Date(task?.createdAt).toLocaleDateString()}</span>
                                    {task?.assignee && (
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            <User size={12} />
                                            <span className="font-bold">Assigned to {task.assignee.firstName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-10 group">
                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Description</h4>
                                <div className="prose prose-sm max-w-none text-slate-600 bg-slate-50/50 p-6 rounded-xl border border-slate-100" dangerouslySetInnerHTML={{ __html: task?.description }} />
                            </div>

                            {/* Attachments (View Only) */}
                            {task?.documents && task.documents.length > 0 && (
                                <div className="mb-10">
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Paperclip size={12} /> Attachments
                                    </h4>
                                    <div className="flex gap-3 flex-wrap">
                                        {task.documents.map((doc: any) => (
                                            <a
                                                key={doc.id}
                                                href={`http://localhost:5000/${doc.filePath}`}
                                                target="_blank"
                                                className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-primary-200 hover:shadow-md transition-all group no-underline"
                                            >
                                                <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary-600">
                                                    <Paperclip size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{doc.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{(doc.fileSize / 1024).toFixed(0)} KB</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Review Action Bar */}
                        {task?.status === 'review' && (
                            <div className="p-6 bg-amber-50 border-t border-amber-100 z-20">
                                <div className="flex flex-col gap-4">
                                    {!isRejecting ? (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-black text-amber-900">Ready for Review</h4>
                                                <p className="text-xs text-amber-700/80">Please approve this task or request changes.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleReviewAction('reject')}
                                                    className="px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-rose-50 hover:border-rose-300 transition-all"
                                                >
                                                    Request Changes
                                                </button>
                                                <button
                                                    onClick={() => handleReviewAction('approve')}
                                                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-500 shadow-sm shadow-emerald-200 transition-all flex items-center gap-2"
                                                >
                                                    <CheckCircle2 size={14} /> Approve
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-black text-rose-700">Request Changes</h4>
                                                <button onClick={() => setIsRejecting(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                                            </div>
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="Describe what needs to be fixed..."
                                                className="w-full p-3 text-sm border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none min-h-[80px]"
                                                autoFocus
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleReviewAction('reject')}
                                                    className="px-5 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-rose-500 shadow-sm shadow-rose-200 transition-all"
                                                >
                                                    Submit Request
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Comment Input Footer */}
                        <div className="p-4 md:p-6 bg-white border-t border-slate-100 z-10">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Type a message to the team..."
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    onKeyDown={(e) => e.key === 'Enter' && postComment()}
                                />
                                <button
                                    onClick={postComment}
                                    disabled={!newComment.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:bg-slate-300 transition-colors"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Activity Stream / Comments */}
                    <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 flex flex-col h-full">
                        <div className="flex items-center border-b border-slate-200 bg-white md:bg-transparent">
                            <button
                                onClick={() => setActiveTab('comments')}
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'comments' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Comments
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'history' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                History
                            </button>
                            <button onClick={onClose} className="md:block hidden px-4 text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* COMMENTS VIEW */}
                            {activeTab === 'comments' && (
                                <>
                                    {comments.length === 0 && (
                                        <p className="text-center text-xs text-slate-400 italic py-8">No comments yet.</p>
                                    )}
                                    {comments.map((comment: any) => {
                                        const isClient = !!comment.clientId;
                                        return (
                                            <div key={comment.id} className={`flex gap-3 ${isClient ? 'flex-row-reverse' : ''}`}>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 shadow-sm ${isClient ? 'bg-primary-100 text-primary-700' : 'bg-white text-slate-700 border border-slate-200'}`}>
                                                    {isClient ? 'ME' : 'TM'}
                                                </div>
                                                <div className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed shadow-sm ${isClient
                                                    ? 'bg-primary-600 text-white rounded-tr-none'
                                                    : 'bg-white border border-slate-100 text-slate-600 rounded-tl-none'
                                                    }`}>
                                                    {!isClient && <p className="text-[10px] font-bold text-slate-900 mb-1 block">{comment.user?.firstName || 'Team Member'}</p>}
                                                    <div dangerouslySetInnerHTML={{ __html: comment.content }} />
                                                    <div className={`text-[9px] mt-1.5 font-medium ${isClient ? 'text-primary-200' : 'text-slate-300'}`}>
                                                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                            {/* HISTORY VIEW */}
                            {activeTab === 'history' && (
                                <>
                                    {history.length === 0 && (
                                        <p className="text-center text-xs text-slate-400 italic py-8">No history recorded yet.</p>
                                    )}
                                    {history.map((item: any) => (
                                        <div key={item.id} className="flex gap-3 items-start group">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mt-0.5 shrink-0">
                                                <Clock size={12} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-700">
                                                    <span className="font-bold text-slate-900">
                                                        {item.user?.firstName || item.client?.name || 'System'}
                                                    </span>
                                                    {' '}changed{' '}
                                                    <span className="font-medium text-slate-500 bg-slate-100 px-1 rounded">
                                                        {item.field}
                                                    </span>
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                                                    <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 line-through decoration-rose-300/50">
                                                        {item.oldValue || 'Empty'}
                                                    </span>
                                                    <span className="text-slate-300">→</span>
                                                    <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">
                                                        {item.newValue}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] text-slate-400 mt-1 block">
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </Portal>
    );
}
