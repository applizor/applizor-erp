'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';
import { courseApi, Course, enrollmentApi, CourseEnrollment } from '@/lib/api/lms';
import { employeesApi, Employee } from '@/lib/api/hrms';
import { PermissionGuard } from '@/components/PermissionGuard';
import { usePermission } from '@/hooks/usePermission';
import { Plus, BookOpen, Search, Filter, Trash2, Edit2, Clock, User, CheckCircle, XCircle, PlayCircle, ChevronRight } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import PageHeader from '@/components/ui/PageHeader';
import { CustomSelect } from '@/components/ui/CustomSelect';
import Link from 'next/link';
import RichTextEditor from '@/components/ui/RichTextEditor';

const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
};


// ─── STUDENT VIEW ───────────────────────────────────────────────────────────
function StudentCoursesView() {
    const toast = useToast();
    const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEnrollments();
    }, []);

    const loadEnrollments = async () => {
        try {
            const res = await enrollmentApi.list();
            setEnrollments(res.data || []);
        } catch {
            toast.error('Failed to load your courses');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="My Courses"
                subtitle="Your enrolled courses and learning progress"
                icon={BookOpen}
            />

            {enrollments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-gray-50/30 rounded-md border border-dashed border-gray-200">
                    <BookOpen className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">No courses enrolled</p>
                    <p className="text-[10px] text-gray-400 mt-1">Contact your administrator for enrollment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enrollments.map(enrollment => (
                        <Link
                            key={enrollment.id}
                            href={`/lms/courses/${enrollment.courseId}/classroom`}
                            className="ent-card p-4 bg-white hover:border-primary-200 hover:shadow-lg transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 bg-primary-50 rounded-md group-hover:bg-primary-100 transition-colors">
                                        <PlayCircle size={18} className="text-primary-600" />
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                        enrollment.status === 'completed'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : enrollment.status === 'active'
                                                ? 'bg-sky-50 text-sky-700 border-sky-100'
                                                : 'bg-gray-50 text-gray-500 border-gray-200'
                                    }`}>
                                        {enrollment.status}
                                    </span>
                                </div>
                                <h3 className="text-sm font-black text-gray-900 tracking-tight leading-tight mb-1 group-hover:text-primary-900 transition-colors">
                                    {enrollment.course?.title || 'Untitled Course'}
                                </h3>
                                <p className="text-[10px] text-gray-400 mb-4">
                                    Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                                    <span className="text-[10px] font-black text-primary-600">{enrollment.progress || 0}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            enrollment.status === 'completed' ? 'bg-emerald-500' : 'bg-primary-500'
                                        }`}
                                        style={{ width: `${enrollment.progress || 0}%` }}
                                    />
                                </div>
                                {enrollment.grade && (
                                    <div className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                                        Grade: {enrollment.grade}
                                    </div>
                                )}
                                <div className="flex items-center justify-end pt-2 text-[9px] font-black text-primary-600 uppercase tracking-widest group-hover:text-primary-800 transition-colors">
                                    Enter Classroom <ChevronRight size={12} className="ml-1" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── ADMIN / INSTRUCTOR VIEW ────────────────────────────────────────────────

export default function CoursesPage() {
    const toast = useToast();
    const { can, user } = usePermission();

    // Students see the enrolled courses view
    const isStudent = user?.roles?.some((r: string) => r.toLowerCase() === 'student');
    if (isStudent) return <StudentCoursesView />;

    const [courses, setCourses] = useState<Course[]>([]);
    const [instructors, setInstructors] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        duration: '',
        instructorId: '',
        status: 'active' as 'active' | 'inactive'
    });
    
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [courseRes, employeeRes] = await Promise.all([
                courseApi.list(),
                employeesApi.getAll()
            ]);
            setCourses(courseRes.data || []);
            setInstructors(employeeRes || []);
        } catch (error) {
            console.error('Failed to load courses data:', error);
            toast.error('Failed to load courses or instructors');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (course?: Course) => {
        if (course) {
            setEditingCourse(course);
            setFormData({
                code: course.code || '',
                title: course.title || '',
                description: course.description || '',
                duration: course.duration || '',
                instructorId: course.instructorId || '',
                status: course.status || 'active'
            });
        } else {
            setEditingCourse(null);
            setFormData({
                code: `CRSE-${Math.floor(100 + Math.random() * 900)}`,
                title: '',
                description: '',
                duration: '',
                instructorId: '',
                status: 'active'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCourse(null);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (editingCourse) {
                await courseApi.update(editingCourse.id, formData);
                toast.success('Course profile updated');
            } else {
                await courseApi.create(formData);
                toast.success('Course created successfully');
            }
            handleCloseModal();
            loadData();
        } catch (error: any) {
            console.error('Failed to submit course form:', error);
            toast.error(error.response?.data?.error || 'Course action failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await courseApi.delete(showDeleteConfirm);
            toast.success('Course purged from directory');
            loadData();
        } catch (error: any) {
            console.error('Delete failed:', error);
            toast.error(error.response?.data?.error || 'Failed to delete course');
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = 
            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === '' || course.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Course Catalog"
                subtitle="Design and structure academic curriculum"
                icon={BookOpen}
                actions={
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <div className="flex-1 lg:w-64 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="QUERY COURSE CODE OR TITLE..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="ent-input w-full pl-9 py-1.5 text-[10px] font-black tracking-widest"
                            />
                        </div>
                        <PermissionGuard module="Course" action="create">
                            <button
                                onClick={() => handleOpenModal()}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus size={14} /> Create Course
                            </button>
                        </PermissionGuard>
                    </div>
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
                        { label: 'All Statuses', value: '' },
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' }
                    ]}
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    className="min-w-[160px]"
                />
                
                <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-md shadow-sm">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Courses:</span>
                    <span className="text-[10px] font-black text-primary-600">{filteredCourses.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 bg-white rounded-md border border-gray-100 shadow-sm min-h-[300px]">
                    <LoadingSpinner />
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-gray-50/30 rounded-md border border-dashed border-gray-200">
                    <BookOpen className="w-8 h-8 text-gray-300 mb-3" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">No courses found in catalog</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCourses.map((course) => (
                        <div key={course.id} className="ent-card group relative p-4 bg-white hover:border-primary-200 hover:shadow-lg transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <span className="font-mono text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">{course.code}</span>
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                        course.status === 'active' 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                            : 'bg-gray-50 text-gray-500 border-gray-200'
                                    }`}>
                                        {course.status}
                                    </span>
                                </div>
                                <h3 className="text-sm font-black text-gray-900 tracking-tight leading-tight mb-2 group-hover:text-primary-900 transition-colors">{course.title}</h3>
                                <p className="text-[11px] text-gray-500 line-clamp-3 mb-4">{stripHtml(course.description) || 'No description provided'}</p>
                            </div>

                            <div>
                                <div className="space-y-2 mb-4 bg-gray-50/50 p-2 rounded-md border border-gray-100/50 text-[10px]">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Clock size={12} className="text-gray-400" />
                                        <span className="font-bold">Duration:</span>
                                        <span className="text-gray-900 ml-auto">{course.duration || 'Flexible'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <User size={12} className="text-gray-400" />
                                        <span className="font-bold">Instructor:</span>
                                        <span className="text-gray-900 ml-auto truncate max-w-[120px]">
                                            {course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : 'Unassigned'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/lms/courses/${course.id}`}
                                            className="text-[9px] font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition-all"
                                        >
                                            Manage Content
                                        </Link>
                                        <PermissionGuard module="Course" action="update">
                                            <button
                                                onClick={() => handleOpenModal(course)}
                                                className="text-[9px] font-black text-primary-600 hover:text-primary-800 uppercase tracking-widest transition-all"
                                            >
                                                Edit Course
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard module="Course" action="delete">
                                            <button
                                                onClick={() => setShowDeleteConfirm(course.id)}
                                                className="text-[9px] font-black text-gray-400 hover:text-rose-600 uppercase tracking-widest transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-md border border-gray-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
                        <div className="bg-primary-900 text-white p-4 flex justify-between items-center flex-shrink-0">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest">{editingCourse ? 'Edit Course Node' : 'Create Course'}</h3>
                                <p className="text-[9px] opacity-75 mt-0.5">REGISTER CURRICULUM ITEM IN ERP</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-white/60 hover:text-white text-sm">✕</button>
                        </div>
                        
                        <form onSubmit={handleFormSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="ent-form-group">
                                    <label className="ent-label">Course Code</label>
                                    <input
                                        type="text"
                                        className="ent-input"
                                        required
                                        placeholder="e.g. CS-101"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Duration</label>
                                    <input
                                        type="text"
                                        className="ent-input"
                                        placeholder="e.g. 8 weeks / 40 hours"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Course Title</label>
                                    <input
                                        type="text"
                                        className="ent-input"
                                        required
                                        placeholder="e.g. Introduction to Computer Science"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Course Description</label>
                                    <RichTextEditor
                                        placeholder="Describe the course syllabus and outcomes..."
                                        value={formData.description}
                                        onChange={(val) => setFormData({ ...formData, description: val })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Instructor (Employee)</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'Unassigned', value: '' },
                                            ...instructors.map(emp => ({
                                                label: `${emp.firstName} ${emp.lastName} (${emp.employeeId || 'No ID'})`,
                                                value: emp.id
                                            }))
                                        ]}
                                        value={formData.instructorId}
                                        onChange={(val) => setFormData({ ...formData, instructorId: val })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Status</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'Active', value: 'active' },
                                            { label: 'Inactive', value: 'inactive' }
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
                                    {submitting ? 'Processing...' : editingCourse ? 'Update Course' : 'Create Course'}
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
                title="Confirm Course Deletion"
                message="This will decouple the course from all registry items. Class enrollments and scheduled classes for this course will be terminated. This action is irreversible."
                type="danger"
                confirmText="Purge Course"
            />
        </div>
    );
}
