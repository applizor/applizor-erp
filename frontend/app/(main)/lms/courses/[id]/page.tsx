'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import PageHeader from '@/components/ui/PageHeader';
import { courseApi, lectureApi, examApi, Course, Lecture, Exam, ExamQuestion } from '@/lib/api/lms';
import api from '@/lib/api';
import {
    BookOpen, Plus, Trash2, Edit2, GripVertical, Video, FileText,
    ChevronLeft, CheckCircle, XCircle, ClipboardList, Save, X, ArrowUp, ArrowDown,
    Upload, Loader2
} from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';

const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
};


export default function CourseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const toast = useToast();
    const { can, user } = usePermission();

    const [course, setCourse] = useState<Course | null>(null);
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'lectures' | 'exams'>('lectures');

    // Lecture modal
    const [lectureModal, setLectureModal] = useState(false);
    const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
    const [lectureForm, setLectureForm] = useState({ title: '', description: '', videoUrl: '', content: '', order: 0, isActive: true });
    const [lectureSubmitting, setLectureSubmitting] = useState(false);
    const [deleteLectureId, setDeleteLectureId] = useState<string | null>(null);

    // Exam modal
    const [examModal, setExamModal] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [examForm, setExamForm] = useState({ title: '', description: '', passingScore: 60, isActive: true });
    const [questions, setQuestions] = useState<ExamQuestion[]>([]);
    const [examSubmitting, setExamSubmitting] = useState(false);
    const [deleteExamId, setDeleteExamId] = useState<string | null>(null);

    const [uploadingVideo, setUploadingVideo] = useState(false);

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Video file size cannot exceed 10MB due to server limit.");
            return;
        }

        setUploadingVideo(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/upload/editor-asset', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data && response.data.url) {
                setLectureForm(prev => ({ ...prev, videoUrl: response.data.url }));
                toast.success("Video uploaded to S3 successfully!");
            } else {
                toast.error("Upload failed: Invalid response from server");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to upload video to S3");
        } finally {
            setUploadingVideo(false);
        }
    };

    // Student check
    const isStudent = user?.roles?.some((r: string) => r.toLowerCase() === 'student');

    useEffect(() => {
        if (id) loadAll();
    }, [id]);

    useEffect(() => {
        // If student lands here, redirect to classroom
        if (!loading && isStudent) {
            router.replace(`/lms/courses/${id}/classroom`);
        }
    }, [loading, isStudent]);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [courseRes, lectureRes, examRes] = await Promise.all([
                courseApi.get(id),
                lectureApi.listByCourse(id),
                examApi.listByCourse(id),
            ]);
            setCourse(courseRes.data);
            setLectures(lectureRes.data || []);
            setExams(examRes.data || []);
        } catch (err: any) {
            toast.error('Failed to load course details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ─── Lecture Handlers ────────────────────────────────────────────────
    const openLectureModal = (lecture?: Lecture) => {
        if (lecture) {
            setEditingLecture(lecture);
            setLectureForm({
                title: lecture.title,
                description: lecture.description || '',
                videoUrl: lecture.videoUrl || '',
                content: lecture.content || '',
                order: lecture.order,
                isActive: lecture.isActive,
            });
        } else {
            setEditingLecture(null);
            setLectureForm({ title: '', description: '', videoUrl: '', content: '', order: lectures.length + 1, isActive: true });
        }
        setLectureModal(true);
    };

    const saveLecture = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLectureSubmitting(true);
            if (editingLecture) {
                await lectureApi.update(editingLecture.id, lectureForm);
                toast.success('Lecture updated');
            } else {
                await lectureApi.create({ ...lectureForm, courseId: id });
                toast.success('Lecture created');
            }
            setLectureModal(false);
            loadAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to save lecture');
        } finally {
            setLectureSubmitting(false);
        }
    };

    const confirmDeleteLecture = async () => {
        if (!deleteLectureId) return;
        try {
            await lectureApi.delete(deleteLectureId);
            toast.success('Lecture deleted');
            loadAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Delete failed');
        } finally {
            setDeleteLectureId(null);
        }
    };

    // ─── Exam Handlers ──────────────────────────────────────────────────
    const openExamModal = async (exam?: Exam) => {
        if (exam) {
            try {
                const res = await examApi.get(exam.id);
                const full = res.data;
                setEditingExam(full);
                setExamForm({
                    title: full.title,
                    description: full.description || '',
                    passingScore: full.passingScore,
                    isActive: full.isActive,
                });
                setQuestions(full.questions || []);
            } catch {
                toast.error('Failed to load exam details');
                return;
            }
        } else {
            setEditingExam(null);
            setExamForm({ title: '', description: '', passingScore: 60, isActive: true });
            setQuestions([]);
        }
        setExamModal(true);
    };

    const addQuestion = () => {
        setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctOption: 0 }]);
    };

    const updateQuestion = (idx: number, field: string, value: any) => {
        const updated = [...questions];
        (updated[idx] as any)[field] = value;
        setQuestions(updated);
    };

    const updateOption = (qIdx: number, oIdx: number, value: string) => {
        const updated = [...questions];
        updated[qIdx].options[oIdx] = value;
        setQuestions(updated);
    };

    const removeQuestion = (idx: number) => {
        setQuestions(questions.filter((_, i) => i !== idx));
    };

    const saveExam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (questions.length === 0) {
            toast.error('Add at least one question');
            return;
        }
        for (const q of questions) {
            if (!q.questionText.trim()) {
                toast.error('All questions must have text');
                return;
            }
            if (q.options.some(o => !o.trim())) {
                toast.error('All options must be filled');
                return;
            }
        }
        try {
            setExamSubmitting(true);
            if (editingExam) {
                await examApi.update(editingExam.id, { ...examForm, questions });
                toast.success('Exam updated');
            } else {
                await examApi.create({ ...examForm, courseId: id, questions });
                toast.success('Exam created');
            }
            setExamModal(false);
            loadAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to save exam');
        } finally {
            setExamSubmitting(false);
        }
    };

    const confirmDeleteExam = async () => {
        if (!deleteExamId) return;
        try {
            await examApi.delete(deleteExamId);
            toast.success('Exam deleted');
            loadAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Delete failed');
        } finally {
            setDeleteExamId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="text-center py-20">
                <p className="text-sm text-slate-500">Course not found.</p>
                <Link href="/lms/courses" className="text-primary-600 text-xs mt-2 inline-block">← Back to Courses</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <PageHeader
                title={course.title}
                subtitle={`${course.code} • ${course.duration || 'Flexible Duration'}`}
                icon={BookOpen}
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/lms/courses" className="ent-button-secondary flex items-center gap-1.5 text-[10px]">
                            <ChevronLeft size={14} /> Back
                        </Link>
                    </div>
                }
            />

            {/* Tab Switcher */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-md w-fit">
                <button
                    onClick={() => setActiveTab('lectures')}
                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                        activeTab === 'lectures'
                            ? 'bg-white text-primary-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Video size={12} className="inline mr-1.5 -mt-0.5" /> Lectures ({lectures.length})
                </button>
                <button
                    onClick={() => setActiveTab('exams')}
                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                        activeTab === 'exams'
                            ? 'bg-white text-primary-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <ClipboardList size={12} className="inline mr-1.5 -mt-0.5" /> Exams ({exams.length})
                </button>
            </div>

            {/* ─── LECTURES TAB ─────────────────────────────────────────── */}
            {activeTab === 'lectures' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Course Lectures</h2>
                        <PermissionGuard module="Lecture" action="create">
                            <button onClick={() => openLectureModal()} className="btn-primary flex items-center gap-1.5">
                                <Plus size={14} /> Add Lecture
                            </button>
                        </PermissionGuard>
                    </div>

                    {lectures.length === 0 ? (
                        <div className="ent-card p-12 text-center">
                            <Video className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No lectures added yet</p>
                            <p className="text-[10px] text-slate-400 mt-1">Add prerecorded lectures with video URLs and content.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {lectures.map((lec, idx) => (
                                <div
                                    key={lec.id}
                                    className="ent-card p-4 bg-white flex items-center gap-4 hover:border-primary-200 transition-all group"
                                >
                                    <div className="text-slate-300 flex-shrink-0">
                                        <GripVertical size={16} />
                                    </div>
                                    <div className="w-8 h-8 rounded-md bg-primary-50 flex items-center justify-center text-primary-600 font-black text-xs flex-shrink-0">
                                        {lec.order || idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-bold text-slate-900 truncate">{lec.title}</h4>
                                            {lec.videoUrl && <Video size={12} className="text-sky-500 flex-shrink-0" />}
                                        </div>
                                        {lec.description && (
                                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{stripHtml(lec.description)}</p>
                                        )}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                        lec.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {lec.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PermissionGuard module="Lecture" action="update">
                                            <button onClick={() => openLectureModal(lec)} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
                                                <Edit2 size={13} className="text-slate-400" />
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard module="Lecture" action="delete">
                                            <button onClick={() => setDeleteLectureId(lec.id)} className="p-1.5 hover:bg-rose-50 rounded-md transition-colors">
                                                <Trash2 size={13} className="text-rose-400" />
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── EXAMS TAB ───────────────────────────────────────────── */}
            {activeTab === 'exams' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Course Exams</h2>
                        <PermissionGuard module="Exam" action="create">
                            <button onClick={() => openExamModal()} className="btn-primary flex items-center gap-1.5">
                                <Plus size={14} /> Add Exam
                            </button>
                        </PermissionGuard>
                    </div>

                    {exams.length === 0 ? (
                        <div className="ent-card p-12 text-center">
                            <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No exams created</p>
                            <p className="text-[10px] text-slate-400 mt-1">Create exams with MCQ questions for this course.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {exams.map(exam => (
                                <div key={exam.id} className="ent-card p-4 bg-white hover:border-primary-200 hover:shadow-lg transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2 bg-amber-50 rounded-md">
                                            <ClipboardList size={16} className="text-amber-600" />
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                            exam.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            {exam.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-900 mb-1">{exam.title}</h4>
                                    {exam.description && (
                                        <p className="text-[10px] text-slate-400 line-clamp-2 mb-3">{exam.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 mb-4 bg-slate-50 p-2 rounded-md">
                                        <span>Questions: <strong className="text-slate-900">{exam._count?.questions || 0}</strong></span>
                                        <span>Pass: <strong className="text-slate-900">{exam.passingScore}%</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                        <PermissionGuard module="Exam" action="update">
                                            <button onClick={() => openExamModal(exam)} className="text-[9px] font-black text-primary-600 hover:text-primary-800 uppercase tracking-widest transition-all">
                                                Edit Exam
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard module="Exam" action="delete">
                                            <button onClick={() => setDeleteExamId(exam.id)} className="text-[9px] font-black text-slate-400 hover:text-rose-600 uppercase tracking-widest transition-colors">
                                                Delete
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── LECTURE MODAL ────────────────────────────────────────── */}
            {lectureModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-md border border-gray-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
                        <div className="bg-primary-900 text-white p-4 flex justify-between items-center flex-shrink-0">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest">{editingLecture ? 'Edit Lecture' : 'Add Lecture'}</h3>
                                <p className="text-[9px] opacity-75 mt-0.5">PRERECORDED VIDEO CONTENT</p>
                            </div>
                            <button onClick={() => setLectureModal(false)} className="text-white/60 hover:text-white text-sm">✕</button>
                        </div>
                        <form onSubmit={saveLecture} className="p-5 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Title *</label>
                                    <input
                                        type="text" required className="ent-input" placeholder="e.g. Introduction to Variables"
                                        value={lectureForm.title}
                                        onChange={e => setLectureForm({ ...lectureForm, title: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Video URL (YouTube / Vimeo / Direct URL)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text" className="ent-input flex-1" placeholder="https://youtube.com/watch?v=... or S3 URL"
                                            value={lectureForm.videoUrl}
                                            onChange={e => setLectureForm({ ...lectureForm, videoUrl: e.target.value })}
                                        />
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="video/*"
                                                id="lecture-video-upload"
                                                className="hidden"
                                                onChange={handleVideoUpload}
                                                disabled={uploadingVideo}
                                            />
                                            <label
                                                htmlFor="lecture-video-upload"
                                                className={`btn-secondary h-full flex items-center justify-center gap-1.5 px-3 py-2 cursor-pointer text-[10px] font-black uppercase tracking-widest ${uploadingVideo ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {uploadingVideo ? (
                                                    <>
                                                        <Loader2 size={12} className="animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={12} />
                                                        Upload S3
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
                                        Paste a third-party link or upload directly (Max 10MB)
                                    </p>
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Description / Notes</label>
                                    <RichTextEditor
                                        placeholder="Lecture overview, key topics..."
                                        value={lectureForm.description}
                                        onChange={val => setLectureForm({ ...lectureForm, description: val })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Rich Content / Reading Material</label>
                                    <RichTextEditor
                                        placeholder="Additional text content, code snippets, links..."
                                        value={lectureForm.content}
                                        onChange={val => setLectureForm({ ...lectureForm, content: val })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Order</label>
                                    <input
                                        type="number" className="ent-input" min={1}
                                        value={lectureForm.order}
                                        onChange={e => setLectureForm({ ...lectureForm, order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="ent-form-group flex items-end gap-2 pb-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox" checked={lectureForm.isActive}
                                            onChange={e => setLectureForm({ ...lectureForm, isActive: e.target.checked })}
                                            className="accent-primary-600"
                                        />
                                        <span className="text-[10px] font-bold text-slate-600">Active & visible to students</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setLectureModal(false)} className="ent-button-secondary">Cancel</button>
                                <button type="submit" disabled={lectureSubmitting} className="btn-primary">
                                    {lectureSubmitting ? 'Saving...' : editingLecture ? 'Update Lecture' : 'Add Lecture'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── EXAM MODAL ──────────────────────────────────────────── */}
            {examModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-md border border-gray-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
                        <div className="bg-primary-900 text-white p-4 flex justify-between items-center flex-shrink-0">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest">{editingExam ? 'Edit Exam' : 'Create Exam'}</h3>
                                <p className="text-[9px] opacity-75 mt-0.5">MCQ ASSESSMENT WITH AUTO-GRADING</p>
                            </div>
                            <button onClick={() => setExamModal(false)} className="text-white/60 hover:text-white text-sm">✕</button>
                        </div>
                        <form onSubmit={saveExam} className="p-5 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Exam Title *</label>
                                    <input type="text" required className="ent-input" placeholder="e.g. Module 1 Final Quiz"
                                        value={examForm.title}
                                        onChange={e => setExamForm({ ...examForm, title: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group col-span-2">
                                    <label className="ent-label">Description</label>
                                    <RichTextEditor
                                        placeholder="Exam instructions..."
                                        value={examForm.description}
                                        onChange={val => setExamForm({ ...examForm, description: val })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="ent-label">Passing Score (%)</label>
                                    <input type="number" className="ent-input" min={1} max={100}
                                        value={examForm.passingScore}
                                        onChange={e => setExamForm({ ...examForm, passingScore: parseInt(e.target.value) || 60 })}
                                    />
                                </div>
                                <div className="ent-form-group flex items-end gap-2 pb-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={examForm.isActive}
                                            onChange={e => setExamForm({ ...examForm, isActive: e.target.checked })}
                                            className="accent-primary-600"
                                        />
                                        <span className="text-[10px] font-bold text-slate-600">Active</span>
                                    </label>
                                </div>
                            </div>

                            {/* Questions Builder */}
                            <div className="border-t border-slate-100 pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                        Questions ({questions.length})
                                    </h4>
                                    <button type="button" onClick={addQuestion} className="text-[9px] font-black text-primary-600 hover:text-primary-800 uppercase tracking-widest flex items-center gap-1">
                                        <Plus size={12} /> Add Question
                                    </button>
                                </div>

                                {questions.length === 0 && (
                                    <div className="text-center py-6 bg-slate-50 rounded-md border border-dashed border-slate-200">
                                        <p className="text-[10px] text-slate-400">No questions added. Click "Add Question" above.</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {questions.map((q, qIdx) => (
                                        <div key={qIdx} className="bg-slate-50 rounded-md border border-slate-100 p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-[9px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Q{qIdx + 1}</span>
                                                <button type="button" onClick={() => removeQuestion(qIdx)} className="text-rose-400 hover:text-rose-600 transition-colors">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                            <div className="ent-form-group mb-3">
                                                <label className="ent-label">Question Text</label>
                                                <input type="text" className="ent-input" placeholder="What is...?"
                                                    value={q.questionText}
                                                    onChange={e => updateQuestion(qIdx, 'questionText', e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex items-center gap-2">
                                                        <input
                                                            type="radio" name={`correct-${qIdx}`}
                                                            checked={q.correctOption === oIdx}
                                                            onChange={() => updateQuestion(qIdx, 'correctOption', oIdx)}
                                                            className="accent-emerald-600"
                                                            title="Mark as correct answer"
                                                        />
                                                        <input
                                                            type="text" className="ent-input flex-1" placeholder={`Option ${oIdx + 1}`}
                                                            value={opt}
                                                            onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[8px] text-slate-400 mt-2 italic">
                                                Select the radio button next to the correct answer.
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setExamModal(false)} className="ent-button-secondary">Cancel</button>
                                <button type="submit" disabled={examSubmitting} className="btn-primary">
                                    {examSubmitting ? 'Saving...' : editingExam ? 'Update Exam' : 'Create Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Dialogs */}
            <ConfirmDialog
                isOpen={!!deleteLectureId}
                onClose={() => setDeleteLectureId(null)}
                onConfirm={confirmDeleteLecture}
                title="Delete Lecture"
                message="This will permanently remove this lecture and all associated student progress. This action is irreversible."
                type="danger"
                confirmText="Delete Lecture"
            />
            <ConfirmDialog
                isOpen={!!deleteExamId}
                onClose={() => setDeleteExamId(null)}
                onConfirm={confirmDeleteExam}
                title="Delete Exam"
                message="This will permanently remove this exam and all submissions. This action is irreversible."
                type="danger"
                confirmText="Delete Exam"
            />
        </div>
    );
}
