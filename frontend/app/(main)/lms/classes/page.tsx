'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';
import { onlineClassApi, courseApi, OnlineClass, Course } from '@/lib/api/lms';
import { PermissionGuard } from '@/components/PermissionGuard';
import { usePermission } from '@/hooks/usePermission';
import { Plus, Video, Calendar, Clock, Link2, Trash2, Edit2, Filter, ExternalLink } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import PageHeader from '@/components/ui/PageHeader';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function OnlineClassesPage() {
    const toast = useToast();
    const { can } = usePermission();
    
    const [classes, setClasses] = useState<OnlineClass[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [courseFilter, setCourseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<OnlineClass | null>(null);
    const [formData, setFormData] = useState({
        courseId: '',
        title: '',
        description: '',
        meetingLink: '',
        startTime: '',
        endTime: '',
        status: 'scheduled' as 'scheduled' | 'live' | 'completed' | 'cancelled'
    });

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [classRes, courseRes] = await Promise.all([
                onlineClassApi.list(),
                courseApi.list()
            ]);
            setClasses(classRes.data || []);
            setCourses(courseRes.data || []);
        } catch (error) {
            console.error('Failed to load classes data:', error);
            toast.error('Failed to synchronize schedule registry');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (onlineClass?: OnlineClass) => {
        if (onlineClass) {
            setEditingClass(onlineClass);
            setFormData({
                courseId: onlineClass.courseId || '',
                title: onlineClass.title || '',
                description: onlineClass.description || '',
                meetingLink: onlineClass.meetingLink || '',
                startTime: onlineClass.startTime ? new Date(onlineClass.startTime).toISOString().slice(0, 16) : '',
                endTime: onlineClass.endTime ? new Date(onlineClass.endTime).toISOString().slice(0, 16) : '',
                status: onlineClass.status || 'scheduled'
            });
        } else {
            setEditingClass(null);
            setFormData({
                courseId: '',
                title: '',
                description: '',
                meetingLink: '',
                startTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // default start: 1 hour from now
                endTime: new Date(Date.now() + 7200000).toISOString().slice(0, 16), // default end: 2 hours from now
                status: 'scheduled'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClass(null);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            // Format to ISO string for backend storage
            const dataToSubmit = {
                ...formData,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString()
            };

            if (editingClass) {
                await onlineClassApi.update(editingClass.id, dataToSubmit);
                toast.success('Session schedule updated');
            } else {
                await onlineClassApi.create(dataToSubmit);
                toast.success('Online class session scheduled');
            }
            handleCloseModal();
            loadData();
        } catch (error: any) {
            console.error('Failed to submit class session:', error);
            toast.error(error.response?.data?.error || 'Failed to register session schedule');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await onlineClassApi.delete(showDeleteConfirm);
            toast.success('Class session purged from directory');
            loadData();
        } catch (error: any) {
            console.error('Purge sequence failed:', error);
            toast.error(error.response?.data?.error || 'Failed to remove session');
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    const filteredClasses = classes.filter(item => {
        const matchesCourse = courseFilter === '' || item.courseId === courseFilter;
        const matchesStatus = statusFilter === '' || item.status === statusFilter;
        
        return matchesCourse && matchesStatus;
    });

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Online Classes"
                subtitle="Schedule and orchestrate virtual learning sessions"
                icon={Video}
                actions={
                    <PermissionGuard module="OnlineClass" action="create">
                        <button
                            onClick={() => handleOpenModal()}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={14} /> Schedule Session
                        </button>
                    </PermissionGuard>
                }
            />

            {/* Filtration bar */}
            <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-md border border-gray-100">
                <div className="flex items-center gap-2 px-2 text-gray-400">
                    <Filter size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Filter:</span>
                </div>
                
                <CustomSelect
                    options={[
                        { label: 'All Courses', value: '' },
                        ...courses.map(c => ({ label: c.title, value: c.id }))
                    ]}
                    value={courseFilter}
                    onChange={(val) => setCourseFilter(val)}
                    className="min-w-[180px]"
                />

                <CustomSelect
                    options={[
                        { label: 'All Statuses', value: '' },
                        { label: 'Scheduled', value: 'scheduled' },
                        { label: 'Live Now', value: 'live' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Cancelled', value: 'cancelled' }
                    ]}
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    className="min-w-[150px]"
                />

                <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-md shadow-sm">
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest animate-pulse">● Live Now:</span>
                    <span className="text-[10px] font-black text-primary-600">{classes.filter(e => e.status === 'live').length}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 bg-white rounded-md border border-gray-100 shadow-sm min-h-[300px]">
                    <LoadingSpinner />
                </div>
            ) : filteredClasses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-gray-50/30 rounded-md border border-dashed border-gray-200">
                    <Video className="w-8 h-8 text-gray-300 mb-3" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">No scheduled classes found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredClasses.map((item) => {
                        const start = new Date(item.startTime);
                        const end = new Date(item.endTime);
                        return (
                            <div key={item.id} className="ent-card group relative p-4 bg-white hover:border-primary-200 hover:shadow-lg transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                            item.status === 'live' 
                                                ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse' 
                                                : item.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : item.status === 'cancelled'
                                                        ? 'bg-gray-50 text-gray-400 border-gray-200 line-through'
                                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                            {item.status === 'live' ? 'Live Now' : item.status}
                                        </span>
                                        <span className="text-[10px] font-mono text-gray-400 font-bold">{item.course?.code}</span>
                                    </div>
                                    <h3 className="text-sm font-black text-gray-900 tracking-tight leading-tight mb-2 group-hover:text-primary-900 transition-colors">{item.title}</h3>
                                    <p className="text-[11px] text-gray-500 line-clamp-2 mb-4">{item.description || 'No session agenda provided'}</p>
                                </div>

                                <div>
                                    <div className="space-y-2 mb-4 bg-gray-50/50 p-2 rounded-md border border-gray-100/50 text-[10px]">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Calendar size={12} className="text-gray-400" />
                                            <span className="font-bold">Date:</span>
                                            <span className="text-gray-900 ml-auto">{start.toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Clock size={12} className="text-gray-400" />
                                            <span className="font-bold">Timeline:</span>
                                            <span className="text-gray-900 ml-auto font-mono">
                                                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {item.meetingLink && item.status !== 'cancelled' && (
                                        <a
                                            href={item.meetingLink.startsWith('http') ? item.meetingLink : `https://${item.meetingLink}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full btn-secondary mb-3 flex items-center justify-center gap-1.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary-900 bg-primary-50/50 hover:bg-primary-100 border border-primary-100"
                                        >
                                            <ExternalLink size={12} /> Launch Meeting Room
                                        </a>
                                    )}

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <PermissionGuard module="OnlineClass" action="update">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="text-[9px] font-black text-primary-600 hover:text-primary-800 uppercase tracking-widest transition-all"
                                                >
                                                    Reschedule
                                                </button>
                                            </PermissionGuard>
                                            <PermissionGuard module="OnlineClass" action="delete">
                                                <button
                                                    onClick={() => setShowDeleteConfirm(item.id)}
                                                    className="text-[9px] font-black text-gray-400 hover:text-rose-600 uppercase tracking-widest transition-colors"
                                                >
                                                    Cancel/Delete
                                                </button>
                                            </PermissionGuard>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-md border border-gray-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="bg-primary-900 text-white p-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest">{editingClass ? 'Reschedule Session' : 'Schedule Online Class'}</h3>
                                <p className="text-[9px] opacity-75 mt-0.5">ESTABLISH VIRTUAL MEETING PARAMETERS</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-white/60 hover:text-white text-sm">✕</button>
                        </div>
                        
                        <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Course Title</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'Select Course Reference', value: '' },
                                            ...courses.map(c => ({
                                                label: `${c.title} (${c.code})`,
                                                value: c.id
                                            }))
                                        ]}
                                        value={formData.courseId}
                                        onChange={(val) => setFormData({ ...formData, courseId: val })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Class Session Title</label>
                                    <input
                                        type="text"
                                        className="ent-input"
                                        required
                                        placeholder="e.g. Live Q&A and Interactive Session 1"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Session Agenda / Description</label>
                                    <textarea
                                        className="ent-input min-h-[60px]"
                                        placeholder="Outline the meeting agenda..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Meeting Room Link (Zoom/Google Meet/etc.)</label>
                                    <input
                                        type="text"
                                        className="ent-input"
                                        required
                                        placeholder="e.g. https://meet.google.com/abc-defg-hij"
                                        value={formData.meetingLink}
                                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        className="ent-input"
                                        required
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">End Time</label>
                                    <input
                                        type="datetime-local"
                                        className="ent-input"
                                        required
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Session Status</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'Scheduled', value: 'scheduled' },
                                            { label: 'Live Now', value: 'live' },
                                            { label: 'Completed', value: 'completed' },
                                            { label: 'Cancelled', value: 'cancelled' }
                                        ]}
                                        value={formData.status}
                                        onChange={(val) => setFormData({ ...formData, status: val as any })}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="ent-button-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary"
                                >
                                    {submitting ? 'Processing...' : editingClass ? 'Reschedule Session' : 'Schedule Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Decommission Scheduled Session"
                message="This will dissolve the scheduled virtual meeting room session and notify enrolled students. This action is irreversible."
                type="danger"
                confirmText="Cancel Session"
            />
        </div>
    );
}
