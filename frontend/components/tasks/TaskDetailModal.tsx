'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Paperclip, Send, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import Portal from '@/components/ui/Portal';
import RichTextEditor from '@/components/ui/RichTextEditor'; // Assuming this exists or using Paged
// import { format } from 'date-fns';

interface TaskDetailModalProps {
    taskId: string | null;
    projectId: string; // Needed for new task creation to know context
    onClose: () => void;
    onUpdate: () => void;
}

export default function TaskDetailModal({ taskId, projectId, onClose, onUpdate }: TaskDetailModalProps) {
    const isNew = taskId === 'new';
    const { register, control, handleSubmit, reset, watch, setValue } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [task, setTask] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const toast = useToast();
    const [employees, setEmployees] = useState<any[]>([]);
    const [sprints, setSprints] = useState<any[]>([]);
    const [epics, setEpics] = useState<any[]>([]);

    useEffect(() => {
        fetchProjectMembers();
        fetchSprintsAndEpics();
        if (!isNew && taskId) {
            fetchTaskDetails();
            fetchComments();
        }
    }, [taskId]);

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
            await api.post(`/tasks/${taskId}/comments`, { content: newComment });
            setNewComment('');
            fetchComments(); // Refresh
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
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100000] flex justify-center items-center overflow-hidden p-4 md:p-6 animate-fade-in" style={{ zIndex: 100000 }}>
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
                                    <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <Clock size={16} className="text-slate-400" />
                                        Activity Stream
                                    </h3>

                                    <div className="space-y-8 mb-8 relative before:absolute before:left-4 before:top-4 before:bottom-0 before:w-px before:bg-slate-100">
                                        {comments.map((comment: any) => {
                                            const authorName = comment.user
                                                ? `${comment.user.firstName} ${comment.user.lastName}`
                                                : comment.client ? `${comment.client.name} (Client)` : 'Unknown';

                                            return (
                                                <div key={comment.id} className="relative flex gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 relative z-10 ring-4 ring-white ${comment.client ? 'bg-amber-100 text-amber-700' : 'bg-slate-900 text-white'}`}>
                                                        {authorName[0]}
                                                    </div>
                                                    <div className="flex-1 bg-slate-50 rounded-lg p-4 rounded-tl-none border border-slate-100 relative">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-bold text-slate-900">{authorName}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(comment.createdAt).toLocaleString()}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-600 prose prose-sm max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: comment.content }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex gap-4 relative z-10 bg-white p-1">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 shrink-0" />
                                        <div className="flex-1 space-y-3">
                                            <RichTextEditor
                                                value={newComment}
                                                onChange={setNewComment}
                                                placeholder="Write a comment..."
                                                className="min-h-[100px] border border-slate-200 rounded-lg"
                                                mentions={employees.map(e => ({ id: e.userId || e.id, name: `${e.firstName} ${e.lastName}` }))}
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={postComment}
                                                    disabled={!newComment.trim()}
                                                    className="bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10 flex items-center gap-2"
                                                >
                                                    Post Comment <Send size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Meta Details Sidebar */}
                    <div className="w-full md:w-80 bg-slate-50/80 backdrop-blur border-l border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto h-full shadow-[inset_10px_0_20px_-10px_rgba(0,0,0,0.02)]">

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
        </Portal>
    );
}

