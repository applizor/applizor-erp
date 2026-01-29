'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Paperclip, Send, Clock, Trash2, Briefcase, Plus, MessageSquare, Heart, Smile, MoreHorizontal } from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard'; // Ensure correct path
import TaskTimesheetList from '@/components/timesheets/TaskTimesheetList';
import BulkTimeLogModal from '@/components/timesheets/BulkTimeLogModal';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import Portal from '@/components/ui/Portal';
import RichTextEditor from '@/components/ui/RichTextEditor';
import CommentItem from '@/components/tasks/CommentItem';
import { useSocket } from '@/contexts/SocketContext';
// import { format } from 'date-fns';

interface TaskDetailModalProps {
    taskId: string | null;
    projectId: string; // Needed for new task creation to know context
    onClose: () => void;
    onUpdate: () => void;
}

// --- Helper Components ---

function LiveTimerDisplay({ startTime, formatTime }: { startTime: number, formatTime: (s: number) => string }) {
    const [seconds, setSeconds] = useState(Math.floor((Date.now() - startTime) / 1000));

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    return <span>{formatTime(seconds)}</span>;
}

export default function TaskDetailModal({ taskId, projectId, onClose, onUpdate }: TaskDetailModalProps) {
    const isNew = taskId === 'new';
    const { register, control, handleSubmit, reset, watch, setValue } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [task, setTask] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'comments' | 'history' | 'worklog'>('comments');
    const [newComment, setNewComment] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const toast = useToast();
    const [employees, setEmployees] = useState<any[]>([]);
    const [sprints, setSprints] = useState<any[]>([]);
    const [epics, setEpics] = useState<any[]>([]);
    const [spentHours, setSpentHours] = useState(0);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [replyTo, setReplyTo] = useState<any>(null);

    // Timer state
    const [timerActive, setTimerActive] = useState(false);
    const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const { socket } = useSocket();

    useEffect(() => {
        fetchProjectMembers();
        fetchSprintsAndEpics();
        if (!isNew && taskId) {
            fetchTaskDetails();
            fetchComments();
            fetchHistory();
            fetchSpentHours();
            syncTimerWithServer();
        }
    }, [taskId]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // M to focus comment
            if (e.key.toLowerCase() === 'm' &&
                activeTab === 'comments' &&
                document.activeElement?.tagName !== 'INPUT' &&
                document.activeElement?.tagName !== 'TEXTAREA' &&
                !document.activeElement?.hasAttribute('contenteditable')) {

                e.preventDefault();
                const editor = document.querySelector('#comment-editor-section .jodit-wysiwyg') as HTMLElement;
                if (editor) {
                    editor.focus();
                } else {
                    document.getElementById('comment-editor-section')?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [activeTab]);

    useEffect(() => {
        if (!socket || !taskId || isNew) return;

        socket.on('TASK_UPDATED', (data) => {
            if (data.id === taskId) {
                fetchTaskDetails();
                fetchHistory(); // Refresh history too
            }
        });
        socket.on('COMMENT_ADDED', (data) => {
            if (data.taskId === taskId) fetchComments();
        });
        socket.on('TASK_DELETED', (data) => {
            if (data.id === taskId) onClose();
        });

        return () => {
            socket.off('TASK_UPDATED');
            socket.off('COMMENT_ADDED');
            socket.off('TASK_DELETED');
        };
    }, [socket, taskId, isNew]);

    const syncTimerWithServer = async () => {
        try {
            const res = await api.get('/timesheets/timer/active');
            if (res.data && res.data.taskId === taskId) {
                setTimerActive(true);
                const serverStartTime = new Date(res.data.startTime).getTime();
                setTimerStartTime(serverStartTime);
            } else {
                setTimerActive(false);
                setTimerStartTime(null);
                setElapsedSeconds(0);
            }
        } catch (error) { console.error('Failed to sync timer'); }
    };

    // No longer using a main interval here to avoid full modal re-renders

    const fetchSpentHours = async () => {
        try {
            const res = await api.get(`/timesheets?taskId=${taskId}`);
            const total = res.data.reduce((acc: number, curr: any) => acc + Number(curr.hours), 0);
            setSpentHours(total);
        } catch (error) { console.error(error); }
    };

    const toggleTimer = async () => {
        try {
            if (!timerActive) {
                const res = await api.post('/timesheets/timer/start', { projectId, taskId });
                setTimerActive(true);
                setTimerStartTime(new Date(res.data.startTime).getTime());
            } else {
                const res = await api.post('/timesheets/timer/stop');
                setTimerActive(false);
                setElapsedSeconds(0);
                setTimerStartTime(null);

                toast.success(`Work logged: ${res.data.durationHours}h`);

                // Refresh data
                fetchSpentHours();
                onUpdate();
            }
            // Refresh task to update working team list
            fetchTaskDetails();
        } catch (error) {
            toast.error('Failed to update timer');
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const fetchSprintsAndEpics = async () => {
        try {
            const [sprintsRes, tasksRes] = await Promise.all([
                api.get(`/projects/${projectId}/sprints`),
                api.get(`/tasks?projectId=${projectId}&type=epic`)
            ]);
            setSprints(sprintsRes.data);
            setEpics(tasksRes.data);
        } catch (error) { console.error(error); }
    };

    const fetchProjectMembers = async () => {
        try {
            // Fetch project details to get members
            const res = await api.get(`/projects/${projectId}`);
            if (res.data && res.data.members) {
                // Map project members to a flat list for the dropdown
                const members = res.data.members.map((m: any) => ({
                    id: m.employeeId,
                    userId: m.employee.userId, // fallback if needed
                    firstName: m.employee.firstName,
                    lastName: m.employee.lastName
                }));
                setEmployees(members);
            }
        } catch (error) { console.error(error); }
    };



    // ...

    const fetchTaskDetails = async () => {
        try {
            const res = await api.get(`/tasks/${taskId}`);
            setTask(res.data);
            // Fix: Map assignedToId (DB) to assigneeId (Form)
            reset({
                ...res.data,
                assigneeId: res.data.assignedToId || ''
            });
        } catch (error) {
            toast.error('Failed to load task details');
        }
    };

    const fetchComments = async () => {
        try {
            const res = await api.get(`/tasks/${taskId}/comments`);
            setComments(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/tasks/${taskId}/history`);
            setHistory(res.data);
        } catch (error) { console.error(error); }
    };

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            // Prepared FormData for file upload
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) formData.append(key, data[key]);
            });
            formData.append('projectId', projectId as string);

            files.forEach(file => {
                formData.append('files', file);
            });

            if (isNew) {
                await api.post('/tasks', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Task created successfully');
            } else {
                await api.put(`/tasks/${taskId}`, { ...data, projectId }); // Update doesn't support files yet in simple flow, strictly text
                toast.success('Task updated');
                // For files in edit mode, usually separate endpoint or complex logic. 
                // MVP: Only upload on creation or separate "Upload" button
            }
            onUpdate();
            onClose();
        } catch (error) {
            toast.error('Operation failed');
        } finally {
            setIsLoading(false);
        }
    };

    const postComment = async () => {
        if (!newComment.trim()) return;
        try {
            await api.post(`/tasks/${taskId}/comments`, {
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center overflow-hidden p-4 md:p-6 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden border border-white/20">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 p-2 bg-white text-slate-400 hover:text-slate-600 rounded-full shadow-sm hover:shadow transition-all border border-slate-100"
                    >
                        <X size={20} />
                    </button>

                    {/* Left: Main Content (Scrollable) */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                        <div className="flex-1 overflow-y-auto p-8 md:p-10 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">

                            {/* Header Section */}
                            <div className="mb-8">
                                {/* Breadcrumbs */}
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                    <span className="hover:text-primary-600 transition-colors cursor-pointer">Project</span>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-slate-600">{isNew ? 'New Issue' : `TASK-${task?.id?.split('-')[0].toUpperCase()}`}</span>
                                </div>

                                {/* Title Input */}
                                <input
                                    {...register('title', { required: true })}
                                    placeholder="Task Title"
                                    className="w-full text-3xl md:text-4xl font-black text-slate-900 placeholder:text-slate-200 border-none focus:ring-0 p-0 bg-transparent leading-tight"
                                />
                            </div>

                            <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                {/* Description Editor Wrapper */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 select-none">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                        Description
                                    </label>
                                    <div className="prose-editor-wrapper border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all shadow-sm">
                                        <Controller
                                            name="description"
                                            control={control}
                                            defaultValue=""
                                            render={({ field }) => (
                                                <RichTextEditor
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Describe the task details, acceptance criteria, and technical notes..."
                                                    className="min-h-[200px] border-none"
                                                    mentions={employees.map(e => ({ id: e.userId || e.id, name: `${e.firstName} ${e.lastName}` }))}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Attachments Section */}
                                <div>
                                    <h4 className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        <Paperclip size={12} /> Attachments
                                    </h4>

                                    {isNew ? (
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group relative">
                                            <input type="file" multiple id="file-upload" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                                            <div className="flex flex-col items-center gap-2 pointer-events-none">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all text-slate-400">
                                                    <Paperclip size={18} />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500">
                                                    {files.length > 0 ? `${files.length} files attached` : 'Drop files here or click to upload'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-3 flex-wrap">
                                            {task?.documents?.map((doc: any) => (
                                                <a
                                                    key={doc.id}
                                                    href={`http://localhost:5000/${doc.filePath}`}
                                                    target="_blank"
                                                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group no-underline"
                                                >
                                                    <div className="w-8 h-8 rounded bg-white border border-slate-100 flex items-center justify-center text-slate-500 group-hover:text-indigo-600">
                                                        <Paperclip size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{doc.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                            {(doc.fileSize / 1024).toFixed(0)} KB
                                                        </p>
                                                    </div>
                                                </a>
                                            ))}
                                            {(!task?.documents || task.documents.length === 0) && (
                                                <p className="text-xs text-slate-400 italic">No attachments.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </form>

                            {/* Activity / Comments */}
                            {!isNew && (
                                <div className="mt-12 pt-8 border-t border-slate-100">
                                    <div className="flex items-center gap-6 mb-6 border-b border-slate-100">
                                        <button
                                            onClick={() => setActiveTab('comments')}
                                            className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'comments' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <div className="flex items-center gap-2">Comments {comments.length > 0 && <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px]">{comments.length}</span>}</div>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('history')}
                                            className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <div className="flex items-center gap-2">History <Clock size={14} /></div>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('worklog')}
                                            className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'worklog' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <div className="flex items-center gap-2">Work Log <Briefcase size={14} /></div>
                                        </button>
                                    </div>

                                    {/* COMMENTS TAB */}
                                    {activeTab === 'comments' && (
                                        <>
                                            <div className="space-y-6 mb-8 relative">
                                                {comments.map((comment: any) => (
                                                    <CommentItem
                                                        key={comment.id}
                                                        comment={comment}
                                                        onReply={(c) => {
                                                            setReplyTo(c);
                                                            document.getElementById('comment-editor-section')?.scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            <div id="comment-editor-section" className="relative z-10 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg transition-all focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50">
                                                {replyTo && (
                                                    <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                                                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                                                            <Send size={10} className="rotate-180" /> Replying to {replyTo.user ? `${replyTo.user.firstName}` : replyTo.client?.name}
                                                        </span>
                                                        <button
                                                            onClick={() => setReplyTo(null)}
                                                            className="text-indigo-400 hover:text-indigo-600 transition-colors"
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
                                                        placeholder={replyTo ? `Replying to ${replyTo.user?.firstName || replyTo.client?.name}...` : "Add a comment..."}
                                                        className="min-h-[120px] border-none"
                                                        mentions={employees.map(e => ({ id: e.userId || e.id, name: `${e.firstName} ${e.lastName}` }))}
                                                    />
                                                </div>
                                                <div className="bg-slate-50/50 px-4 py-3 flex justify-end border-t border-slate-100">
                                                    <button
                                                        onClick={postComment}
                                                        disabled={!newComment.trim()}
                                                        className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.1em] hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2"
                                                    >
                                                        {replyTo ? 'Post Reply' : 'Post Comment'} <Send size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* HISTORY TAB */}
                                    {activeTab === 'history' && (
                                        <div className="py-4 space-y-4">
                                            {history.length === 0 && <p className="text-slate-400 italic text-sm">No changes recorded yet.</p>}
                                            {history.map((item: any) => (
                                                <div key={item.id} className="flex gap-4 items-start group">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0 mt-1">
                                                        <Clock size={16} />
                                                    </div>
                                                    <div className="flex-1 bg-white border border-slate-100 rounded-lg p-3 shadow-sm group-hover:border-indigo-100 transition-all">
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-bold text-slate-900">
                                                                {item.user ? `${item.user.firstName} ${item.user.lastName}` : (item.client?.name || 'System')}
                                                            </span>
                                                            {' '}updated{' '}
                                                            <span className="font-bold text-slate-600 bg-slate-100 px-1.5 rounded text-xs uppercase tracking-wide">
                                                                {item.field}
                                                            </span>
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2 text-xs">
                                                            <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded border border-rose-100 line-through opacity-70">
                                                                {item.oldValue || 'Empty'}
                                                            </span>
                                                            <span className="text-slate-300">➜</span>
                                                            <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100 font-bold">
                                                                {item.newValue}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 mt-2 block font-medium uppercase tracking-wider">
                                                            {new Date(item.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* WORK LOG TAB */}
                                    {activeTab === 'worklog' && (
                                        <div className="mb-8 py-4 px-1">
                                            <TaskTimesheetList taskId={taskId!} projectId={projectId} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Meta Details Sidebar */}
                    <div className="w-full md:w-80 bg-slate-50/80 backdrop-blur border-l border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto h-full shadow-[inset_10px_0_20px_-10px_rgba(0,0,0,0.02)]">

                        {/* Time Tracking Section */}
                        {!isNew && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Time Tracking</label>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                        <Clock size={12} className="text-indigo-500" />
                                        {spentHours.toFixed(2)}h
                                    </div>
                                </div>

                                {/* Timer Bar */}
                                <div className={`p-3 rounded-lg flex items-center justify-between transition-all ${timerActive ? 'bg-rose-50 border border-rose-100' : (task?.activeTimers?.length > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 border border-slate-100')}`}>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none mb-1">
                                            {timerActive ? 'Timer Running' : (task?.activeTimers?.length > 0 ? 'Team Active' : 'Idle')}
                                        </span>
                                        <span className={`text-sm font-mono font-black ${timerActive ? 'text-rose-600' : (task?.activeTimers?.length > 0 ? 'text-amber-600' : 'text-slate-600')}`}>
                                            {timerActive && timerStartTime ? (
                                                <LiveTimerDisplay startTime={timerStartTime} formatTime={formatTime} />
                                            ) : formatTime(elapsedSeconds)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={toggleTimer}
                                        disabled={!timerActive && task?.activeTimers?.length > 0}
                                        title={!timerActive && task?.activeTimers?.length > 0 ? `${task.activeTimers[0].employee.firstName} is working on this` : ''}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${timerActive ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200' : (task?.activeTimers?.length > 0 ? 'bg-amber-400 text-white cursor-not-allowed opacity-80' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200')}`}
                                    >
                                        {timerActive ? <div className="w-3 h-3 bg-white rounded-sm" /> : (task?.activeTimers?.length > 0 ? <Clock size={16} /> : <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />)}
                                    </button>
                                </div>

                                {(!task?.activeTimers?.length || timerActive) && (
                                    <button
                                        onClick={() => setIsLogModalOpen(true)}
                                        className="w-full py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={12} /> Log Work
                                    </button>
                                )}

                                {/* Team Members working on this task */}
                                {task?.activeTimers && task.activeTimers.length > 0 && (
                                    <div className="pt-2 animate-in fade-in duration-500">
                                        <div className="flex items-center gap-2 mb-2 p-1.5 bg-amber-50 border border-amber-100 rounded-md">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-amber-900 uppercase tracking-widest">Team Working</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {task.activeTimers.map((timer: any) => (
                                                <div key={timer.id} className="flex items-center justify-between text-[10px] text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                                    <span className="font-bold">{timer.employee.firstName} {timer.employee.lastName}</span>
                                                    <span className="font-mono text-[9px] bg-slate-200/50 px-1.5 py-0.5 rounded leading-none">WORKING</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Status */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Status</label>
                            <select
                                {...register('status')}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="todo">To Do</option>
                                <option value="in-progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                            </select>
                        </div>

                        {/* Meta Group */}
                        <div className="space-y-6">
                            {/* Priority */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Priority</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                        <div className={`w-2 h-2 rounded-full ${watch('priority') === 'urgent' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                            watch('priority') === 'high' ? 'bg-orange-500' :
                                                watch('priority') === 'medium' ? 'bg-amber-400' : 'bg-emerald-500'
                                            }`} />
                                    </div>
                                    <select
                                        {...register('priority')}
                                        className="w-full pl-8 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 transition-colors cursor-pointer appearance-none"
                                    >
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="low">Low Priority</option>
                                    </select>
                                </div>
                            </div>

                            {/* Type */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Issue Type</label>
                                <select
                                    {...register('type')}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 transition-colors"
                                >
                                    <option value="task">Task</option>
                                    <option value="bug">Bug</option>
                                    <option value="issue">Issue</option>
                                    <option value="story">Story</option>
                                    <option value="epic">Epic</option>
                                </select>
                            </div>

                            {/* Story Points */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Story Points</label>
                                <input
                                    type="number"
                                    {...register('storyPoints')}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 transition-colors"
                                    placeholder="0"
                                />
                            </div>

                            {/* Epic */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Epic</label>
                                <select
                                    {...register('epicId')}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 transition-colors"
                                >
                                    <option value="">No Epic</option>
                                    {epics.map(epic => (
                                        <option key={epic.id} value={epic.id}>{epic.title}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sprint */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sprint</label>
                                <select
                                    {...register('sprintId')}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 transition-colors"
                                >
                                    <option value="">Backlog</option>
                                    {sprints.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Assignee</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
                                        {watch('assigneeId') ? (
                                            <div className="w-5 h-5 rounded bg-indigo-600 text-[8px] font-black text-white flex items-center justify-center uppercase">
                                                {(() => {
                                                    const uid = watch('assigneeId');
                                                    const user = employees.find(e => (e.userId || e.id) === uid);
                                                    return user ? `${user.firstName[0]}${user.lastName[0]}` : '?';
                                                })()}
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center">
                                                <span className="text-[10px] text-slate-400">?</span>
                                            </div>
                                        )}
                                    </div>
                                    <select
                                        {...register('assigneeId')}
                                        className="w-full pl-10 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 transition-colors"
                                    >
                                        <option value="">Unassigned</option>
                                        {employees.filter(e => e.userId).map(emp => (
                                            <option key={emp.id} value={emp.userId}>
                                                {emp.firstName} {emp.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Box */}
                        {!isNew && task && (
                            <div className="mt-auto bg-slate-100 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>Created</span>
                                    <span className="font-mono">{new Date(task.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>Updated</span>
                                    <span className="font-mono">{new Date(task.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            type="submit"
                            form="task-form"
                            disabled={isLoading}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isNew ? 'Create Issue' : 'Save Changes')}
                        </button>

                    </div>
                </div>
            </div>
            {/* Log Work Modal */}
            <BulkTimeLogModal
                open={isLogModalOpen}
                onClose={() => {
                    setIsLogModalOpen(false);
                    setElapsedSeconds(0); // Reset timer after logging
                    fetchSpentHours();
                    onUpdate();
                }}
                defaultEntry={{
                    projectId,
                    taskId: taskId ?? undefined,
                    hours: timerActive ? undefined : (elapsedSeconds > 0 ? (elapsedSeconds / 3600).toFixed(2) : undefined)
                }}
            />
        </Portal>
    );
}


