'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Paperclip, Send, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
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

    useEffect(() => {
        fetchEmployees();
        if (!isNew && taskId) {
            fetchTaskDetails();
            fetchComments();
        }
    }, [taskId]);

    const fetchEmployees = async () => {
        try {
            // Fetch project members ideally, fallback to all employees for now
            const res = await api.get('/employees'); // or /projects/:id/members
            setEmployees(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchTaskDetails = async () => {
        try {
            const res = await api.get(`/tasks/${taskId}`);
            setTask(res.data);
            reset(res.data); // Populate form
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
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center overflow-y-auto py-10">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-fit relative flex flex-col md:flex-row overflow-hidden my-auto mx-4">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <X size={24} />
                </button>

                {/* Left: Main details */}
                <div className="flex-1 p-8 border-r border-gray-100">
                    <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* Title */}
                        <div>
                            <input
                                {...register('title', { required: true })}
                                placeholder="Issue Summary"
                                className="w-full text-2xl font-bold text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 p-0"
                            />
                        </div>

                        {/* Description Editor */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                            <Controller
                                name="description"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <RichTextEditor
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Describe the issue..."
                                        className="min-h-[200px]"
                                    />
                                )}
                            />
                        </div>

                        {/* Attachments (Creation Mode) */}
                        {isNew && (
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                                <input type="file" multiple id="file-upload" className="hidden" onChange={handleFileChange} />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <Paperclip className="text-slate-400" />
                                    <span className="text-sm text-slate-600">
                                        {files.length > 0 ? `${files.length} files selected` : 'Drag files or click to upload'}
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Existing Attachments */}
                        {!isNew && task?.documents && task.documents.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Attachments</h4>
                                <div className="flex gap-2 flex-wrap">
                                    {task.documents.map((doc: any) => (
                                        <div key={doc.id} className="p-2 border rounded flex items-center gap-2 text-sm bg-gray-50">
                                            <Paperclip size={14} />
                                            <a href={`http://localhost:5000/${doc.filePath}`} target="_blank" className="hover:underline">{doc.name}</a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </form>

                    {/* Comments Section (Only for existing tasks) */}
                    {!isNew && (
                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <h3 className="font-semibold text-slate-800 mb-4">Activity</h3>

                            {/* Comment List */}
                            <div className="space-y-6 mb-6">
                                {comments.map((comment: any) => {
                                    const authorName = comment.user
                                        ? `${comment.user.firstName} ${comment.user.lastName}`
                                        : comment.client
                                            ? `${comment.client.name} (Client)`
                                            : 'Unknown';
                                    const initial = authorName[0];

                                    return (
                                        <div key={comment.id} className="flex gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${comment.client ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {initial}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {authorName}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(comment.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-slate-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: comment.content }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add Comment */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                                <div className="flex-1">
                                    <RichTextEditor
                                        value={newComment}
                                        onChange={setNewComment}
                                        placeholder="Add a comment..."
                                        className="mb-2"
                                    />
                                    <button
                                        onClick={postComment}
                                        disabled={!newComment.trim()}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Meta Details Sidebar */}
                <div className="w-full md:w-80 bg-gray-50/50 p-8 space-y-6 border-l border-gray-100">

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                        <select
                            {...register('status')}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        >
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                        <select
                            {...register('priority')}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm"
                        >
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Type</label>
                        <select
                            {...register('type')}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm"
                        >
                            <option value="task">Task</option>
                            <option value="bug">Bug</option>
                            <option value="issue">Issue</option>
                        </select>
                    </div>

                    {/* Assignee */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assignee</label>
                        <select
                            {...register('assigneeId')}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm"
                        >
                            <option value="">Unassigned</option>
                            {employees.map(emp => (
                                <option key={emp.employeeId || emp.id} value={emp.userId || emp.id}>
                                    {emp.firstName} {emp.lastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="pt-8 mt-auto">
                        <button
                            type="submit"
                            form="task-form"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            {isLoading ? 'Saving...' : (isNew ? 'Create Issue' : 'Save Changes')}
                        </button>
                    </div>

                    {/* Metadata */}
                    {!isNew && task && (
                        <div className="text-xs text-slate-400 mt-4 space-y-1">
                            <p>Created {new Date(task.createdAt).toLocaleDateString()}</p>
                            <p>Updated {new Date(task.updatedAt).toLocaleDateString()}</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
