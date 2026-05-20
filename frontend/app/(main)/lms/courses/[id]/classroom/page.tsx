'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { courseApi, lectureApi, examApi, Course, Lecture, Exam, ExamQuestion } from '@/lib/api/lms';
import {
    BookOpen, ChevronLeft, PlayCircle, CheckCircle, Circle, Lock,
    ClipboardList, Award, ChevronRight, Video, FileText, Trophy,
    ArrowRight, RotateCcw, X
} from 'lucide-react';

type View = 'syllabus' | 'lecture' | 'exam' | 'result';

export default function ClassroomPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const toast = useToast();
    const { user } = usePermission();

    const [course, setCourse] = useState<Course | null>(null);
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);

    // View state
    const [view, setView] = useState<View>('syllabus');
    const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
    const [examLoading, setExamLoading] = useState(false);

    // Exam taking state
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Marking lecture complete
    const [markingComplete, setMarkingComplete] = useState(false);

    useEffect(() => {
        if (id) loadAll();
    }, [id]);

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
            toast.error('Failed to load classroom data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Progress calculation
    const completedCount = useMemo(() => lectures.filter(l => l.completed).length, [lectures]);
    const totalLectures = lectures.length;
    const progressPercent = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

    // ─── Lecture Actions ─────────────────────────────────────────────
    const openLecture = (lecture: Lecture) => {
        setSelectedLecture(lecture);
        setView('lecture');
    };

    const markComplete = async () => {
        if (!selectedLecture) return;
        try {
            setMarkingComplete(true);
            await lectureApi.complete(selectedLecture.id, true);
            toast.success('Lecture marked as completed!');
            // Reload lectures to update progress
            const res = await lectureApi.listByCourse(id);
            setLectures(res.data || []);
            // Update the selected lecture
            const updated = (res.data || []).find((l: Lecture) => l.id === selectedLecture.id);
            if (updated) setSelectedLecture(updated);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to mark lecture');
        } finally {
            setMarkingComplete(false);
        }
    };

    // ─── Exam Actions ────────────────────────────────────────────────
    const startExam = async (exam: Exam) => {
        try {
            setExamLoading(true);
            const res = await examApi.get(exam.id);
            const full = res.data;
            setSelectedExam(full);
            setExamQuestions(full.questions || []);
            setAnswers({});
            setResult(null);

            // Check if already passed
            if (full.submissions?.some((s: any) => s.passed)) {
                setResult({
                    alreadyPassed: true,
                    submission: full.submissions.find((s: any) => s.passed)
                });
                setView('result');
            } else {
                setView('exam');
            }
        } catch (err: any) {
            toast.error('Failed to load exam');
        } finally {
            setExamLoading(false);
        }
    };

    const selectAnswer = (questionId: string, optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const submitExam = async () => {
        if (!selectedExam) return;

        // Check all questions answered
        const unanswered = examQuestions.filter(q => answers[q.id!] === undefined);
        if (unanswered.length > 0) {
            toast.error(`Please answer all questions. ${unanswered.length} remaining.`);
            return;
        }

        try {
            setSubmitting(true);
            const res = await examApi.submit(selectedExam.id, answers);
            setResult(res.data);
            setView('result');
            // Reload to update progress
            loadAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to submit exam');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Video Embed Helper ──────────────────────────────────────────
    const getEmbedUrl = (url: string): string | null => {
        if (!url) return null;
        // YouTube
        const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        // Direct video (mp4, webm)
        if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return url;
        // Default: try iframe embed
        return url;
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
        <div className="flex flex-col gap-0 -mx-2 lg:-mx-4 -mt-2">
            {/* Top Bar */}
            <div className="bg-primary-900 text-white px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => router.push('/lms/courses')} className="text-white/60 hover:text-white transition-colors flex-shrink-0">
                        <ChevronLeft size={18} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-xs font-black uppercase tracking-widest truncate">{course.title}</h1>
                        <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">{course.code}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-md">
                        <span className="text-[9px] font-black uppercase tracking-widest">Progress</span>
                        <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-400">{progressPercent}%</span>
                    </div>
                    <button onClick={() => setView('syllabus')} className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${
                        view === 'syllabus' ? 'bg-white text-primary-900' : 'text-white/60 hover:text-white'
                    }`}>
                        Syllabus
                    </button>
                </div>
            </div>

            {/* ─── SYLLABUS VIEW ──────────────────────────────────────── */}
            {view === 'syllabus' && (
                <div className="px-4 lg:px-6 py-6">
                    {/* Course Info Banner */}
                    <div className="bg-gradient-to-br from-primary-900 to-slate-900 rounded-md p-6 mb-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <h2 className="text-lg font-black tracking-tight mb-1">{course.title}</h2>
                             <div 
                                 className="text-sm text-white/60 mb-4 prose prose-invert max-w-none prose-sm"
                                 dangerouslySetInnerHTML={{ __html: course.description || 'No description provided.' }} 
                             />
                            <div className="flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-widest">
                                <span className="bg-white/10 px-2.5 py-1 rounded">Duration: {course.duration || 'Flexible'}</span>
                                <span className="bg-white/10 px-2.5 py-1 rounded">Lectures: {totalLectures}</span>
                                <span className="bg-white/10 px-2.5 py-1 rounded">Exams: {exams.length}</span>
                                <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded">Completed: {completedCount}/{totalLectures}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Lectures List */}
                        <div className="lg:col-span-8">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Video size={14} className="text-primary-600" />
                                Course Lectures
                            </h3>
                            {lectures.length === 0 ? (
                                <div className="ent-card p-12 text-center">
                                    <Video className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[10px] text-slate-400">No lectures available yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {lectures.map((lec, idx) => (
                                        <button
                                            key={lec.id}
                                            onClick={() => openLecture(lec)}
                                            className={`w-full text-left ent-card p-4 flex items-center gap-4 transition-all group ${
                                                lec.completed
                                                    ? 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200'
                                                    : 'bg-white hover:border-primary-200 hover:shadow-md'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                                                lec.completed ? 'bg-emerald-100' : 'bg-primary-50'
                                            }`}>
                                                {lec.completed ? (
                                                    <CheckCircle size={16} className="text-emerald-600" />
                                                ) : (
                                                    <span className="text-xs font-black text-primary-600">{lec.order || idx + 1}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-primary-900 transition-colors">
                                                    {lec.title}
                                                </h4>
                                                {lec.description && (
                                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{lec.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {lec.videoUrl && <Video size={12} className="text-sky-400" />}
                                                {lec.completed && (
                                                    <span className="text-[8px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">Done</span>
                                                )}
                                                <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-600 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Exams Sidebar */}
                        <div className="lg:col-span-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ClipboardList size={14} className="text-amber-600" />
                                Assessments
                            </h3>
                            {exams.length === 0 ? (
                                <div className="ent-card p-8 text-center">
                                    <ClipboardList className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[10px] text-slate-400">No exams available.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {exams.map(exam => (
                                        <button
                                            key={exam.id}
                                            onClick={() => startExam(exam)}
                                            disabled={examLoading}
                                            className="w-full text-left ent-card p-4 bg-white hover:border-amber-200 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-amber-50 rounded-md group-hover:bg-amber-100 transition-colors flex-shrink-0">
                                                    <ClipboardList size={16} className="text-amber-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-bold text-slate-900 mb-1 group-hover:text-amber-900 transition-colors">{exam.title}</h4>
                                                    <div className="flex gap-2 text-[9px] font-bold text-slate-400">
                                                        <span>{exam._count?.questions || 0} Questions</span>
                                                        <span>•</span>
                                                        <span>Pass: {exam.passingScore}%</span>
                                                    </div>
                                                </div>
                                                <ArrowRight size={14} className="text-slate-300 group-hover:text-amber-600 transition-colors mt-1 flex-shrink-0" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── LECTURE VIEW ───────────────────────────────────────── */}
            {view === 'lecture' && selectedLecture && (
                <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)]">
                    {/* Video / Content Area */}
                    <div className="flex-1 bg-black">
                        {selectedLecture.videoUrl ? (
                            (() => {
                                const embedUrl = getEmbedUrl(selectedLecture.videoUrl);
                                if (selectedLecture.videoUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
                                    return (
                                        <video
                                            controls
                                            className="w-full aspect-video"
                                            src={selectedLecture.videoUrl}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    );
                                }
                                return (
                                    <iframe
                                        src={embedUrl || selectedLecture.videoUrl}
                                        className="w-full aspect-video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                );
                            })()
                        ) : (
                            <div className="w-full aspect-video bg-slate-900 flex items-center justify-center">
                                <div className="text-center">
                                    <FileText size={40} className="text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm">This lecture has text content only.</p>
                                </div>
                            </div>
                        )}

                        {/* Below Video: Content & Actions */}
                        <div className="bg-white p-5 lg:p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight">{selectedLecture.title}</h2>
                                    {selectedLecture.description && (
                                        <div 
                                            className="text-sm text-slate-500 mt-1 prose prose-slate max-w-none prose-sm"
                                            dangerouslySetInnerHTML={{ __html: selectedLecture.description }}
                                        />
                                    )}
                                </div>
                                {!selectedLecture.completed ? (
                                    <button
                                        onClick={markComplete}
                                        disabled={markingComplete}
                                        className="btn-primary flex items-center gap-1.5 flex-shrink-0"
                                    >
                                        {markingComplete ? 'Saving...' : (
                                            <><CheckCircle size={14} /> Mark Complete</>
                                        )}
                                    </button>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-md uppercase tracking-widest flex-shrink-0">
                                        <CheckCircle size={14} /> Completed
                                    </span>
                                )}
                            </div>

                            {/* Reading material */}
                            {selectedLecture.content && (
                                <div className="mt-4 p-4 bg-slate-50 rounded-md border border-slate-100">
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Reading Material</h4>
                                    <div 
                                        className="prose prose-sm max-w-none text-slate-700 text-xs leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: selectedLecture.content }}
                                    />
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                                {(() => {
                                    const currentIdx = lectures.findIndex(l => l.id === selectedLecture.id);
                                    const prevLecture = currentIdx > 0 ? lectures[currentIdx - 1] : null;
                                    const nextLecture = currentIdx < lectures.length - 1 ? lectures[currentIdx + 1] : null;
                                    return (
                                        <>
                                            {prevLecture ? (
                                                <button onClick={() => openLecture(prevLecture)} className="text-[9px] font-black text-slate-500 hover:text-primary-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
                                                    <ChevronLeft size={12} /> Previous Lecture
                                                </button>
                                            ) : <div />}
                                            {nextLecture ? (
                                                <button onClick={() => openLecture(nextLecture)} className="text-[9px] font-black text-primary-600 hover:text-primary-800 uppercase tracking-widest flex items-center gap-1 transition-colors">
                                                    Next Lecture <ChevronRight size={12} />
                                                </button>
                                            ) : <div />}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Side: Lecture List */}
                    <div className="w-full lg:w-80 bg-slate-50 border-l border-slate-200 overflow-y-auto lg:max-h-[calc(100vh-120px)]">
                        <div className="p-3 border-b border-slate-200 bg-white sticky top-0 z-10">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Course Content</h4>
                            <p className="text-[9px] text-slate-400 mt-0.5">{completedCount}/{totalLectures} completed</p>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {lectures.map((lec, idx) => (
                                <button
                                    key={lec.id}
                                    onClick={() => openLecture(lec)}
                                    className={`w-full text-left p-3 flex items-center gap-3 hover:bg-white transition-colors ${
                                        lec.id === selectedLecture.id ? 'bg-primary-50 border-l-2 border-l-primary-600' : ''
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        lec.completed ? 'bg-emerald-500 text-white' : lec.id === selectedLecture.id ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                        {lec.completed ? (
                                            <CheckCircle size={12} />
                                        ) : (
                                            <span className="text-[8px] font-black">{lec.order || idx + 1}</span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-bold truncate ${
                                        lec.id === selectedLecture.id ? 'text-primary-900' : lec.completed ? 'text-slate-500' : 'text-slate-700'
                                    }`}>
                                        {lec.title}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── EXAM VIEW ─────────────────────────────────────────── */}
            {view === 'exam' && selectedExam && (
                <div className="px-4 lg:px-6 py-6 max-w-3xl mx-auto w-full">
                    <div className="mb-6">
                        <button onClick={() => setView('syllabus')} className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-primary-600 mb-3 transition-colors">
                            <ChevronLeft size={12} /> Back to Syllabus
                        </button>
                        <div className="ent-card p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-100 rounded-md">
                                    <ClipboardList size={18} className="text-amber-700" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight">{selectedExam.title}</h2>
                                    {selectedExam.description && (
                                        <div 
                                            className="text-xs text-slate-500 prose prose-slate max-w-none prose-sm"
                                            dangerouslySetInnerHTML={{ __html: selectedExam.description }}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 text-[9px] font-black uppercase tracking-widest text-amber-700 mt-3">
                                <span className="bg-amber-100/80 px-2 py-1 rounded">{examQuestions.length} Questions</span>
                                <span className="bg-amber-100/80 px-2 py-1 rounded">Passing Score: {selectedExam.passingScore}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-5">
                        {examQuestions.map((q, qIdx) => (
                            <div key={q.id} className="ent-card p-5 bg-white">
                                <div className="flex items-start gap-3 mb-4">
                                    <span className="text-[9px] font-black text-white bg-primary-900 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0">
                                        {qIdx + 1}
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{q.questionText}</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-9">
                                    {q.options.map((opt, oIdx) => {
                                        const isSelected = answers[q.id!] === oIdx;
                                        return (
                                            <button
                                                key={oIdx}
                                                onClick={() => selectAnswer(q.id!, oIdx)}
                                                className={`text-left p-3 rounded-md border-2 transition-all text-xs font-bold ${
                                                    isSelected
                                                        ? 'border-primary-500 bg-primary-50 text-primary-900 shadow-sm'
                                                        : 'border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black mr-2 ${
                                                    isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                    {String.fromCharCode(65 + oIdx)}
                                                </span>
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Submit */}
                    <div className="mt-8 flex justify-between items-center">
                        <p className="text-[10px] text-slate-400 font-bold">
                            {Object.keys(answers).length}/{examQuestions.length} answered
                        </p>
                        <button
                            onClick={submitExam}
                            disabled={submitting}
                            className="btn-primary px-8 py-3 text-xs"
                        >
                            {submitting ? 'Grading...' : 'Submit Exam'}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── RESULT VIEW ───────────────────────────────────────── */}
            {view === 'result' && result && (
                <div className="px-4 lg:px-6 py-6 flex items-center justify-center min-h-[60vh]">
                    <div className="max-w-md w-full text-center">
                        {result.alreadyPassed ? (
                            <div className="ent-card p-8 bg-emerald-50/50 border-emerald-100">
                                <Trophy size={48} className="text-amber-500 mx-auto mb-4" />
                                <h2 className="text-xl font-black text-slate-900 mb-2">Already Passed!</h2>
                                <p className="text-sm text-slate-500 mb-4">
                                    You have already passed this exam with a score of <strong>{result.submission?.score}%</strong>.
                                </p>
                                <button onClick={() => setView('syllabus')} className="btn-primary px-6">
                                    Back to Syllabus
                                </button>
                            </div>
                        ) : result.passed ? (
                            <div className="ent-card p-8 bg-gradient-to-br from-emerald-50 to-sky-50 border-emerald-100 shadow-xl">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trophy size={36} className="text-emerald-600" />
                                </div>
                                <h2 className="text-2xl font-black text-emerald-800 mb-1">Congratulations! 🎉</h2>
                                <p className="text-sm text-slate-600 mb-4">You passed the exam!</p>

                                <div className="bg-white rounded-md p-4 mb-6 border border-emerald-100">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                                            <p className="text-2xl font-black text-emerald-600">{result.scorePercentage}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correct</p>
                                            <p className="text-2xl font-black text-slate-900">{result.correctCount}/{result.totalQuestions}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                            <p className="text-lg font-black text-emerald-600">PASSED</p>
                                        </div>
                                    </div>
                                </div>

                                {result.certificateCreated && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                                        <Award size={24} className="text-amber-600 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-amber-800">🏆 Certificate Issued!</p>
                                        <p className="text-[10px] text-amber-600 mt-1">A completion certificate has been generated.</p>
                                        <Link href="/hrms/certificates" className="text-[9px] font-black text-primary-600 uppercase tracking-widest mt-2 inline-block hover:text-primary-800">
                                            View Certificates →
                                        </Link>
                                    </div>
                                )}

                                <button onClick={() => setView('syllabus')} className="btn-primary px-6">
                                    Back to Syllabus
                                </button>
                            </div>
                        ) : (
                            <div className="ent-card p-8 bg-rose-50/50 border-rose-100">
                                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <X size={36} className="text-rose-500" />
                                </div>
                                <h2 className="text-xl font-black text-rose-800 mb-1">Not Quite There</h2>
                                <p className="text-sm text-slate-600 mb-4">You didn't meet the passing score this time.</p>

                                <div className="bg-white rounded-md p-4 mb-6 border border-rose-100">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                                            <p className="text-2xl font-black text-rose-600">{result.scorePercentage}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correct</p>
                                            <p className="text-2xl font-black text-slate-900">{result.correctCount}/{result.totalQuestions}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Required</p>
                                            <p className="text-lg font-black text-amber-600">{selectedExam?.passingScore}%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-center">
                                    <button onClick={() => setView('syllabus')} className="ent-button-secondary px-6">
                                        Back to Syllabus
                                    </button>
                                    <button onClick={() => { if (selectedExam) startExam(selectedExam); }} className="btn-primary px-6 flex items-center gap-1.5">
                                        <RotateCcw size={14} /> Retry Exam
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
