'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Paperclip, Send, Clock, Trash2, Briefcase, Plus, MessageSquare, Heart, Smile, MoreHorizontal } from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard'; // Ensure correct path
import TaskTimesheetList from '@/components/hrms/timesheets/TaskTimesheetList';
import BulkTimeLogModal from '@/components/hrms/timesheets/BulkTimeLogModal';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import Portal from '@/components/ui/Portal';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { CustomSelect } from '@/components/ui/CustomSelect';
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
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center overflow-hidden p-4 md:p-6 animate-fade-in text-left">
                <div className="bg-white rounded-md shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden border border-slate-200">

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
                                    <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 select-none">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                                        Description
                                    </label>
                                    <div className="prose-editor-wrapper border border-slate-200 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all shadow-sm">
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
                                    <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                        <Paperclip size={12} /> Attachments
                                    </h4>

                                    {isNew ? (
                                        <div className="border border-dashed border-slate-300 rounded-md p-8 text-center hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer group relative">
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
                                                    className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md hover:border-primary-200 hover:bg-primary-50/50 transition-all group no-underline"
                                                >
                                                    <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-primary-600">
                                                        <Paperclip size={12} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-700 truncate max-w-[150px]">{doc.name}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                                            {(doc.fileSize / 1024).toFixed(0)} KB
                                                        </p>
                                                    </div>
                                                </a>
                                            ))}
                                            {(!task?.documents || task.documents.length === 0) && (
                                                <p className="text-[10px] text-slate-400 italic">No attachments.</p>
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
                                            className={`pb-4 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'comments' ? 'text-primary-900 border-b-2 border-primary-900' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <div className="flex items-center gap-2">Comments {comments.length > 0 && <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px]">{comments.length}</span>}</div>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('history')}
                                            className={`pb-4 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'text-primary-900 border-b-2 border-primary-900' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <div className="flex items-center gap-2">History <Clock size={14} /></div>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('worklog')}
                                            className={`pb-4 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'worklog' ? 'text-primary-900 border-b-2 border-primary-900' : 'text-slate-400 hover:text-slate-600'}`}
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

                                            <div id="comment-editor-section" className="relative z-10 bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary-500/20 focus-within:border-primary-500/50">
                                                {replyTo && (
                                                    <div className="bg-primary-50 px-4 py-2 border-b border-primary-100 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                                                        <span className="text-[9px] font-black text-primary-700 uppercase tracking-widest flex items-center gap-2">
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
                                                        placeholder={replyTo ? `Replying to ${replyTo.user?.firstName || replyTo.client?.name}...` : "Add a comment..."}
                                                        className="min-h-[100px] border-none"
                                                        mentions={employees.map(e => ({ id: e.userId || e.id, name: `${e.firstName} ${e.lastName}` }))}
                                                    />
                                                </div>
                                                <div className="bg-slate-50/50 px-4 py-3 flex justify-end border-t border-slate-100">
                                                    <button
                                                        onClick={postComment}
                                                        disabled={!newComment.trim()}
                                                        className="btn-primary text-[10px] flex items-center gap-2"
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
                                                    <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 mt-1">
                                                        <Clock size={12} />
                                                    </div>
                                                    <div className="flex-1 bg-white border border-slate-100 rounded-md p-3 shadow-sm group-hover:border-primary-100 transition-all">
                                                        <p className="text-secondary text-[11px]">
                                                            <span className="font-bold text-slate-900">
                                                                {item.user ? `${item.user.firstName} ${item.user.lastName}` : (item.client?.name || 'System')}
                                                            </span>
                                                            {' '}updated{' '}
                                                            <span className="font-black text-slate-500 bg-slate-50 px-1.5 rounded text-[9px] uppercase tracking-wide">
                                                                {item.field}
                                                            </span>
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2 text-[10px]">
                                                            <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100 line-through opacity-70">
                                                                {item.oldValue || 'Empty'}
                                                            </span>
                                                            <span className="text-slate-300">➜</span>
                                                            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">
                                                                {item.newValue}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] text-slate-400 mt-2 block font-medium uppercase tracking-wider">
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
                    <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto h-full shadow-[inset_4px_0_10px_-4px_rgba(0,0,0,0.02)]">

                        {/* STATUS */}
                        <div className="ent-card p-4 bg-white shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                            </div>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <CustomSelect
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            { label: 'To Do', value: 'todo' },
                                            { label: 'In Progress', value: 'in-progress' },
                                            { label: 'Review', value: 'review' },
                                            { label: 'Done', value: 'done' }
                                        ]}
                                        className="w-full"
                                    />
                                )}
                            />
                        </div>

                        {/* PRIORITY */}
                        <div className="ent-card p-4 bg-white shadow-sm border border-slate-200">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Priority</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                    <div className={`w-1.5 h-1.5 rounded-full ${watch('priority') === 'urgent' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                        watch('priority') === 'high' ? 'bg-orange-500' :
                                            watch('priority') === 'medium' ? 'bg-amber-400' : 'bg-emerald-500'
                                        }`} />
                                </div>
                                <Controller
                                    name="priority"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={[
                                                { label: 'Medium', value: 'medium' },
                                                { label: 'High', value: 'high' },
                                                { label: 'Urgent', value: 'urgent' },
                                                { label: 'Low', value: 'low' }
                                            ]}
                                            className="w-full pl-6"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* OTHER META */}
                        <div className="space-y-4">
                            {/* Type */}
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Issue Type</label>
                                <Controller
                                    name="type"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={[
                                                { label: 'Task', value: 'task' },
                                                { label: 'Bug', value: 'bug' },
                                                { label: 'Issue', value: 'issue' },
                                                { label: 'Story', value: 'story' },
                                                { label: 'Epic', value: 'epic' }
                                            ]}
                                            className="w-full"
                                        />
                                    )}
                                />
                            </div>

                            {/* Story Points */}
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Story Points</label>
                                <input
                                    type="number"
                                    {...register('storyPoints')}
                                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-[11px] font-bold text-slate-700 outline-none focus:border-primary-500 transition-colors"
                                    placeholder="0"
                                />
                            </div>

                            {/* Epic */}
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Epic</label>
                                <Controller
                                    name="epicId"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={[
                                                { label: 'No Epic', value: '' },
                                                ...epics.map(epic => ({ label: epic.title, value: epic.id }))
                                            ]}
                                            placeholder="Select Epic"
                                            className="w-full"
                                        />
                                    )}
                                />
                            </div>

                            {/* Sprint */}
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Sprint</label>
                                <Controller
                                    name="sprintId"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={[
                                                { label: 'Backlog', value: '' },
                                                ...sprints.map(s => ({ label: `${s.name} (${s.status})`, value: s.id }))
                                            ]}
                                            placeholder="Select Sprint"
                                            className="w-full"
                                        />
                                    )}
                                />
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Assignee</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
                                        {watch('assigneeId') ? (
                                            <div className="w-4 h-4 rounded bg-primary-900 text-[7px] font-black text-white flex items-center justify-center uppercase">
                                                {(() => {
                                                    const uid = watch('assigneeId');
                                                    const user = employees.find(e => (e.userId || e.id) === uid);
                                                    return user ? `${user.firstName[0]}${user.lastName[0]}` : '?';
                                                })()}
                                            </div>
                                        ) : (
                                            <div className="w-4 h-4 rounded bg-slate-200 flex items-center justify-center">
                                                <span className="text-[8px] text-slate-400">?</span>
                                            </div>
                                        )}
                                    </div>
                                    <Controller
                                        name="assigneeId"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomSelect
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={[
                                                    { label: 'Unassigned', value: '' },
                                                    ...employees.filter(e => e.userId).map(emp => ({ label: `${emp.firstName} ${emp.lastName}`, value: emp.userId }))
                                                ]}
                                                placeholder="Unassigned"
                                                className="w-full pl-8"
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Metadata Box */}
                        {!isNew && task && (
                            <div className="mt-auto bg-slate-100 rounded-md p-3 space-y-1.5 border border-slate-200">
                                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                                    <span>Created</span>
                                    <span className="font-mono">{new Date(task.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wide">
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
                            className="w-full btn-primary py-3 rounded-md shadow-lg shadow-primary-900/10 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isNew ? 'Create Issue' : 'Save Changes')}
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


