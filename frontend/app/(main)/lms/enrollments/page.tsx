'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';
import { enrollmentApi, studentApi, courseApi, CourseEnrollment, Student, Course } from '@/lib/api/lms';
import { PermissionGuard } from '@/components/PermissionGuard';
import { usePermission } from '@/hooks/usePermission';
import { Plus, BookOpen, Users, Search, Filter, Trash2, Edit2, CheckCircle2, Award, Ban } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import PageHeader from '@/components/ui/PageHeader';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function EnrollmentsPage() {
    const toast = useToast();
    const { can } = usePermission();
    
    const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [studentFilter, setStudentFilter] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEnrollment, setEditingEnrollment] = useState<CourseEnrollment | null>(null);
    const [formData, setFormData] = useState({
        studentId: '',
        courseId: '',
        enrollmentDate: '',
        status: 'active' as 'active' | 'completed' | 'dropped',
        progress: 0,
        grade: '',
        score: ''
    });

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [enrollRes, studentRes, courseRes] = await Promise.all([
                enrollmentApi.list(),
                studentApi.list(),
                courseApi.list()
            ]);
            setEnrollments(enrollRes.data || []);
            setStudents(studentRes.data || []);
            setCourses(courseRes.data || []);
        } catch (error) {
            console.error('Failed to load enrollments data:', error);
            toast.error('Failed to synchronize registry cache');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (enrollment?: CourseEnrollment) => {
        if (enrollment) {
            setEditingEnrollment(enrollment);
            setFormData({
                studentId: enrollment.studentId || '',
                courseId: enrollment.courseId || '',
                enrollmentDate: enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toISOString().split('T')[0] : '',
                status: enrollment.status || 'active',
                progress: enrollment.progress || 0,
                grade: enrollment.grade || '',
                score: enrollment.score || ''
            });
        } else {
            setEditingEnrollment(null);
            setFormData({
                studentId: '',
                courseId: '',
                enrollmentDate: new Date().toISOString().split('T')[0],
                status: 'active',
                progress: 0,
                grade: '',
                score: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEnrollment(null);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (editingEnrollment) {
                await enrollmentApi.update(editingEnrollment.id, {
                    ...formData,
                    progress: Number(formData.progress)
                });
                toast.success('Enrollment status synchronized');
            } else {
                await enrollmentApi.create({
                    ...formData,
                    progress: Number(formData.progress)
                });
                toast.success('Student enrolled successfully');
            }
            handleCloseModal();
            loadData();
        } catch (error: any) {
            console.error('Failed to submit enrollment:', error);
            toast.error(error.response?.data?.error || 'Registration sequence interrupted');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await enrollmentApi.delete(showDeleteConfirm);
            toast.success('Enrollment decoupled successfully');
            loadData();
        } catch (error: any) {
            console.error('Purge sequence failed:', error);
            toast.error(error.response?.data?.error || 'Failed to dissolve registration');
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    const filteredEnrollments = enrollments.filter(item => {
        const matchesStudent = studentFilter === '' || item.studentId === studentFilter;
        const matchesCourse = courseFilter === '' || item.courseId === courseFilter;
        const matchesStatus = statusFilter === '' || item.status === statusFilter;
        
        return matchesStudent && matchesCourse && matchesStatus;
    });

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Class Enrollments"
                subtitle="Map student attribution to active courses"
                icon={BookOpen}
                actions={
                    <PermissionGuard module="CourseEnrollment" action="create">
                        <button
                            onClick={() => handleOpenModal()}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={14} /> Enroll Student
                        </button>
                    </PermissionGuard>
                }
            />

            {/* Logical filters */}
            <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-md border border-gray-100">
                <div className="flex items-center gap-2 px-2 text-gray-400">
                    <Filter size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Filter:</span>
                </div>
                
                <CustomSelect
                    options={[
                        { label: 'All Students', value: '' },
                        ...students.map(s => ({ label: `${s.firstName} ${s.lastName}`, value: s.id }))
                    ]}
                    value={studentFilter}
                    onChange={(val) => setStudentFilter(val)}
                    className="min-w-[180px]"
                />

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
                        { label: 'Active Study', value: 'active' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Dropped', value: 'dropped' }
                    ]}
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    className="min-w-[140px]"
                />

                <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-md shadow-sm">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Enrollments:</span>
                    <span className="text-[10px] font-black text-primary-600">{filteredEnrollments.filter(e => e.status === 'active').length}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 bg-white rounded-md border border-gray-100 shadow-sm min-h-[300px]">
                    <LoadingSpinner />
                </div>
            ) : filteredEnrollments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-gray-50/30 rounded-md border border-dashed border-gray-200">
                    <BookOpen className="w-8 h-8 text-gray-300 mb-3" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">No enrollments found in register</p>
                </div>
            ) : (
                <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                    <table className="ent-table w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left p-3">Student</th>
                                <th className="text-left p-3">Course</th>
                                <th className="text-left p-3">Enroll Date</th>
                                <th className="text-center p-3">Progress</th>
                                <th className="text-center p-3">Grade/Score</th>
                                <th className="text-center p-3">Status</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEnrollments.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-3">
                                        <div className="font-semibold text-gray-900">{item.student ? `${item.student.firstName} ${item.student.lastName}` : 'Unknown Student'}</div>
                                        <div className="text-[9px] text-gray-400 uppercase font-bold">{item.student?.studentId}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="font-semibold text-gray-900">{item.course?.title || 'Unknown Course'}</div>
                                        <div className="text-[9px] text-gray-400 font-mono font-bold">{item.course?.code}</div>
                                    </td>
                                    <td className="p-3 text-gray-500 font-mono text-[11px]">
                                        {item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <span className="text-[10px] font-mono font-bold text-gray-700">{item.progress || 0}%</span>
                                            <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-primary-600 h-full rounded-full transition-all"
                                                    style={{ width: `${item.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        {item.grade || item.score ? (
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-[11px] font-black text-gray-900 uppercase">{item.grade || '—'}</span>
                                                {item.score && <span className="text-[9px] text-gray-400 font-mono">({item.score}%)</span>}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                            item.status === 'completed' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                : item.status === 'dropped'
                                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                            {item.status === 'active' ? 'Active Study' : item.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <PermissionGuard module="CourseEnrollment" action="update">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                                    title="Update academic parameters"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                            </PermissionGuard>
                                            <PermissionGuard module="CourseEnrollment" action="delete">
                                                <button
                                                    onClick={() => setShowDeleteConfirm(item.id)}
                                                    className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                                                    title="Dissolve enrollment"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </PermissionGuard>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-md border border-gray-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="bg-primary-900 text-white p-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest">{editingEnrollment ? 'Edit Academic Metrics' : 'Enroll Student'}</h3>
                                <p className="text-[9px] opacity-75 mt-0.5">ESTABLISH ATTRIBUTION MAP IN LMS DATABASE</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-white/60 hover:text-white text-sm">✕</button>
                        </div>
                        
                        <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {!editingEnrollment ? (
                                    <>
                                        <div className="ent-form-group col-span-2">
                                            <label className="ent-label">Student</label>
                                            <CustomSelect
                                                options={[
                                                    { label: 'Select Student', value: '' },
                                                    ...students.map(s => ({
                                                        label: `${s.firstName} ${s.lastName} (${s.studentId})`,
                                                        value: s.id
                                                    }))
                                                ]}
                                                value={formData.studentId}
                                                onChange={(val) => setFormData({ ...formData, studentId: val })}
                                            />
                                        </div>
                                        <div className="ent-form-group col-span-2">
                                            <label className="ent-label">Course</label>
                                            <CustomSelect
                                                options={[
                                                    { label: 'Select Course', value: '' },
                                                    ...courses.map(c => ({
                                                        label: `${c.title} (${c.code})`,
                                                        value: c.id
                                                    }))
                                                ]}
                                                value={formData.courseId}
                                                onChange={(val) => setFormData({ ...formData, courseId: val })}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="col-span-2 bg-gray-50 p-3 rounded-md border border-gray-100 flex flex-col gap-1 mb-2">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enrollment Target</div>
                                        <div className="text-xs font-black text-gray-900">
                                            {editingEnrollment.student ? `${editingEnrollment.student.firstName} ${editingEnrollment.student.lastName}` : 'Student'}
                                        </div>
                                        <div className="text-[10px] font-semibold text-primary-600">
                                            {editingEnrollment.course ? editingEnrollment.course.title : 'Course'}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="ent-form-group">
                                    <label className="ent-label">Enrollment Date</label>
                                    <input
                                        type="date"
                                        className="ent-input"
                                        required
                                        value={formData.enrollmentDate}
                                        onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Status</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'Active Study', value: 'active' },
                                            { label: 'Completed', value: 'completed' },
                                            { label: 'Dropped', value: 'dropped' }
                                        ]}
                                        value={formData.status}
                                        onChange={(val) => setFormData({ ...formData, status: val as any })}
                                    />
                                </div>

                                {editingEnrollment && (
                                    <>
                                        <div className="ent-form-group">
                                            <label className="ent-label">Progress (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="ent-input"
                                                value={formData.progress}
                                                onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="ent-form-group">
                                                <label className="ent-label">Grade</label>
                                                <input
                                                    type="text"
                                                    className="ent-input"
                                                    placeholder="e.g. A+"
                                                    value={formData.grade}
                                                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                                />
                                            </div>
                                            <div className="ent-form-group">
                                                <label className="ent-label">Score (%)</label>
                                                <input
                                                    type="text"
                                                    className="ent-input"
                                                    placeholder="e.g. 95"
                                                    value={formData.score}
                                                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
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
                                    {submitting ? 'Processing...' : editingEnrollment ? 'Update Metrics' : 'Enroll Student'}
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
                title="Dissolve Enrollment Record"
                message="This will immediately decouple the student from this course structure. Academic progress data will be permanently discarded. This action is irreversible."
                type="danger"
                confirmText="Confirm Dissolution"
            />
        </div>
    );
}
