'use client';

import React, { useState, useEffect } from 'react';
import { X, Paperclip, Send, Clock, CheckCircle2, User, MessageSquare, Loader2, Plus, Edit2, Check, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { getBaseUrl } from '@/lib/utils/url';
import Portal from '@/components/ui/Portal';
import RichTextEditor from '@/components/ui/RichTextEditor';
import CommentItem from '@/components/tasks/CommentItem';
import { useSocket } from '@/contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';

interface PortalTaskDetailModalProps {
    taskId: string;
    onClose: () => void;
    onUpdate: () => void;
}

export default function PortalTaskDetailModal({ taskId, onClose, onUpdate }: PortalTaskDetailModalProps) {
    const [task, setTask] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    // Removed activeTab state as sidebar is now History only
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();
    const [sprints, setSprints] = useState<any[]>([]);
    const [epics, setEpics] = useState<any[]>([]);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDesc, setEditedDesc] = useState('');
    const { socket } = useSocket();

    const [members, setMembers] = useState<any[]>([]);
    // const [isRejecting, setIsRejecting] = useState(false); // Duplicate, removed
    // const [rejectionReason, setRejectionReason] = useState(''); // Duplicate, removed

    useEffect(() => {
        if (taskId) {
            fetchTaskDetails();
            fetchComments();
            fetchHistory();
        }
    }, [taskId]);

    useEffect(() => {
        if (task?.projectId) {
            fetchMembers(task.projectId);
        }
    }, [task?.projectId]);

    const fetchMembers = async (pid: string) => {
        try {
            const res = await api.get(`/portal/projects/${pid}/members`);
            setMembers(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchComments = async () => {
        try {
            const res = await api.get(`/portal/tasks/${taskId}/comments`);
            setComments(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/portal/tasks/${taskId}/history`);
            setHistory(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // M to focus comment
            if (e.key.toLowerCase() === 'm' &&
                document.activeElement?.tagName !== 'INPUT' &&
                document.activeElement?.tagName !== 'TEXTAREA' &&
                !document.activeElement?.hasAttribute('contenteditable')) {

                e.preventDefault();
                const editor = document.querySelector('#portal-comment-editor .jodit-wysiwyg') as HTMLElement;
                if (editor) {
                    editor.focus();
                } else {
                    document.getElementById('portal-comment-editor')?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    useEffect(() => {
        if (!socket || !taskId) return;

        const onTaskUpdated = (data: any) => {
            if (data.id === taskId) fetchTaskDetails();
        };
        const onCommentAdded = (data: any) => {
            if (data.taskId === taskId) fetchComments();
        };

        socket.on('TASK_UPDATED', onTaskUpdated);
        socket.on('COMMENT_ADDED', onCommentAdded);

        return () => {
            socket.off('TASK_UPDATED', onTaskUpdated);
            socket.off('COMMENT_ADDED', onCommentAdded);
        };
    }, [socket, taskId]);

    const handleReviewAction = async (action: 'approve' | 'reject') => {
        if (action === 'reject' && !isRejecting) {
            setIsRejecting(true);
            return;
        }

        try {
            await api.put(`/portal/tasks/${taskId}/status`, {
                action,
                reason: action === 'reject' ? rejectionReason : undefined
            });
            toast.success(action === 'approve' ? 'Task approved' : 'Changes requested');
            setIsRejecting(false);
            setRejectionReason('');
            fetchTaskDetails();
            fetchComments();
            fetchHistory();
            onUpdate();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const postComment = async () => {
        if (!newComment.trim()) return;
        try {
            await api.post(`/portal/tasks/${taskId}/comments`, {
                content: newComment,
                parentId: replyTo?.id || null
            });
            setNewComment('');
            setReplyTo(null);
            fetchComments();
            toast.success('Comment posted');
        } catch (error) {
            toast.error('Failed to post comment');
        }
    };

    const handleDeleteAttachment = async (docId: string) => {
        if (!window.confirm('Are you sure you want to delete this attachment?')) return;
        try {
            await api.delete(`/portal/documents/${docId}`);
            toast.success('Attachment deleted');
            fetchTaskDetails();
        } catch (error) {
            toast.error('Failed to delete attachment');
        }
    };

    const handleUpdateTask = async () => {
        try {
            const updateData: any = {};
            if (isEditingTitle) updateData.title = editedTitle;
            if (isEditingDesc) updateData.description = editedDesc;

            await api.put(`/portal/tasks/${taskId}`, updateData);
            toast.success('Task updated successfully');
            setIsEditingTitle(false);
            setIsEditingDesc(false);
            fetchTaskDetails();
            onUpdate();
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleUploadExistingAttachments = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploadingDoc(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            await api.post(`/portal/tasks/${taskId}/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Files uploaded successfully');
            fetchTaskDetails(); // Refresh task details to show new attachments
        } catch (error) {
            console.error('Error uploading files:', error);
            toast.error('Failed to upload files');
        } finally {
            setIsUploadingDoc(false);
            e.target.value = ''; // Clear the input field
        }
    };

    const fetchTaskDetails = async () => {
        try {
            const res = await api.get(`/portal/tasks/${taskId}`);
            setTask(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // ... (keep other fetch functions) ...

    if (!task && isLoading) return null;

    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in">
                <div className="bg-white rounded-none md:rounded-xl shadow-2xl w-full max-w-5xl h-full md:h-[90vh] flex flex-col md:flex-row overflow-y-auto md:overflow-hidden animate-zoom-in border border-slate-200">

                    {/* Left: Content */}
                    <div className="flex-1 flex flex-col md:h-full md:overflow-hidden bg-white">

                        {/* Mobile Header / Close */}
                        <div className="md:hidden flex justify-between items-center p-4 border-b border-slate-100">
                            <span className="text-xs font-black uppercase text-slate-400">Task Details</span>
                            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-500">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-visible md:overflow-y-auto p-5 md:p-8 relative custom-scrollbar">

                            {/* Header */}
                            <div className="mb-8">
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${task?.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        task?.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            task?.status === 'review' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                        {task?.status?.replace('-', ' ') || 'To Do'}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${task?.priority === 'urgent' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                        task?.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                            'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                        {task?.priority} Priority
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400 ml-auto">
                                        #{task?.id?.split('-')[0].toUpperCase()}
                                    </span>
                                </div>
                                {isEditingTitle ? (
                                    <div className="flex gap-2">
                                        <input
                                            value={editedTitle}
                                            onChange={(e) => setEditedTitle(e.target.value)}
                                            className="ent-input text-lg font-black flex-1"
                                        />
                                        <button onClick={handleUpdateTask} className="p-2 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100">
                                            <Check size={18} />
                                        </button>
                                        <button onClick={() => setIsEditingTitle(false)} className="p-2 bg-slate-50 text-slate-400 rounded-md hover:bg-slate-100">
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between gap-4 group">
                                        <h2 className="text-base md:text-lg font-black text-slate-900 leading-tight tracking-tight break-words">
                                            {task?.title}
                                        </h2>
                                        {task?.status === 'todo' && (
                                            <button 
                                                onClick={() => {
                                                    setEditedTitle(task.title);
                                                    setEditedDesc(task.description); // Sync current desc
                                                    setIsEditingTitle(true);
                                                }}
                                                className="p-1 text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={12} className="text-slate-400" />
                                        Created {new Date(task?.createdAt).toLocaleDateString()}
                                    </span>
                                    {task?.assignee && (
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                            <User size={12} className="text-slate-400" />
                                            <span className="font-bold text-slate-700">Assigned to {task.assignee.firstName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-10 group">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</h4>
                                    {!isEditingDesc && task?.status === 'todo' && (
                                        <button 
                                            onClick={() => {
                                                setEditedTitle(task.title); // Sync current title
                                                setEditedDesc(task.description);
                                                setIsEditingDesc(true);
                                            }}
                                            className="p-1 text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 text-[10px] font-bold uppercase"
                                        >
                                            <Edit2 size={12} /> Edit
                                        </button>
                                    )}
                                </div>
                                {isEditingDesc ? (
                                    <div className="space-y-4">
                                        <div className="border border-slate-200 rounded-md overflow-hidden">
                                            <RichTextEditor
                                                value={editedDesc}
                                                onChange={setEditedDesc}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setIsEditingDesc(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-md">
                                                Cancel
                                            </button>
                                            <button onClick={handleUpdateTask} className="px-3 py-1.5 text-xs font-bold bg-primary-900 text-white rounded-md hover:bg-primary-800 flex items-center gap-1.5">
                                                <Check size={14} /> Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="prose prose-sm max-w-none text-slate-700 bg-white p-0" dangerouslySetInnerHTML={{ __html: task?.description }} />
                                )}
                            </div>

                            {/* Attachments (View Only) */}
                            {task?.documents && task.documents.length > 0 && (
                                <div className="mb-10">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Paperclip size={12} /> Attachments
                                    </h4>
                                    <div className="flex gap-3 flex-wrap">
                                        {task.documents.map((doc: any) => (
                                            <div key={doc.id} className="relative group/doc">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await api.get(`/portal/documents/${doc.id}/download`, {
                                                                responseType: 'blob'
                                                            });
                                                            const url = window.URL.createObjectURL(new Blob([res.data]));
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.setAttribute('download', doc.name);
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            link.parentNode?.removeChild(link);
                                                            window.URL.revokeObjectURL(url);
                                                        } catch (error) {
                                                            console.error('Download failed:', error);
                                                            toast.error('Failed to download file');
                                                        }
                                                    }}
                                                    className="flex items-center gap-3 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-primary-400 hover:shadow-sm transition-all group no-underline min-w-[200px] text-left"
                                                >
                                                    <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50">
                                                        <Paperclip size={14} />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-xs font-bold text-slate-700 truncate">{doc.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{(doc.fileSize / 1024).toFixed(0)} KB</p>
                                                    </div>
                                                </button>
                                                {task?.status === 'todo' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteAttachment(doc.id);
                                                        }}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-50 text-rose-600 border border-rose-100 rounded-full flex items-center justify-center opacity-0 group-hover/doc:opacity-100 hover:bg-rose-100 transition-all shadow-sm z-10"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                         {task?.status === 'todo' && (
                                            <div className="relative flex items-center gap-2 px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-md hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer overflow-hidden group">
                                                <input
                                                    type="file"
                                                    multiple
                                                    disabled={isUploadingDoc}
                                                    onChange={handleUploadExistingAttachments}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                />
                                                <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary-600">
                                                    {isUploadingDoc ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary-600">
                                                    {isUploadingDoc ? 'Uploading...' : 'Add Files'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* If no documents exist, we still want the add files button */}
                            {(!task?.documents || task.documents.length === 0) && (
                                <div className="mb-10">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Paperclip size={12} /> Attachments
                                    </h4>
                                    <div className="flex gap-3 flex-wrap">
                                        <p className="text-[10px] text-slate-400 italic">No attachments yet.</p>
                                        
                                        {task?.status === 'todo' && (
                                            <div className="relative flex items-center gap-2 px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-md hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer overflow-hidden group">
                                                <input
                                                    type="file"
                                                    multiple
                                                    disabled={isUploadingDoc}
                                                    onChange={handleUploadExistingAttachments}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                />
                                                <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary-600">
                                                    {isUploadingDoc ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary-600">
                                                    {isUploadingDoc ? 'Uploading...' : 'Add Files'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* COMMENTS SECTION (JIRA STYLE BOTTOM) */}
                            <div className="mt-12 border-t border-slate-100 pt-8">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <MessageSquare size={14} className="text-slate-400" />
                                    Activity & Discussion
                                </h4>

                                <div className="space-y-6 mb-8">
                                    {comments.length === 0 && (
                                        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">No comments yet</p>
                                            <p className="text-[10px] text-slate-400">Start the conversation below</p>
                                        </div>
                                    )}
                                    {comments.map((comment: any) => (
                                        <CommentItem
                                            key={comment.id}
                                            comment={comment}
                                            onReply={(c) => {
                                                setReplyTo(c);
                                                document.getElementById('portal-comment-editor')?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Comment Input */}
                                <div id="portal-comment-editor" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all focus-within:ring-4 focus-within:ring-primary-500/10 focus-within:border-primary-500/50">
                                    {replyTo && (
                                        <div className="bg-primary-50 px-4 py-2 border-b border-primary-100 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-primary-700 uppercase tracking-widest flex items-center gap-2">
                                                <Send size={10} className="rotate-180" /> Replying to {replyTo.user ? `${replyTo.user.firstName}` : replyTo.client?.name}
                                            </span>
                                            <button
                                                onClick={() => setReplyTo(null)}
                                                className="text-primary-400 hover:text-primary-600 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="p-1">
                                        <RichTextEditor
                                            value={newComment}
                                            onChange={setNewComment}
                                            onPost={postComment}
                                            placeholder={replyTo ? "Type your reply..." : "Add a comment..."}
                                            className="min-h-[100px] border-none"
                                        />
                                    </div>
                                    <div className="bg-slate-50/80 px-4 py-2.5 flex justify-between items-center border-t border-slate-100">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                            Start with @ to mention
                                        </div>
                                        <button
                                            onClick={postComment}
                                            disabled={!newComment.trim()}
                                            className="bg-primary-900 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary-800 transition-all disabled:opacity-50 shadow-md flex items-center gap-2"
                                        >
                                            {replyTo ? 'Post Reply' : 'Send'} <Send size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Review Action Bar (Sticky Bottom) */}
                        {task?.status === 'review' && (
                            <div className="p-4 bg-amber-50 border-t border-amber-100 z-20 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
                                <div className="flex flex-col gap-3">
                                    {!isRejecting ? (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Ready for Review</h4>
                                                <p className="text-[10px] text-amber-700/80 font-medium">Please review the work and take action.</p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <button
                                                    onClick={() => handleReviewAction('reject')}
                                                    className="w-full sm:w-auto px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm"
                                                >
                                                    Request Changes
                                                </button>
                                                <button
                                                    onClick={() => handleReviewAction('approve')}
                                                    className="w-full sm:w-auto px-5 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 size={14} /> Approve
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider">Request Changes</h4>
                                                <button onClick={() => setIsRejecting(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancel</button>
                                            </div>
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="Describe what needs to be fixed..."
                                                className="w-full p-3 text-xs font-medium border border-rose-200 rounded-lg focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none min-h-[80px] bg-white"
                                                autoFocus
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleReviewAction('reject')}
                                                    className="px-5 py-2 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 shadow-md shadow-rose-200 transition-all"
                                                >
                                                    Submit Request
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: History (Simplified Sidebar) */}
                    <div className="w-full md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col md:h-full">
                        <div className="h-14 border-b border-slate-200 flex items-center justify-between px-5 bg-white">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity History</span>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-visible md:overflow-y-auto p-5 space-y-5 custom-scrollbar">
                            {history.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <Clock size={24} className="mx-auto mb-2 text-slate-300" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No history yet</p>
                                </div>
                            )}
                            {history.map((item: any) => (
                                <div key={item.id} className="flex gap-3 items-start group relative pl-4 border-l border-slate-200 pb-1 last:pb-0 last:border-0">
                                    <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-slate-50 group-hover:bg-primary-400 transition-colors" />
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            <span className="font-bold text-slate-900">
                                                {item.user?.firstName || item.client?.name || 'System'}
                                            </span>
                                            {' '}changed{' '}
                                            <span className="font-bold text-slate-800">
                                                {item.field}
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5 text-[10px] flex-wrap">
                                            <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 line-through decoration-rose-300/50 max-w-[100px] truncate">
                                                {item.oldValue || 'Empty'}
                                            </span>
                                            <span className="text-slate-300">→</span>
                                            <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 font-bold max-w-[100px] truncate">
                                                {item.newValue}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 mt-1.5 block font-medium">
                                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </Portal>
    );
}
